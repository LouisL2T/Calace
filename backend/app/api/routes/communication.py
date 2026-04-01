import uuid

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_tenant_id
from app.db.session import get_db
from app.schemas.communication import (
    SendSMSRequest, SendWhatsAppRequest, AppointmentReminderRequest,
)
from app.services.communication.sms import send_sms, send_whatsapp, send_appointment_reminder
from app.services.communication.voice import handle_incoming_call, process_speech

router = APIRouter(prefix="/communication", tags=["communication"])


@router.post("/sms/send")
async def api_send_sms(
    data: SendSMSRequest,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    log = await send_sms(db, tenant_id, data.recipient, data.message, data.customer_id, data.appointment_id)
    return {"status": "sent", "message_id": str(log.id)}


@router.post("/whatsapp/send")
async def api_send_whatsapp(
    data: SendWhatsAppRequest,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    log = await send_whatsapp(db, tenant_id, data.recipient, data.message, data.customer_id, data.appointment_id)
    return {"status": "sent", "message_id": str(log.id)}


@router.post("/reminder")
async def api_send_reminder(
    data: AppointmentReminderRequest,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    log = await send_appointment_reminder(db, tenant_id, data.appointment_id, data.channel)
    return {"status": "sent", "message_id": str(log.id)}


# --- Voice Agent Webhooks (called by Twilio) ---

@router.post("/voice/incoming")
async def voice_incoming(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Twilio webhook for incoming calls."""
    form = await request.form()
    # Tenant ID passed as query param in Twilio webhook URL config
    tenant_id = uuid.UUID(request.query_params.get("tenant_id", ""))
    twiml = await handle_incoming_call(
        db, tenant_id,
        call_sid=str(form.get("CallSid")),
        caller_number=str(form.get("From")),
    )
    return Response(content=twiml, media_type="application/xml")


@router.post("/voice/process")
async def voice_process(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Twilio webhook for speech processing."""
    form = await request.form()
    tenant_id = uuid.UUID(request.query_params.get("tenant_id", ""))
    twiml = await process_speech(
        db, tenant_id,
        call_sid=str(form.get("CallSid")),
        speech_result=str(form.get("SpeechResult", "")),
    )
    return Response(content=twiml, media_type="application/xml")
