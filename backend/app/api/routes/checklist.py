import uuid
import base64
import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_tenant_id
from app.db.session import get_db
from app.models.checklist import Checklist, ChecklistPhoto
from app.models.user import User
from app.schemas.checklist import ChecklistCreate, ChecklistUpdate, ChecklistResponse

router = APIRouter(prefix="/checklists", tags=["checklists"])

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}
MAX_FILE_SIZE_MB = 10


@router.get("/{appointment_id}", response_model=ChecklistResponse)
async def get_checklist(
    appointment_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Checkliste für einen Auftrag abrufen."""
    result = await db.execute(
        select(Checklist).where(
            Checklist.appointment_id == appointment_id,
            Checklist.tenant_id == tenant_id,
        )
    )
    checklist = result.scalar_one_or_none()
    if not checklist:
        raise HTTPException(status_code=404, detail="Checkliste nicht gefunden")

    # Load photos
    photos_result = await db.execute(
        select(ChecklistPhoto).where(ChecklistPhoto.checklist_id == checklist.id)
    )
    checklist.photos = photos_result.scalars().all()
    return checklist


@router.post("/{appointment_id}", response_model=ChecklistResponse)
async def create_or_update_checklist(
    appointment_id: uuid.UUID,
    data: ChecklistUpdate,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Checkliste erstellen oder aktualisieren."""
    result = await db.execute(
        select(Checklist).where(
            Checklist.appointment_id == appointment_id,
            Checklist.tenant_id == tenant_id,
        )
    )
    checklist = result.scalar_one_or_none()

    if not checklist:
        checklist = Checklist(
            tenant_id=tenant_id,
            appointment_id=appointment_id,
            assigned_to=current_user.id,
        )
        db.add(checklist)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(checklist, field, value)

    if data.status == "completed" and not checklist.completed_at:
        checklist.completed_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(checklist)

    # Load photos for response
    photos_result = await db.execute(
        select(ChecklistPhoto).where(ChecklistPhoto.checklist_id == checklist.id)
    )
    checklist.photos = photos_result.scalars().all()
    return checklist


@router.post("/{appointment_id}/photos", response_model=dict)
async def upload_photo(
    appointment_id: uuid.UUID,
    photo_type: str = Form(...),
    file: UploadFile = File(...),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Foto zur Checkliste hochladen."""
    # Validate mime type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Dateityp nicht erlaubt. Erlaubt: {', '.join(ALLOWED_MIME_TYPES)}"
        )

    # Validate file size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"Datei zu groß. Maximum: {MAX_FILE_SIZE_MB} MB"
        )

    # Ensure checklist exists
    result = await db.execute(
        select(Checklist).where(
            Checklist.appointment_id == appointment_id,
            Checklist.tenant_id == tenant_id,
        )
    )
    checklist = result.scalar_one_or_none()
    if not checklist:
        checklist = Checklist(
            tenant_id=tenant_id,
            appointment_id=appointment_id,
            assigned_to=current_user.id,
            status="in_progress",
        )
        db.add(checklist)
        await db.flush()

    # Try Supabase Storage if configured, otherwise use base64 data URL
    file_url = _store_file(content, file.filename or "photo.jpg", file.content_type)

    photo = ChecklistPhoto(
        checklist_id=checklist.id,
        photo_type=photo_type,
        file_url=file_url,
        file_name=file.filename,
        mime_type=file.content_type,
    )
    db.add(photo)
    await db.commit()

    return {"ok": True, "file_url": file_url, "photo_type": photo_type}


def _store_file(content: bytes, filename: str, mime_type: str) -> str:
    """
    Speichert die Datei.
    - In Produktion: Supabase Storage (wenn SUPABASE_URL konfiguriert ist)
    - Fallback: Base64-Data-URL (für lokale Entwicklung, SQLite)
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

    if supabase_url and supabase_key:
        try:
            from supabase import create_client
            supabase = create_client(supabase_url, supabase_key)
            path = f"checklists/{uuid.uuid4()}/{filename}"
            supabase.storage.from_("checklist-photos").upload(
                path, content, {"content-type": mime_type}
            )
            return f"{supabase_url}/storage/v1/object/public/checklist-photos/{path}"
        except Exception as e:
            # Fall through to base64 if Supabase fails
            pass

    # Fallback: Base64 Data URL (local dev)
    b64 = base64.b64encode(content).decode()
    return f"data:{mime_type};base64,{b64}"
