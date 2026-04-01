from uuid import UUID
from pydantic import BaseModel


class SendSMSRequest(BaseModel):
    customer_id: UUID | None = None
    recipient: str
    message: str
    appointment_id: UUID | None = None


class SendWhatsAppRequest(BaseModel):
    customer_id: UUID | None = None
    recipient: str
    message: str
    appointment_id: UUID | None = None


class AppointmentReminderRequest(BaseModel):
    appointment_id: UUID
    channel: str = "sms"  # "sms" | "whatsapp"


class VoiceWebhookRequest(BaseModel):
    """Incoming Twilio voice webhook."""
    CallSid: str
    From: str
    To: str
    CallStatus: str
    SpeechResult: str | None = None


class MessageLogResponse(BaseModel):
    id: UUID
    channel: str
    direction: str
    recipient: str
    content: str
    status: str

    model_config = {"from_attributes": True}
