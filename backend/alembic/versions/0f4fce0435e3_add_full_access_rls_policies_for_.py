"""add_full_access_rls_policies_for_postgres

Revision ID: 0f4fce0435e3
Revises: a38673c0272b
Create Date: 2026-04-16

Grant the 'postgres' database role (used by our FastAPI backend) full
access to all public tables.  This is required because we enabled RLS
on those tables to satisfy Supabase's security linter, but the backend
connects as 'postgres' which must bypass those restrictions.

We create a single permissive policy per table that allows ALL
operations for the postgres role.  The anon / authenticated roles
(used by the Supabase JS client / PostgREST) will still be governed
by RLS – they have no policy, so they are implicitly denied.
"""
from typing import Sequence, Union
from alembic import op

revision: str = '0f4fce0435e3'
down_revision: Union[str, None] = 'a38673c0272b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLES = [
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
    "invoice_items",
]


def upgrade() -> None:
    for table in TABLES:
        policy_name = f"backend_full_access_{table}"
        op.execute(f"""
            DO $$ BEGIN
                IF EXISTS (
                    SELECT FROM pg_tables
                    WHERE schemaname = 'public' AND tablename = '{table}'
                ) THEN
                    -- Drop existing policy if it exists to avoid conflicts
                    DROP POLICY IF EXISTS "{policy_name}" ON {table};
                    -- Create a permissive policy for the postgres role
                    CREATE POLICY "{policy_name}"
                    ON {table}
                    AS PERMISSIVE
                    FOR ALL
                    TO postgres
                    USING (true)
                    WITH CHECK (true);
                END IF;
            END $$;
        """)


def downgrade() -> None:
    for table in TABLES:
        policy_name = f"backend_full_access_{table}"
        op.execute(f"""
            DO $$ BEGIN
                IF EXISTS (
                    SELECT FROM pg_tables
                    WHERE schemaname = 'public' AND tablename = '{table}'
                ) THEN
                    DROP POLICY IF EXISTS "{policy_name}" ON {table};
                END IF;
            END $$;
        """)
