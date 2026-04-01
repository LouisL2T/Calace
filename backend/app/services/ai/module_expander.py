"""AI Module Expander – interprets user prompts to dynamically add new modules."""
import json
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.modules import ModuleDefinition, TenantModule

MODULE_EXPANSION_PROMPT = """Du bist der Modul-Assistent für Calace.
Der Nutzer möchte ein neues Tool/Modul in seiner App.

Analysiere die Anfrage und erstelle ein Modul-Konzept. Antworte mit:
1. Einer kurzen Bestätigung auf Deutsch
2. Einem JSON-Block:
```json
{
  "module_slug": "slug_name",
  "module_name": "Anzeigename",
  "description": "Beschreibung",
  "icon": "icon-name",
  "category": "kategorie",
  "component_path": "@/components/modules/SlugName",
  "config_schema": {}
}
```

Beispiele für mögliche Module:
- Farbmischverhältnisse → color_mixing
- Schadensdokumentation → damage_documentation
- Ersatzteilkatalog → parts_catalog
- Fahrzeug-Checkliste → vehicle_checklist
- Kostenvoranschlag → cost_estimate

Sei kreativ bei neuen Modulen, die nicht in der Liste sind."""


async def process_module_request(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    prompt: str,
) -> dict:
    """Interpret a user prompt and create/activate a module."""
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    response = await client.messages.create(
        model=settings.AI_MODEL,
        max_tokens=1024,
        system=MODULE_EXPANSION_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )

    reply_text = response.content[0].text
    result = {
        "reply": reply_text,
        "module_slug": None,
        "module_name": None,
        "module_activated": False,
        "component_path": None,
    }

    try:
        json_start = reply_text.rfind("```json")
        if json_start != -1:
            json_end = reply_text.find("```", json_start + 7)
            json_str = reply_text[json_start + 7:json_end].strip()
            parsed = json.loads(json_str)

            slug = parsed["module_slug"]
            result["module_slug"] = slug
            result["module_name"] = parsed["module_name"]
            result["component_path"] = parsed.get("component_path")

            # Check if module already exists
            existing = await db.execute(
                select(ModuleDefinition).where(ModuleDefinition.slug == slug)
            )
            mod = existing.scalar_one_or_none()

            if not mod:
                mod = ModuleDefinition(
                    slug=slug,
                    name=parsed["module_name"],
                    description=parsed.get("description", ""),
                    icon=parsed.get("icon", "puzzle"),
                    category=parsed.get("category", "custom"),
                    component_path=parsed.get("component_path", f"@/components/modules/{slug}"),
                    config_schema=parsed.get("config_schema"),
                    is_builtin=False,
                )
                db.add(mod)
                await db.flush()

            # Activate for tenant
            existing_tm = await db.execute(
                select(TenantModule).where(
                    TenantModule.tenant_id == tenant_id,
                    TenantModule.module_id == mod.id,
                )
            )
            if not existing_tm.scalar_one_or_none():
                tm = TenantModule(
                    tenant_id=tenant_id,
                    module_id=mod.id,
                    is_active=True,
                )
                db.add(tm)
                result["module_activated"] = True

            await db.commit()
    except (json.JSONDecodeError, KeyError, ValueError):
        pass

    return result
