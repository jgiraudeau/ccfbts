"""Add tracking system tables

Revision ID: add_tracking_system
Revises: 
Create Date: 2026-02-10

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_tracking_system'
down_revision = None  # Update this with your latest migration
branch_labels = None
depends_on = None


def upgrade():
    # Create deadlines table
    op.create_table(
        'deadlines',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('document_type', sa.String(length=50), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('exam_type', sa.String(length=10), nullable=True),
        sa.Column('is_mandatory', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_deadlines_id'), 'deadlines', ['id'], unique=False)

    # Create submissions table
    op.create_table(
        'submissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('deadline_id', sa.Integer(), nullable=False),
        sa.Column('file_url', sa.String(length=500), nullable=True),
        sa.Column('file_name', sa.String(length=200), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True, server_default='pending'),
        sa.Column('grade', sa.DECIMAL(precision=4, scale=2), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['deadline_id'], ['deadlines.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id', 'deadline_id', name='uix_student_deadline')
    )
    op.create_index(op.f('ix_submissions_id'), 'submissions', ['id'], unique=False)

    # Add stage-related columns to users table (for students)
    op.add_column('users', sa.Column('stage_start_date', sa.Date(), nullable=True))
    op.add_column('users', sa.Column('stage_end_date', sa.Date(), nullable=True))
    op.add_column('users', sa.Column('stage_company', sa.String(length=200), nullable=True))
    op.add_column('users', sa.Column('stage_tutor', sa.String(length=100), nullable=True))


def downgrade():
    # Remove stage columns from users
    op.drop_column('users', 'stage_tutor')
    op.drop_column('users', 'stage_company')
    op.drop_column('users', 'stage_end_date')
    op.drop_column('users', 'stage_start_date')

    # Drop submissions table
    op.drop_index(op.f('ix_submissions_id'), table_name='submissions')
    op.drop_table('submissions')

    # Drop deadlines table
    op.drop_index(op.f('ix_deadlines_id'), table_name='deadlines')
    op.drop_table('deadlines')
