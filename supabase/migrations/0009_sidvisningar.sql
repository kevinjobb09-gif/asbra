-- =====================================================================
-- 0009: Sidvisningar (besök, tid på sidan, utgångssidor)
--
-- Integritetsvänligt, utan cookie-banner:
--   * ingen IP-adress, ingen webbläsarinfo, ingen användare, ingen e-post
--   * besöks-id:t är ett slumpat nummer som bara finns i webbläsarens minne
--     medan fliken är öppen – det sparas inte i cookies eller localStorage
--   * bara sidans adress utan ?-parametrar
-- Bara servern (hemliga nyckeln) läser och skriver. Ingen policy = ingen
-- besökare kan läsa något, inte ens sina egna rader.
-- =====================================================================

create table public.page_views (
  id          uuid primary key,                       -- slumpas i webbläsaren, används för att fylla i tiden
  visit_id    uuid not null,                          -- samma för alla sidor i ett besök (en flik)
  seq         smallint not null check (seq between 1 and 500), -- sidans ordning i besöket
  path        text not null check (path ~ '^/' and length(path) <= 200),
  language    text,
  duration_ms integer check (duration_ms between 0 and 1800000), -- aktiv tid på sidan, högst 30 min
  created_at  timestamptz not null default now()
);
create index page_views_time_idx on public.page_views (created_at desc);
create index page_views_visit_idx on public.page_views (visit_id, seq);

alter table public.page_views enable row level security;
-- Inga policies: bara servern sparar (via /api/sidvisning) och bara admin ser statistiken.

-- Ny händelse i tratten: besökaren har skrivit sin e-post före gratisfrågorna.
alter table public.analytics_events drop constraint analytics_events_name_check;
alter table public.analytics_events add constraint analytics_events_name_check
  check (name in ('free_email', 'free_started', 'free_finished', 'checkout_opened', 'paid'));

-- Gallring: sidvisningar sparas i 13 månader.
select cron.schedule(
  'gallra-sidvisningar',
  '30 3 * * *',
  $$delete from public.page_views where created_at < now() - interval '13 months'$$
);
