-- =====================================================================
-- 0005: Köp, rabatt-/partnerkoder och statistik
-- Bara servern (hemliga nyckeln) skriver i de här tabellerna.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Rabatt- och partnerkoder (?ref=kod)
-- ---------------------------------------------------------------------
create table public.partner_codes (
  code               text primary key check (code ~ '^[a-z0-9_-]{2,40}$'),
  partner_name       text not null,
  discount_percent   smallint not null default 0 check (discount_percent between 0 and 90),
  commission_percent smallint not null default 0 check (commission_percent between 0 and 100),
  active             boolean not null default true,
  note               text,
  created_at         timestamptz not null default now()
);
alter table public.partner_codes enable row level security;
-- Inga policies: bara servern läser och skriver.

-- ---------------------------------------------------------------------
-- Köp
-- ---------------------------------------------------------------------
create table public.purchases (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid references auth.users (id) on delete set null,
  email                     text,
  country                   text not null default 'se',
  currency                  text not null default 'SEK',
  list_price_minor          integer not null check (list_price_minor > 0),  -- ordinarie pris i öre
  amount_minor              integer not null check (amount_minor > 0),      -- betalt pris i öre
  ref_code                  text references public.partner_codes (code) on delete set null on update cascade,
  discount_percent          smallint not null default 0,
  commission_percent        smallint not null default 0,
  commission_minor          integer not null default 0,
  access_months             smallint not null,
  status                    text not null default 'pending' check (status in ('pending', 'paid', 'refunded', 'expired')),
  stripe_session_id         text unique,
  stripe_payment_intent     text,
  -- Uttryckligt samtycke till direkt leverans (ångerrätten upphör) och till villkoren.
  consent_digital_delivery_at timestamptz not null,
  consent_terms_at          timestamptz not null,
  language                  text,
  created_at                timestamptz not null default now(),
  paid_at                   timestamptz
);
create index purchases_user_idx on public.purchases (user_id);
create index purchases_ref_idx on public.purchases (ref_code) where status = 'paid';
create index purchases_payment_intent_idx on public.purchases (stripe_payment_intent);

alter table public.purchases enable row level security;
create policy "Användare ser sina egna köp"
  on public.purchases for select
  to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- Integritetsvänlig statistik: bara händelse, språk och ev. kod. Ingen användare.
-- ---------------------------------------------------------------------
create table public.analytics_events (
  id         bigint generated always as identity primary key,
  name       text not null check (name in ('free_started', 'free_finished', 'checkout_opened', 'paid')),
  language   text,
  ref_code   text,
  created_at timestamptz not null default now()
);
create index analytics_events_time_idx on public.analytics_events (created_at desc);
alter table public.analytics_events enable row level security;
-- Inga policies: servern sparar via /api/event.

-- ---------------------------------------------------------------------
-- Hjälpfunktioner för betalningen (bara för servern)
-- ---------------------------------------------------------------------

-- Hitta en användare via e-post (för återkommande kunder).
create function public.get_user_id_by_email(p_email text) returns uuid
language sql stable security definer set search_path = '' as $$
  select id from auth.users where lower(email) = lower(trim(p_email)) limit 1;
$$;

-- Flytta övningsdata från en (anonym) användare till en annan, t.ex. när en
-- återkommande kund köper på en ny mobil. Framstegen följer med.
create function public.move_user_data(p_from uuid, p_to uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_from is null or p_to is null or p_from = p_to then return; end if;
  update public.answers set user_id = p_to where user_id = p_from;
  update public.exam_attempts set user_id = p_to where user_id = p_from;
  update public.question_reports set user_id = p_to where user_id = p_from;
  update public.purchases set user_id = p_to where user_id = p_from;
  update public.access_grants set user_id = p_to where user_id = p_from;
end;
$$;

revoke execute on function public.get_user_id_by_email(text) from public, anon, authenticated;
revoke execute on function public.move_user_data(uuid, uuid) from public, anon, authenticated;
grant execute on function public.get_user_id_by_email(text) to service_role;
grant execute on function public.move_user_data(uuid, uuid) to service_role;
