"""SMS & WhatsApp communication via Twilio."""
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.communication import MessageLog, MessageChannel, MessageDirection


async def send_sms(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    recipient: str,
    message: str,
    customer_id: uuid.UUID | None = None,
    appointment_id: uuid.UUID | None = None,
) -> MessageLog:
    """Send SMS via Twilio and log it."""
    from twilio.rest import Client

    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

    tw_message = client.messages.create(
        body=message,
        from_=settings.TWILIO_PHONE_NUMBER,
        to=recipient,
    )

    log = MessageLog(
        tenant_id=tenant_id,
        customer_id=customer_id,
        appointment_id=appointment_id,
        channel=MessageChannel.SMS,
        direction=MessageDirection.OUTBOUND,
        recipient=recipient,
        content=message,
        status=tw_message.status,
        external_id=tw_message.sid,
    )
    db.add(log)
    await db.commit()
    return log


async def send_whatsapp(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    recipient: str,
    message: str,
    customer_id: uuid.UUID | None = None,
    appointment_id: uuid.UUID | None = None,
) -> MessageLog:
    """Send WhatsApp message via Twilio and log it."""
    from twilio.rest import Client

    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

    tw_message = client.messages.create(
        body=message,
        from_=f"whatsapp:{settings.TWILIO_WHATSAPP_NUMBER}",
        to=f"whatsapp:{recipient}",
    )

    log = MessageLog(
        tenant_id=tenant_id,
        customer_id=customer_id,
        appointment_id=appointment_id,
        channel=MessageChannel.WHATSAPP,
        direction=MessageDirection.OUTBOUND,
        recipient=recipient,
        content=message,
        status=tw_message.status,
        external_id=tw_message.sid,
    )
    db.add(log)
    await db.commit()
    return log


async def send_appointment_reminder(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    appointment_id: uuid.UUID,
    channel: str = "sms",
) -> MessageLog:
    """Auto-send appointment reminder to the customer."""
    from sqlalchemy import select
    from app.models.calendar import Appointment
    from app.models.crm import Customer

    result = await db.execute(
        select(Appointment).where(Appointment.id == appointment_id)
    )
    appointment = result.scalar_one()

    if not appointment.customer_id:
        raise ValueError("Appointment has no customer assigned")

    cust_result = await db.execute(
        select(Customer).where(Customer.id == appointment.customer_id)
    )
    customer = cust_result.scalar_one()

    if not customer.phone:
        raise ValueError("Customer has no phone number")

    reminder_text = (
        f"Erinnerung: Ihr Termin '{appointment.title}' ist am "
        f"{appointment.start_time.strftime('%d.%m.%Y um %H:%M')} Uhr. "
        f"Bei Fragen rufen Sie uns gerne an."
    )

    send_fn = send_whatsapp if channel == "whatsapp" else send_sms
    return await send_fn(
        db=db,
        tenant_id=tenant_id,
        recipient=customer.phone,
        message=reminder_text,
        customer_id=customer.id,
        appointment_id=appointment_id,
    )
