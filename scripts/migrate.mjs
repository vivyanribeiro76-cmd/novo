// Safe migration script (ESM): creates only our tables, indexes, function, and RLS policies if they don't exist.
// It will NOT drop or alter other objects not related to this app.

import pg from 'pg'
import fs from 'fs'
import path from 'path'
const { Client } = pg

async function main() {
  let { DATABASE_URL } = process.env
  if ((!DATABASE_URL || DATABASE_URL === '') && process.argv[2]) {
    DATABASE_URL = process.argv[2]
  }
  if (!DATABASE_URL) {
    try {
      const p = path.resolve(process.cwd(), 'scripts', 'dburl.txt')
      if (fs.existsSync(p)) {
        DATABASE_URL = fs.readFileSync(p, 'utf8').trim()
      }
    } catch {}
  }
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not set (pass as env or first CLI arg)')
    process.exit(1)
  }
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    await client.query('begin')

    // 1) Create tables and indexes (idempotent)
    await client.query(`
      create table if not exists public.assistant_settings (
        id uuid primary key default gen_random_uuid(),
        client_id text not null,
        greeting_message text,
        address text,
        working_hours text,
        open_today boolean default false,
        extras jsonb default '{}'::jsonb,
        updated_at timestamptz default now()
      );
      create index if not exists idx_assistant_settings_client on public.assistant_settings(client_id);

      create table if not exists public.conversations (
        id uuid primary key default gen_random_uuid(),
        client_id text not null,
        conversation_id text not null,
        started_at timestamptz not null default now()
      );
      create index if not exists idx_conversations_client on public.conversations(client_id);
      create index if not exists idx_conversations_started_at on public.conversations(started_at);
    `)

    // 2) Function to read x-client-id header in public schema
    await client.query(`
      create or replace function public.request_client_id()
      returns text
      language plpgsql
      stable
      as $func$
      declare
        hdr text;
        j jsonb;
        val text;
      begin
        hdr := current_setting('request.headers', true);
        if hdr is null or hdr = '' then
          return null;
        end if;
        j := hdr::jsonb;
        val := nullif(j->>'x-client-id', '');
        return val;
      end
      $func$;
    `)

    // 3) Enable RLS (idempotent)
    await client.query(`
      alter table public.assistant_settings enable row level security;
      alter table public.conversations enable row level security;
    `)

    // 3.1) Add new columns to assistant_settings if they don't exist yet
    await client.query(`
      do $$
      begin
        if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='assistant_settings' and column_name='telefone') then
          alter table public.assistant_settings add column telefone text;
        end if;
        if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='assistant_settings' and column_name='email') then
          alter table public.assistant_settings add column email text;
        end if;
        if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='assistant_settings' and column_name='site') then
          alter table public.assistant_settings add column site text;
        end if;
        if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='assistant_settings' and column_name='horario_padrao_inicio') then
          alter table public.assistant_settings add column horario_padrao_inicio text;
        end if;
        if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='assistant_settings' and column_name='horario_padrao_fim') then
          alter table public.assistant_settings add column horario_padrao_fim text;
        end if;
        if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='assistant_settings' and column_name='dias_fechado') then
          alter table public.assistant_settings add column dias_fechado text[] default '{}'::text[];
        end if;
        if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='assistant_settings' and column_name='excecoes') then
          alter table public.assistant_settings add column excecoes text[] default '{}'::text[];
        end if;
        if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='assistant_settings' and column_name='respostas_rapidas') then
          alter table public.assistant_settings add column respostas_rapidas text[] default '{}'::text[];
        end if;
      end
      $$;
    `)

    // 4) Create policies only if missing
    await client.query(`
      do $$
      begin
        if not exists (
          select 1 from pg_policies where schemaname='public' and tablename='assistant_settings' and policyname='read settings by client_id'
        ) then
          create policy "read settings by client_id" on public.assistant_settings
            for select using (client_id = coalesce(public.request_client_id(), client_id));
        end if;

        if not exists (
          select 1 from pg_policies where schemaname='public' and tablename='assistant_settings' and policyname='write settings by client_id'
        ) then
          create policy "write settings by client_id" on public.assistant_settings
            for insert with check (client_id = coalesce(public.request_client_id(), client_id));
        end if;

        if not exists (
          select 1 from pg_policies where schemaname='public' and tablename='assistant_settings' and policyname='update settings by client_id'
        ) then
          create policy "update settings by client_id" on public.assistant_settings
            for update using (client_id = coalesce(public.request_client_id(), client_id));
        end if;

        if not exists (
          select 1 from pg_policies where schemaname='public' and tablename='conversations' and policyname='read conv by client_id'
        ) then
          create policy "read conv by client_id" on public.conversations
            for select using (client_id = coalesce(public.request_client_id(), client_id));
        end if;

        if not exists (
          select 1 from pg_policies where schemaname='public' and tablename='conversations' and policyname='insert conv by client_id'
        ) then
          create policy "insert conv by client_id" on public.conversations
            for insert with check (client_id = coalesce(public.request_client_id(), client_id));
        end if;
      end
      $$;
    `)

    await client.query('commit')
    // Ask PostgREST to reload schema cache
    try {
      await client.query("select pg_notify('pgrst', 'reload schema')")
    } catch {}
    console.log('Migration completed successfully.')
  } catch (e) {
    await client.query('rollback')
    console.error('Migration failed:', e)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
