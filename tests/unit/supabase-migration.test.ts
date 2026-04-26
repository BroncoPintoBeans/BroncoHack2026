import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  'supabase/migrations/202604260001_agent_council_schema_followups.sql',
  'utf8',
)

describe('Supabase Agent Verdict migration contract', () => {
  it('creates owner-private case_reports with indexes, constraints, and RLS', () => {
    expect(migration).toMatch(/create table if not exists public\.case_reports/i)
    expect(migration).toMatch(/report_json jsonb not null/i)
    expect(migration).toMatch(/board_summary_json jsonb not null/i)
    expect(migration).toMatch(/unique\s*\(run_id\)/i)
    expect(migration).toMatch(/case_reports_case_created_idx/i)
    expect(migration).toMatch(/case_reports_owner_created_idx/i)
    expect(migration).toMatch(/jsonb_typeof\(report_json\)\s*=\s*'object'/i)
    expect(migration).toMatch(/jsonb_typeof\(board_summary_json\)\s*=\s*'object'/i)
    expect(migration).toMatch(/case_reports_match_run_owner/i)
    expect(migration).toMatch(/alter table public\.case_reports enable row level security/i)
    expect(migration).toMatch(/case_reports owner select/i)
    expect(migration).toMatch(/\(select auth\.uid\(\)\)/i)
  })

  it('extends helper_requests as a board-safe card linked to reports', () => {
    expect(migration).toMatch(/add column if not exists report_id uuid/i)
    expect(migration).toMatch(/add column if not exists title text/i)
    expect(migration).toMatch(/add column if not exists public_summary text/i)
    expect(migration).toMatch(/add column if not exists verdict_label text/i)
    expect(migration).toMatch(/add column if not exists rrr_score numeric/i)
    expect(migration).toMatch(/helper_accepted/i)
    expect(migration).toMatch(/community_helper_request_cards/i)
    expect(migration).not.toMatch(/community_helper_request_cards[\s\S]+join public\.case_reports/i)
  })

  it('creates a private case-media storage bucket scoped by user and case path', () => {
    expect(migration).toMatch(/insert into storage\.buckets[\s\S]+case-media[\s\S]+public[\s\S]+false/i)
    expect(migration).toMatch(/case-media owner upload/i)
    expect(migration).toMatch(/case-media owner read/i)
    expect(migration).toMatch(/storage\.foldername\(name\)\[1\]\s*=\s*\(select auth\.uid\(\)\)::text/i)
  })
})
