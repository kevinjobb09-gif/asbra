-- =====================================================================
-- 0003: Gratisfrågor och tillgång
--
-- Gratisfrågor (is_free) kan alla läsa. Övriga granskade frågor kan bara
-- läsas av den som har en giltig tillgång (köpt, eller given av admin).
-- Det skyddar frågebanken: utan köp går den inte att hämta ens med
-- den publika nyckeln.
-- =====================================================================

-- Admin väljer vilka frågor som är gratis (gratisläget och delbara sidor).
alter table public.questions add column is_free boolean not null default false;

-- ---------------------------------------------------------------------
-- Tillgång: en rad per köp (eller gåva). Skapas av servern, aldrig av användaren.
-- ---------------------------------------------------------------------
create table public.access_grants (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  source            text not null check (source in ('purchase', 'admin', 'gift')),
  starts_at         timestamptz not null default now(),
  expires_at        timestamptz not null,
  stripe_session_id text unique,
  created_at        timestamptz not null default now(),
  check (expires_at > starts_at)
);

create index access_grants_user_idx on public.access_grants (user_id, expires_at desc);

alter table public.access_grants enable row level security;

create policy "Användare ser sin egen tillgång"
  on public.access_grants for select
  to authenticated
  using (user_id = (select auth.uid()));
-- Inga insert/update/delete-policies: bara servern (hemliga nyckeln) kan ge tillgång.

-- Har den inloggade användaren giltig tillgång just nu?
create function public.has_full_access() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.access_grants g
    where g.user_id = auth.uid() and g.starts_at <= now() and g.expires_at > now()
  );
$$;

-- ---------------------------------------------------------------------
-- Nya läsregler
-- ---------------------------------------------------------------------
drop policy "Granskade frågor är publika" on public.questions;
create policy "Granskade gratisfrågor är publika, övriga kräver tillgång"
  on public.questions for select
  to anon, authenticated
  using (status = 'reviewed' and (is_free or (select public.has_full_access())));

drop policy "Översättningar för granskade frågor är publika" on public.question_translations;
create policy "Översättningar följer frågans regler"
  on public.question_translations for select
  to anon, authenticated
  using (exists (
    select 1 from public.questions q
    where q.id = question_id and q.status = 'reviewed'
      and (q.is_free or (select public.has_full_access()))
  ));

drop policy "Användare sparar sina egna svar" on public.answers;
create policy "Användare sparar sina egna svar"
  on public.answers for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.questions q
      where q.id = question_id and q.status = 'reviewed'
        and (q.is_free or (select public.has_full_access()))
    )
  );
