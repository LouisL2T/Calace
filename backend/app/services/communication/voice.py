"""Voice Agent service – handles Twilio voice webhooks for AI-powered phone booking."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.communication import VoiceSession

# TwiML response templates
GREETING_TWIML = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="de-DE" voice="Google.de-DE-Standard-A">
        Willkommen bei {company_name}. Wie kann ich Ihnen helfen?
        Sie können einen Termin vereinbaren, einen bestehenden Termin ändern,
        oder sich nach freien Terminen erkundigen.
    </Say>
    <Gather input="speech" language="de-DE" action="/api/v1/voice/process"
            speechTimeout="3" timeout="10">
        <Say language="de-DE">Bitte sprechen Sie nach dem Ton.</Say>
    </Gather>
</Response>"""

PROCESS_TWIML = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="de-DE" voice="Google.de-DE-Standard-A">{response_text}</Say>
    <Gather input="speech" language="de-DE" action="/api/v1/voice/process"
            speechTimeout="3" timeout="10">
    </Gather>
</Response>"""

GOODBYE_TWIML = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="de-DE" voice="Google.de-DE-Standard-A">
        Vielen Dank für Ihren Anruf. Auf Wiederhören!
    </Say>
    <Hangup/>
</Response>"""


async def handle_incoming_call(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    call_sid: str,
    caller_number: str,
) -> str:
    """Handle new incoming call – create session and return greeting TwiML."""
    session = VoiceSession(
        tenant_id=tenant_id,
        call_sid=call_sid,
        caller_number=caller_number,
        status="active",
    )
    db.add(session)
    await db.commit()

    # Look up tenant name
    from app.models.user import Tenant
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one()

    return GREETING_TWIML.format(company_name=tenant.name)


async def process_speech(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    call_sid: str,
    speech_result: str,
) -> str:
    """Process speech input via AI and return TwiML response."""
    result = await db.execute(
        select(VoiceSession).where(VoiceSession.call_sid == call_sid)
    )
    session = result.scalar_one_or_none()
    if not session:
        return GOODBYE_TWIML

    # Append to transcript
    current_transcript = session.transcript or ""
    session.transcript = current_transcript + f"\nAnrufer: {speech_result}"

    # Use AI to interpret and respond
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    system_prompt = """Du bist ein freundlicher Telefonassistent für einen deutschen Betrieb.
Du hilfst Anrufern, Termine zu buchen, zu ändern oder Informationen zu erhalten.
Antworte kurz und natürlich auf Deutsch (max 2-3 Sätze).
Wenn der Anrufer einen Termin buchen möchte, frage nach: Datum, Uhrzeit, Name, und Art des Auftrags.
Antworte NUR mit dem gesprochenen Text, keine JSON oder Markup."""

    ai_response = await client.messages.create(
        model=settings.AI_MODEL,
        max_tokens=200,
        system=system_prompt,
        messages=[{"role": "user", "content": f"Gesprächsverlauf:\n{session.transcript}\n\nAktuelle Aussage: {speech_result}"}],
    )

    response_text = ai_response.content[0].text
    session.transcript += f"\nAssistent: {response_text}"

    # Check if conversation should end
    farewell_keywords = ["tschüss", "auf wiedersehen", "danke", "bye"]
    if any(kw in speech_result.lower() for kw in farewell_keywords):
        session.status = "completed"
        session.ended_at = datetime.now(timezone.utc)
        await db.commit()
        return GOODBYE_TWIML

    await db.commit()
    return PROCESS_TWIML.format(response_text=response_text)
