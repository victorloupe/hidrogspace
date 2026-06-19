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

-- Limpa políticas anteriores se existirem
drop policy if exists "acesso_total" on budgets;
drop policy if exists "acesso_autenticado" on budgets;

create policy "acesso_autenticado" on budgets
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create or replace function set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- Remove o trigger antigo se existir antes de criar
drop trigger if exists budgets_updated_at on budgets;

create trigger budgets_updated_at
  before update on budgets
  for each row execute function set_updated_at();

-- Tabela de produtos (catálogo para autocomplete nos orçamentos)
create table if not exists products (
  id    uuid primary key default gen_random_uuid(),
  name  text not null,
  price numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table products enable row level security;

-- Limpa políticas anteriores se existirem
drop policy if exists "acesso_total" on products;
drop policy if exists "acesso_autenticado" on products;

create policy "acesso_autenticado" on products
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- Remove o trigger antigo se existir antes de criar
drop trigger if exists products_updated_at on products;

create trigger products_updated_at
  before update on products
  for each row execute function set_updated_at();
