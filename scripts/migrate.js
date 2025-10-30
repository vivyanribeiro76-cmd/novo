// Safe migration script: creates only our tables, indexes, function, and RLS policies if they don't exist.
// It will NOT drop or alter other objects.

const { Client } = require('pg')

async function main() {
  const { DATABASE_URL } = process.env
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not set')
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

    // 4) Create policies only if missing
    await client.query(`
      do $$
      begin
        if not exists (
          select 1 from pg_policies where schemaname='public' and tablename='assistant_settings' and polname='read settings by client_id'
        ) then
          create policy "read settings by client_id" on public.assistant_settings
            for select using (client_id = coalesce(public.request_client_id(), client_id))
            to anon;
        end if;

        if not exists (
          select 1 from pg_policies where schemaname='public' and tablename='assistant_settings' and polname='write settings by client_id'
        ) then
          create policy "write settings by client_id" on public.assistant_settings
            for insert with check (client_id = coalesce(public.request_client_id(), client_id))
            to anon;
        end if;

        if not exists (
          select 1 from pg_policies where schemaname='public' and tablename='assistant_settings' and polname='update settings by client_id'
        ) then
          create policy "update settings by client_id" on public.assistant_settings
            for update using (client_id = coalesce(public.request_client_id(), client_id))
            to anon;
        end if;

        if not exists (
          select 1 from pg_policies where schemaname='public' and tablename='conversations' and polname='read conv by client_id'
        ) then
          create policy "read conv by client_id" on public.conversations
            for select using (client_id = coalesce(public.request_client_id(), client_id))
            to anon;
        end if;

        if not exists (
          select 1 from pg_policies where schemaname='public' and tablename='conversations' and polname='insert conv by client_id'
        ) then
          create policy "insert conv by client_id" on public.conversations
            for insert with check (client_id = coalesce(public.request_client_id(), client_id))
            to anon;
        end if;
      end
      $$;
    `)

    await client.query('commit')
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
