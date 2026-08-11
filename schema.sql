-- =====================================================================
--  ADRIANO MIRANDA · CORRETOR DE IMÓVEIS
--  Banco de dados Supabase — execute este arquivo inteiro no SQL Editor
--  (Supabase > SQL Editor > New query > colar > Run)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TABELA DE IMÓVEIS
-- ---------------------------------------------------------------------
create table if not exists public.imoveis (
  id             uuid primary key default gen_random_uuid(),
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),

  codigo         text unique,                 -- referência interna: AM-0001
  titulo         text not null,
  finalidade     text not null default 'venda'
                 check (finalidade in ('venda', 'aluguel')),
  tipo           text not null default 'apartamento'
                 check (tipo in ('apartamento','casa','casa_condominio',
                                 'terreno','comercial','galpao','rural')),
  status         text not null default 'disponivel'
                 check (status in ('disponivel','reservado','vendido','alugado')),

  preco          numeric(12,2) not null default 0,
  condominio     numeric(12,2),
  iptu           numeric(12,2),

  quartos        int default 0,
  suites         int default 0,
  banheiros      int default 0,
  vagas          int default 0,
  area_util      numeric(10,2),
  area_total     numeric(10,2),

  bairro         text,
  cidade         text default 'Brasília',
  uf             text default 'DF',
  endereco       text,                        -- só aparece no painel, nunca no site

  descricao      text,
  caracteristicas text[] not null default '{}',
  fotos          text[] not null default '{}',  -- URLs públicas do Storage
  video_url      text,

  destaque       boolean not null default false,
  publicado      boolean not null default true,
  ordem          int not null default 0
);

create index if not exists imoveis_publicado_idx  on public.imoveis (publicado);
create index if not exists imoveis_finalidade_idx on public.imoveis (finalidade);
create index if not exists imoveis_bairro_idx     on public.imoveis (bairro);
create index if not exists imoveis_criado_idx     on public.imoveis (criado_em desc);

-- atualiza o carimbo de data a cada edição
create or replace function public.touch_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end $$;

drop trigger if exists imoveis_touch on public.imoveis;
create trigger imoveis_touch before update on public.imoveis
  for each row execute function public.touch_atualizado_em();

-- gera o código sequencial AM-0001 quando não for informado
create sequence if not exists public.imovel_codigo_seq start 1;

create or replace function public.gera_codigo_imovel()
returns trigger language plpgsql as $$
begin
  if new.codigo is null or new.codigo = '' then
    new.codigo = 'AM-' || lpad(nextval('public.imovel_codigo_seq')::text, 4, '0');
  end if;
  return new;
end $$;

drop trigger if exists imoveis_codigo on public.imoveis;
create trigger imoveis_codigo before insert on public.imoveis
  for each row execute function public.gera_codigo_imovel();


-- ---------------------------------------------------------------------
-- 2. PERFIL DO CORRETOR  (uma linha só — id sempre = 1)
-- ---------------------------------------------------------------------
create table if not exists public.perfil (
  id              int primary key default 1 check (id = 1),
  nome            text default 'Adriano Miranda',
  creci           text default 'CRECI-GO 00000',
  telefone        text default '(61) 9 0000-0000',
  whatsapp        text default '5561900000000',   -- só números, com 55
  email           text default 'contato@adrianomiranda.com.br',
  instagram       text default 'adrianomiranda.corretor',
  cidade_atuacao  text default 'Brasília · DF e Entorno',
  chamada          text default 'O endereço certo não se anuncia. Se apresenta.',
  bio             text default '',
  foto_url        text,
  atualizado_em   timestamptz not null default now()
);

insert into public.perfil (id) values (1) on conflict (id) do nothing;

drop trigger if exists perfil_touch on public.perfil;
create trigger perfil_touch before update on public.perfil
  for each row execute function public.touch_atualizado_em();


-- ---------------------------------------------------------------------
-- 3. MENSAGENS RECEBIDAS PELO SITE
-- ---------------------------------------------------------------------
create table if not exists public.contatos (
  id         uuid primary key default gen_random_uuid(),
  criado_em  timestamptz not null default now(),
  nome       text not null,
  telefone   text not null,
  email      text,
  mensagem   text,
  imovel_id  uuid references public.imoveis(id) on delete set null,
  lido       boolean not null default false
);

create index if not exists contatos_criado_idx on public.contatos (criado_em desc);


-- ---------------------------------------------------------------------
-- 4. SEGURANÇA (RLS) — o site público só lê, o painel escreve
-- ---------------------------------------------------------------------
alter table public.imoveis  enable row level security;
alter table public.perfil   enable row level security;
alter table public.contatos enable row level security;

-- IMÓVEIS: qualquer visitante lê os publicados; só quem está logado altera
drop policy if exists "imoveis_leitura_publica" on public.imoveis;
create policy "imoveis_leitura_publica" on public.imoveis
  for select to anon, authenticated using (publicado = true);

drop policy if exists "imoveis_leitura_painel" on public.imoveis;
create policy "imoveis_leitura_painel" on public.imoveis
  for select to authenticated using (true);

drop policy if exists "imoveis_escrita_painel" on public.imoveis;
create policy "imoveis_escrita_painel" on public.imoveis
  for all to authenticated using (true) with check (true);

-- PERFIL: todo mundo lê, só quem está logado edita
drop policy if exists "perfil_leitura_publica" on public.perfil;
create policy "perfil_leitura_publica" on public.perfil
  for select to anon, authenticated using (true);

drop policy if exists "perfil_escrita_painel" on public.perfil;
create policy "perfil_escrita_painel" on public.perfil
  for all to authenticated using (true) with check (true);

-- CONTATOS: o visitante só consegue enviar; só o painel consegue ler
drop policy if exists "contatos_envio_publico" on public.contatos;
create policy "contatos_envio_publico" on public.contatos
  for insert to anon, authenticated with check (true);

drop policy if exists "contatos_leitura_painel" on public.contatos;
create policy "contatos_leitura_painel" on public.contatos
  for select to authenticated using (true);

drop policy if exists "contatos_edicao_painel" on public.contatos;
create policy "contatos_edicao_painel" on public.contatos
  for update to authenticated using (true) with check (true);

drop policy if exists "contatos_exclusao_painel" on public.contatos;
create policy "contatos_exclusao_painel" on public.contatos
  for delete to authenticated using (true);


-- ---------------------------------------------------------------------
-- 5. ARMAZENAMENTO DAS FOTOS
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('imoveis', 'imoveis', true)
on conflict (id) do nothing;

drop policy if exists "fotos_leitura_publica" on storage.objects;
create policy "fotos_leitura_publica" on storage.objects
  for select to anon, authenticated using (bucket_id = 'imoveis');

drop policy if exists "fotos_envio_painel" on storage.objects;
create policy "fotos_envio_painel" on storage.objects
  for insert to authenticated with check (bucket_id = 'imoveis');

drop policy if exists "fotos_edicao_painel" on storage.objects;
create policy "fotos_edicao_painel" on storage.objects
  for update to authenticated using (bucket_id = 'imoveis');

drop policy if exists "fotos_exclusao_painel" on storage.objects;
create policy "fotos_exclusao_painel" on storage.objects
  for delete to authenticated using (bucket_id = 'imoveis');


-- ---------------------------------------------------------------------
-- 6. IMÓVEL DE EXEMPLO (opcional — apague depois de testar)
-- ---------------------------------------------------------------------
insert into public.imoveis
  (titulo, finalidade, tipo, preco, condominio, quartos, suites, banheiros,
   vagas, area_util, bairro, cidade, uf, descricao, caracteristicas, destaque)
values
  ('Apartamento com vista livre', 'venda', 'apartamento', 1250000, 980,
   3, 1, 3, 2, 142, 'Sudoeste', 'Brasília', 'DF',
   'Andar alto, sol da manhã e vista desimpedida para o Parque da Cidade. '
   'Reformado com marcenaria planejada e piso em porcelanato acetinado.',
   array['Vista livre','Armários planejados','Andar alto','Portaria 24h'],
   true)
on conflict do nothing;

-- =====================================================================
-- PRONTO. Próximo passo: crie o usuário do painel em
-- Authentication > Users > Add user (com e-mail e senha, "Auto Confirm").
-- Não habilite cadastro público — só você deve ter acesso.
-- =====================================================================
