"""enable_rls_for_all_tables

Revision ID: a38673c0272b
Revises: 7707068f264d
Create Date: 2026-04-16 09:39:28.937452
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'a38673c0272b'
down_revision: Union[str, None] = '7707068f264d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    tables = [
        "alembic_version",
        "tenants",
        "ai_conversations",
        "users",
        "customers",
        "dynamic_fields",
        "embedding_store",
        "material_items",
        "tenant_members",
        "module_definitions",
        "tenant_modules",
        "ai_messages",
        "customer_notes",
        "locations",
        "projects",
        "vehicles",
        "voice_sessions",
        "contact_persons",
        "appointments",
        "appointment_assignees",
        "appointment_recurrences",
        "invoices",
        "message_logs",
        "time_entries",
        "invoice_items"
    ]
    for table in tables:
        # Check if table exists before altering
        op.execute(f"DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = '{table}') THEN ALTER TABLE {table} ENABLE ROW LEVEL SECURITY; END IF; END $$;")


def downgrade() -> None:
    tables = [
        "alembic_version",
        "tenants",
        "ai_conversations",
        "users",
        "customers",
        "dynamic_fields",
        "embedding_store",
        "material_items",
        "tenant_members",
        "module_definitions",
        "tenant_modules",
        "ai_messages",
        "customer_notes",
        "locations",
        "projects",
        "vehicles",
        "voice_sessions",
        "contact_persons",
        "appointments",
        "appointment_assignees",
        "appointment_recurrences",
        "invoices",
        "message_logs",
        "time_entries",
        "invoice_items"
    ]
    for table in tables:
        op.execute(f"DO $$ BEGIN IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = '{table}') THEN ALTER TABLE {table} DISABLE ROW LEVEL SECURITY; END IF; END $$;")
