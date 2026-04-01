"""Seed script to populate built-in module definitions."""
import asyncio
from sqlalchemy import select
from app.db.session import async_session
from app.models.modules import ModuleDefinition

BUILTIN_MODULES = [
    {
        "slug": "calendar",
        "name": "Kalender",
        "description": "Dynamische Terminverwaltung mit Drag-and-Drop",
        "icon": "calendar",
        "category": "core",
        "component_path": "@/app/calendar",
        "sort_order": 1,
        "auto_enable_for": {"industries": ["*"]},
    },
    {
        "slug": "crm",
        "name": "Kundenverwaltung",
        "description": "Kundendatenbank mit Historie und Kontaktdaten",
        "icon": "users",
        "category": "core",
        "component_path": "@/app/crm",
        "sort_order": 2,
        "auto_enable_for": {"industries": ["*"]},
    },
    {
        "slug": "time_tracking",
        "name": "Zeiterfassung",
        "description": "Projektbezogene Stoppuhr für Mitarbeiter",
        "icon": "clock",
        "category": "business",
        "component_path": "@/app/timetracking",
        "sort_order": 3,
        "auto_enable_for": {"industries": ["*"]},
    },
    {
        "slug": "invoicing",
        "name": "Rechnungen",
        "description": "Automatisierte Rechnungserstellung aus Terminen",
        "icon": "file-text",
        "category": "business",
        "component_path": "@/app/invoicing",
        "sort_order": 4,
        "auto_enable_for": {"industries": ["*"]},
    },
    {
        "slug": "materials",
        "name": "Materialbestand",
        "description": "Bestandsliste für Verbrauchsmaterial",
        "icon": "package",
        "category": "business",
        "component_path": "@/app/materials",
        "sort_order": 5,
        "auto_enable_for": {"industries": ["werkstatt", "lackierer", "handwerk"]},
    },
    {
        "slug": "vehicles",
        "name": "Fahrzeuge",
        "description": "Fahrzeugdatenbank mit Historie",
        "icon": "car",
        "category": "industry",
        "component_path": "@/components/modules/vehicles",
        "sort_order": 10,
        "auto_enable_for": {"industries": ["werkstatt", "lackierer", "dellendruecker"]},
    },
    {
        "slug": "damage_documentation",
        "name": "Schadensdokumentation",
        "description": "Fotodokumentation und Schadensbewertung",
        "icon": "camera",
        "category": "industry",
        "component_path": "@/components/modules/damage_documentation",
        "sort_order": 11,
        "auto_enable_for": {"industries": ["dellendruecker"]},
    },
    {
        "slug": "photo_upload",
        "name": "Fotos",
        "description": "Projekt- und Schadenfotos hochladen",
        "icon": "image",
        "category": "industry",
        "component_path": "@/components/modules/photo_upload",
        "sort_order": 12,
        "auto_enable_for": {"industries": ["dellendruecker", "lackierer"]},
    },
    {
        "slug": "color_mixing",
        "name": "Farbmischung",
        "description": "Farbmischverhältnisse und Rezepturen",
        "icon": "palette",
        "category": "industry",
        "component_path": "@/components/modules/color_mixing",
        "sort_order": 13,
        "auto_enable_for": {"industries": ["lackierer"]},
    },
    {
        "slug": "parts_catalog",
        "name": "Ersatzteilkatalog",
        "description": "Ersatzteile suchen und bestellen",
        "icon": "wrench",
        "category": "industry",
        "component_path": "@/components/modules/parts_catalog",
        "sort_order": 14,
        "auto_enable_for": {"industries": ["werkstatt"]},
    },
    {
        "slug": "project_management",
        "name": "Projektverwaltung",
        "description": "Projekte und Aufträge verwalten",
        "icon": "folder",
        "category": "business",
        "component_path": "@/components/modules/project_management",
        "sort_order": 6,
        "auto_enable_for": {"industries": ["handwerk", "dienstleister"]},
    },
]


async def seed():
    async with async_session() as db:
        for mod_data in BUILTIN_MODULES:
            existing = await db.execute(
                select(ModuleDefinition).where(ModuleDefinition.slug == mod_data["slug"])
            )
            if not existing.scalar_one_or_none():
                mod = ModuleDefinition(**mod_data, is_builtin=True)
                db.add(mod)
                print(f"  Created module: {mod_data['name']}")
            else:
                print(f"  Exists: {mod_data['name']}")
        await db.commit()
    print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed())
