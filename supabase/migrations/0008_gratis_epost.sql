-- ---------------------------------------------------------------------
-- E-POST FÖRE GRATISFRÅGORNA
-- Besökaren skriver sin e-post innan gratisövningen börjar. Adressen sparas här,
-- kopplad till den anonyma användaren. Den används för gratisövningen och för att
-- fylla i e-postfältet vid köp – INTE för erbjudanden. Erbjudanden får bara gå till
-- dem som har kryssat i samtyckesrutan; de hamnar i e-postlistan (email_signups).
-- ---------------------------------------------------------------------
create table public.free_signups (
  email      text primary key check (email = lower(email) and length(email) between 3 and 320),
  -- Raderas den anonyma användaren (t.ex. "Radera mitt konto") försvinner adressen också.
  user_id    uuid references auth.users (id) on delete cascade,
  language   text,
  created_at timestamptz not null default now()
);
create index free_signups_user_id_idx on public.free_signups (user_id);

alter table public.free_signups enable row level security;
-- Inga policies: bara servern (hemliga nyckeln) läser och skriver.

-- ---------------------------------------------------------------------
-- Gallring: adresser utan samtycke sparas högst 12 månader (se integritetspolicyn).
-- Körs varje natt kl. 03.15 (UTC) av pg_cron i databasen.
-- ---------------------------------------------------------------------
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'gallra-gratis-epost',
  '15 3 * * *',
  $$delete from public.free_signups where created_at < now() - interval '12 months'$$
);
