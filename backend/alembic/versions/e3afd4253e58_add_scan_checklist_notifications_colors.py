"""add_scan_checklist_notifications_colors

Revision ID: e3afd4253e58
Revises: 0f4fce0435e3
Create Date: 2026-04-16 17:24:09.408794
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'e3afd4253e58'
down_revision: Union[str, None] = '0f4fce0435e3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Neue Spalten für Scanner-Operator-Workflow in appointments ──────────
    op.add_column('appointments', sa.Column('needs_scan', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('appointments', sa.Column('scan_notified', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('appointments', sa.Column('scan_job_id', sa.String(255), nullable=True))

    # ── 2. Neue Rolle scanner_operator im UserRole Enum (PostgreSQL) ───────────
    # Nur relevant für Postgres; SQLite hat kein native ENUM
    connection = op.get_bind()
    if connection.dialect.name == 'postgresql':
        op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'scanner_operator'")

    # ── 3. Tabelle: notifications ──────────────────────────────────────────────
    op.create_table(
        'notifications',
        sa.Column('id', sa.Uuid(), primary_key=True),
        sa.Column('tenant_id', sa.Uuid(), sa.ForeignKey('tenants.id'), nullable=False, index=True),
        sa.Column('user_id', sa.Uuid(), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('appointment_id', sa.Uuid(), sa.ForeignKey('appointments.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('type', sa.String(100), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('body', sa.Text(), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # ── 4. Tabelle: checklists ─────────────────────────────────────────────────
    op.create_table(
        'checklists',
        sa.Column('id', sa.Uuid(), primary_key=True),
        sa.Column('tenant_id', sa.Uuid(), sa.ForeignKey('tenants.id'), nullable=False, index=True),
        sa.Column('appointment_id', sa.Uuid(), sa.ForeignKey('appointments.id', ondelete='CASCADE'), nullable=False, unique=True, index=True),
        sa.Column('assigned_to', sa.Uuid(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('mileage', sa.Integer(), nullable=True),
        sa.Column('fault_codes', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    )

    # ── 5. Tabelle: checklist_photos ───────────────────────────────────────────
    op.create_table(
        'checklist_photos',
        sa.Column('id', sa.Uuid(), primary_key=True),
        sa.Column('checklist_id', sa.Uuid(), sa.ForeignKey('checklists.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('photo_type', sa.String(100), nullable=False),
        sa.Column('file_url', sa.String(1000), nullable=False),
        sa.Column('file_name', sa.String(255), nullable=True),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # ── 6. Tabelle: color_rules ────────────────────────────────────────────────
    op.create_table(
        'color_rules',
        sa.Column('id', sa.Uuid(), primary_key=True),
        sa.Column('tenant_id', sa.Uuid(), sa.ForeignKey('tenants.id'), nullable=False, index=True),
        sa.Column('label', sa.String(255), nullable=False),
        sa.Column('color', sa.String(7), nullable=False),
        sa.Column('rule_type', sa.String(50), nullable=False),
        sa.Column('reference_id', sa.Uuid(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('color_rules')
    op.drop_table('checklist_photos')
    op.drop_table('checklists')
    op.drop_table('notifications')
    op.drop_column('appointments', 'scan_job_id')
    op.drop_column('appointments', 'scan_notified')
    op.drop_column('appointments', 'needs_scan')
