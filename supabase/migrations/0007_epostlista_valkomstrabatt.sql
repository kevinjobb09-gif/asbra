-- ---------------------------------------------------------------------
-- E-postlista med personlig välkomstrabatt
-- ---------------------------------------------------------------------
-- Den som skriver upp sig på /rabatt får en personlig kod (t.ex. 10 % på första
-- månaden). Koden gäller bara med samma e-postadress och kan användas en gång.

create table public.email_signups (
  email                text primary key check (email = lower(email) and length(email) between 3 and 320),
  code                 text not null unique check (code ~ '^[a-z0-9-]{4,40}$'),
  discount_percent     smallint not null default 10 check (discount_percent between 1 and 90),
  language             text,
  marketing_consent_at timestamptz not null,
  created_at           timestamptz not null default now(),
  used_at              timestamptz,
  used_by              uuid references auth.users (id) on delete set null
);
alter table public.email_signups enable row level security;
-- Inga policies: bara servern läser och skriver.

-- Köpet kommer ihåg vilken välkomstkod som användes (märks som använd när köpet är betalt).
alter table public.purchases
  add column welcome_code text references public.email_signups (code) on delete set null on update cascade;
