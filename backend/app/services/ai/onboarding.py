"""AI Onboarding Service – interprets user industry and activates modules."""
import json
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.modules import ModuleDefinition, TenantModule, DynamicField
from app.models.user import Tenant, TenantIndustry
from app.models.ai import AIConversation, AIMessage

# Industry → module mapping
INDUSTRY_MODULES: dict[str, list[str]] = {
    "dellendruecker": [
        "calendar", "crm", "vehicles", "damage_documentation",
        "photo_upload", "invoicing", "time_tracking",
    ],
    "lackierer": [
        "calendar", "crm", "vehicles", "color_mixing",
        "photo_upload", "invoicing", "materials", "time_tracking",
    ],
    "werkstatt": [
        "calendar", "crm", "vehicles", "invoicing",
        "materials", "time_tracking", "parts_catalog",
    ],
    "handwerk": [
        "calendar", "crm", "invoicing", "materials",
        "time_tracking", "project_management",
    ],
    "dienstleister": [
        "calendar", "crm", "invoicing", "time_tracking",
        "project_management",
    ],
}

# Extra dynamic fields per industry
INDUSTRY_FIELDS: dict[str, list[dict]] = {
    "dellendruecker": [
        {"entity_type": "appointment", "field_name": "damage_type", "field_type": "select",
         "field_options": {"choices": ["Hagel", "Parkdelle", "Großschaden"]}},
        {"entity_type": "appointment", "field_name": "damage_photos", "field_type": "photo"},
        {"entity_type": "customer", "field_name": "insurance_company", "field_type": "text"},
        {"entity_type": "customer", "field_name": "claim_number", "field_type": "text"},
    ],
    "lackierer": [
        {"entity_type": "appointment", "field_name": "paint_code", "field_type": "text"},
        {"entity_type": "appointment", "field_name": "color_variant", "field_type": "text"},
        {"entity_type": "appointment", "field_name": "surface_area_m2", "field_type": "number"},
    ],
    "werkstatt": [
        {"entity_type": "appointment", "field_name": "mileage_km", "field_type": "number"},
        {"entity_type": "appointment", "field_name": "service_type", "field_type": "select",
         "field_options": {"choices": ["Inspektion", "Reparatur", "TÜV", "Reifenwechsel"]}},
    ],
}

ONBOARDING_SYSTEM_PROMPT = """Du bist der KI-Onboarding-Assistent für Calace, eine adaptive Business-Kalender-App.
Deine Aufgabe: Finde heraus, in welcher Branche der Nutzer arbeitet, und aktiviere passende Module.

Du antwortest auf Deutsch, freundlich und professionell.

Wenn du die Branche erkannt hast, antworte mit einem JSON-Block am Ende deiner Nachricht:
```json
{"industry": "branche_slug", "modules": ["modul1", "modul2"], "complete": true}
```

Verfügbare Branchen: dellendruecker, lackierer, werkstatt, handwerk, dienstleister, custom
Verfügbare Module: calendar, crm, vehicles, damage_documentation, photo_upload, invoicing,
time_tracking, materials, color_mixing, parts_catalog, project_management

Frage den Nutzer, was er beruflich macht, wenn es nicht klar ist. Bestätige dann die erkannten Module."""


async def process_onboarding_message(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    user_id: uuid.UUID,
    message: str,
) -> dict:
    """Process a message in the onboarding conversation and return AI response with module activations."""

    # Get or create conversation
    result = await db.execute(
        select(AIConversation).where(
            AIConversation.tenant_id == tenant_id,
            AIConversation.conversation_type == "onboarding",
            AIConversation.status == "active",
        )
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        conversation = AIConversation(
            tenant_id=tenant_id,
            user_id=user_id,
            conversation_type="onboarding",
        )
        db.add(conversation)
        await db.flush()

    # Save user message
    user_msg = AIMessage(
        conversation_id=conversation.id,
        role="user",
        content=message,
    )
    db.add(user_msg)

    # Build message history
    msg_result = await db.execute(
        select(AIMessage)
        .where(AIMessage.conversation_id == conversation.id)
        .order_by(AIMessage.created_at)
    )
    history = msg_result.scalars().all()

    messages = [{"role": "system", "content": ONBOARDING_SYSTEM_PROMPT}]
    for msg in history:
        if msg.role != "system":
            messages.append({"role": msg.role, "content": msg.content})

    # Call AI (Anthropic)
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    response = await client.messages.create(
        model=settings.AI_MODEL,
        max_tokens=1024,
        system=ONBOARDING_SYSTEM_PROMPT,
        messages=[{"role": m["role"], "content": m["content"]} for m in messages if m["role"] != "system"],
    )

    reply_text = response.content[0].text

    # Save assistant message
    assistant_msg = AIMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=reply_text,
    )
    db.add(assistant_msg)

    # Parse JSON from response
    modules_activated = []
    industry_detected = None
    onboarding_complete = False
    dynamic_fields_added = []

    try:
        json_start = reply_text.rfind("```json")
        if json_start != -1:
            json_end = reply_text.find("```", json_start + 7)
            json_str = reply_text[json_start + 7:json_end].strip()
            parsed = json.loads(json_str)

            industry_detected = parsed.get("industry")
            onboarding_complete = parsed.get("complete", False)

            if industry_detected and onboarding_complete:
                # Update tenant
                tenant_result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
                tenant = tenant_result.scalar_one()

                industry_enum = TenantIndustry.CUSTOM
                for ind in TenantIndustry:
                    if ind.value == industry_detected:
                        industry_enum = ind
                        break

                tenant.industry = industry_enum
                tenant.onboarding_completed = True
                tenant.industry_context = {"raw_industry": industry_detected}

                # Activate modules
                module_slugs = parsed.get("modules", INDUSTRY_MODULES.get(industry_detected, []))
                for slug in module_slugs:
                    mod_result = await db.execute(
                        select(ModuleDefinition).where(ModuleDefinition.slug == slug)
                    )
                    mod = mod_result.scalar_one_or_none()
                    if mod:
                        tenant_mod = TenantModule(
                            tenant_id=tenant_id,
                            module_id=mod.id,
                            is_active=True,
                        )
                        db.add(tenant_mod)
                        modules_activated.append(slug)

                # Add industry-specific dynamic fields
                for field_def in INDUSTRY_FIELDS.get(industry_detected, []):
                    field = DynamicField(
                        tenant_id=tenant_id,
                        **field_def,
                    )
                    db.add(field)
                    dynamic_fields_added.append(field_def)

                conversation.status = "completed"
                await db.commit()
    except (json.JSONDecodeError, ValueError):
        pass

    await db.commit()

    return {
        "reply": reply_text,
        "modules_activated": modules_activated,
        "industry_detected": industry_detected,
        "onboarding_complete": onboarding_complete,
        "dynamic_fields_added": dynamic_fields_added,
    }
