"""
ADI-Schnittstellen-Client.

Konfiguration via .env:
  ADI_ENABLED=true/false
  ADI_API_URL=https://adi-software.example.com/api/scanjobs
  ADI_API_KEY=your-api-key-here

Der Payload wird anhand der bekannten ADI-API-Struktur aufgebaut.
Sobald die offizielle ADI-Dokumentation vorliegt, kann das Mapping
in `_build_payload()` angepasst werden, ohne andere Teile des Codes
zu ändern.
"""
import logging
import os
from typing import TYPE_CHECKING

import httpx

if TYPE_CHECKING:
    from app.models.calendar import Appointment

logger = logging.getLogger("calace.adi")


def _is_enabled() -> bool:
    return os.getenv("ADI_ENABLED", "false").lower() in ("1", "true", "yes")


def _build_payload(appointment: "Appointment") -> dict:
    """
    Baut den Payload für die ADI-API auf.
    Passe dieses Mapping an die offizielle ADI-Dokumentation an.
    """
    return {
        "externalId": str(appointment.id),
        "title": appointment.title,
        "description": appointment.description or "",
        "scheduledAt": appointment.start_time.isoformat(),
        "vehicleId": str(appointment.vehicle_id) if appointment.vehicle_id else None,
        "licensePlate": None,   # Wird via Vehicle-Relation befüllt (wenn geladen)
        "orderNumber": appointment.order_number,
        "requestedBy": "calace",
    }


async def create_adi_scan_job(appointment: "Appointment") -> str | None:
    """
    Erstellt einen Scan-Auftrag in der ADI-Software.

    Returns:
        Die ADI-Scan-Job-ID bei Erfolg, None bei Fehler oder wenn deaktiviert.
    """
    if not _is_enabled():
        logger.debug("ADI-Integration deaktiviert (ADI_ENABLED=false)")
        return None

    api_url = os.getenv("ADI_API_URL", "")
    api_key = os.getenv("ADI_API_KEY", "")

    if not api_url:
        logger.warning("ADI_API_URL nicht konfiguriert – Scan-Auftrag übersprungen")
        return None

    payload = _build_payload(appointment)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                api_url,
                json=payload,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "X-Source": "calace",
                },
            )
            response.raise_for_status()
            data = response.json()

            # Erwartete Antwort-Struktur (anpassen wenn ADI-Doku vorliegt)
            job_id = data.get("id") or data.get("jobId") or data.get("scanJobId")
            logger.info(
                "ADI-Scan-Auftrag erstellt: appointment=%s adi_job=%s",
                appointment.id, job_id,
            )
            return str(job_id) if job_id else None

    except httpx.HTTPStatusError as e:
        logger.error(
            "ADI-API HTTP-Fehler: %s %s – %s",
            e.response.status_code, api_url, e.response.text
        )
        return None
    except Exception as e:
        logger.error("ADI-API Fehler: %s – %s", type(e).__name__, str(e))
        return None
