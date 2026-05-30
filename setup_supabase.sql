-- Execute este SQL no Supabase > SQL Editor

create table if not exists budgets (
  id           text primary key,
  tipo         text default 'Orcamento',
  data         text default '',
  issue_iso    text default '',
  due_iso      text default '',
  client_name  text default '',
  total_number numeric default 0,
  client       jsonb default '{}',
  valores      jsonb default '{}',
  extras       jsonb default '{}',
  items        jsonb default '[]',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table budgets enable row level security;

create policy "acesso_total" on budgets
  for all using (true) with check (true);

create or replace function set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger budgets_updated_at
  before update on budgets
  for each row execute function set_updated_at();
