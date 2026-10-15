-- =====================================================================
-- 0006: Månadsprenumeration (ingen bindningstid)
--
-- subscriptions: en rad per Stripe-prenumeration (vem den tillhör, status,
--                när perioden tar slut, om den är uppsagd).
-- payments:      en rad per betald månad (för försäljning och provision).
-- access_grants: en rad per prenumeration som förlängs varje gång en månad betalas.
-- =====================================================================

-- Köp är nu starten av en prenumeration, inte ett antal månader.
alter table public.purchases alter column access_months drop not null;
alter table public.purchases add column stripe_subscription_id text;

alter table public.access_grants add column stripe_subscription_id text unique;
alter table public.access_grants drop constraint access_grants_source_check;
alter table public.access_grants
  add constraint access_grants_source_check check (source in ('purchase', 'subscription', 'admin', 'gift'));

create table public.subscriptions (
  stripe_subscription_id text primary key,
  user_id                uuid references auth.users (id) on delete set null,
  stripe_customer_id     text,
  status                 text not null default 'incomplete',
  cancel_at_period_end   boolean not null default false,
  current_period_end     timestamptz,
  ref_code               text references public.partner_codes (code) on delete set null on update cascade,
  commission_percent     smallint not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index subscriptions_user_idx on public.subscriptions (user_id);
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;
create policy "Användare ser sina egna prenumerationer"
  on public.subscriptions for select
  to authenticated
  using (user_id = (select auth.uid()));

create table public.payments (
  stripe_invoice_id      text primary key,
  stripe_subscription_id text,
  user_id                uuid references auth.users (id) on delete set null,
  amount_minor           integer not null check (amount_minor >= 0),
  currency               text not null default 'SEK',
  ref_code               text references public.partner_codes (code) on delete set null on update cascade,
  commission_minor       integer not null default 0,
  paid_at                timestamptz not null default now()
);
create index payments_ref_idx on public.payments (ref_code);
alter table public.payments enable row level security;
create policy "Användare ser sina egna betalningar"
  on public.payments for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Flytta även prenumerationer och betalningar när en återkommande kund köper på en ny enhet.
create or replace function public.move_user_data(p_from uuid, p_to uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_from is null or p_to is null or p_from = p_to then return; end if;
  update public.answers set user_id = p_to where user_id = p_from;
  update public.exam_attempts set user_id = p_to where user_id = p_from;
  update public.question_reports set user_id = p_to where user_id = p_from;
  update public.purchases set user_id = p_to where user_id = p_from;
  update public.access_grants set user_id = p_to where user_id = p_from;
  update public.subscriptions set user_id = p_to where user_id = p_from;
  update public.payments set user_id = p_to where user_id = p_from;
end;
$$;
revoke execute on function public.move_user_data(uuid, uuid) from public, anon, authenticated;
grant execute on function public.move_user_data(uuid, uuid) to service_role;
