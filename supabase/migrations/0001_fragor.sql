-- =====================================================================
-- 0001: Frågor, översättningar och felrapporter
-- Kör hela filen i Supabase > SQL Editor (se README).
-- =====================================================================

-- Status för en fråga: 'draft' (utkast) eller 'reviewed' (granskad).
create type public.question_status as enum ('draft', 'reviewed');

-- Status för en översättning: 'machine' (maskinöversatt) eller 'reviewed' (granskad av människa).
create type public.translation_status as enum ('machine', 'reviewed');

-- ---------------------------------------------------------------------
-- Frågor
-- ---------------------------------------------------------------------
create table public.questions (
  id               uuid primary key default gen_random_uuid(),
  country          text not null default 'se' check (country ~ '^[a-z]{2}$'),
  chapter          smallint not null check (chapter between 1 and 99),
  section          text not null default '',                 -- avsnitt, t.ex. "3.2 Riksdagen"
  question         text not null check (length(question) between 5 and 500),
  options          text[] not null check (array_length(options, 1) = 4),
  correct_index    smallint not null check (correct_index between 0 and 3),
  explanation      text not null check (length(explanation) between 5 and 2000),
  source_reference text not null check (length(source_reference) > 0), -- källhänvisning
  difficulty       smallint not null default 2 check (difficulty between 1 and 3), -- 1 lätt, 2 medel, 3 svår
  status           public.question_status not null default 'draft',
  review_note      text,             -- t.ex. varning om tvetydigt svar från utkastskriptet
  is_sample        boolean not null default false, -- exempelfrågor som ska bytas ut
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index questions_country_chapter_idx on public.questions (country, chapter) where status = 'reviewed';

-- ---------------------------------------------------------------------
-- Översättningar av förklaringen (frågan och alternativen översätts aldrig)
-- ---------------------------------------------------------------------
create table public.question_translations (
  question_id uuid not null references public.questions (id) on delete cascade,
  language    text not null check (language ~ '^[a-z]{2,3}$'),
  explanation text not null,
  status      public.translation_status not null default 'machine',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (question_id, language)
);

-- ---------------------------------------------------------------------
-- Felrapporter från användare
-- ---------------------------------------------------------------------
create table public.question_reports (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  user_id     uuid references auth.users (id) on delete set null,
  message     text check (length(message) <= 1000),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

create index question_reports_open_idx on public.question_reports (created_at desc) where resolved_at is null;

-- ---------------------------------------------------------------------
-- Uppdatera updated_at automatiskt
-- ---------------------------------------------------------------------
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger questions_updated_at before update on public.questions
  for each row execute function public.set_updated_at();
create trigger question_translations_updated_at before update on public.question_translations
  for each row execute function public.set_updated_at();

-- Om förklaringen ändras stämmer översättningarna inte längre. De tas bort
-- och skapas på nytt av översättningsskriptet.
create function public.clear_stale_translations() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.explanation is distinct from old.explanation then
    delete from public.question_translations where question_id = new.id;
  end if;
  return new;
end;
$$;

create trigger questions_clear_translations after update of explanation on public.questions
  for each row execute function public.clear_stale_translations();

-- =====================================================================
-- SÄKERHET (Row Level Security)
-- Webbläsaren använder den publika nyckeln. Med RLS bestämmer databasen
-- själv vad den får se. Adminsidan och skripten använder den hemliga
-- nyckeln på servern, som går förbi RLS.
-- =====================================================================
alter table public.questions enable row level security;
alter table public.question_translations enable row level security;
alter table public.question_reports enable row level security;

-- Användare får BARA läsa granskade frågor. Utkast syns aldrig.
create policy "Granskade frågor är publika"
  on public.questions for select
  to anon, authenticated
  using (status = 'reviewed');

-- Översättningar syns bara för granskade frågor.
create policy "Översättningar för granskade frågor är publika"
  on public.question_translations for select
  to anon, authenticated
  using (exists (
    select 1 from public.questions q
    where q.id = question_id and q.status = 'reviewed'
  ));

-- Inloggade (även anonyma) användare får rapportera fel i granskade frågor,
-- men bara i eget namn. De kan inte läsa några rapporter.
create policy "Användare kan rapportera fel"
  on public.question_reports for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.questions q where q.id = question_id and q.status = 'reviewed')
  );

-- Inga policies för insert/update/delete på frågor = ingen användare kan ändra dem.
