-- =====================================================================
-- 0004: Provförsök (provsimuleringen)
-- Ett försök sparas när man lämnar in. Svaren kopplas till försöket så att
-- resultatsidan kan visa resultat per prov och per kapitel.
-- =====================================================================

create table public.exam_attempts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  country          text not null default 'se',
  question_count   smallint not null check (question_count > 0),
  correct_count    smallint not null check (correct_count >= 0),
  duration_seconds integer not null check (duration_seconds >= 0),
  time_limit_seconds integer not null check (time_limit_seconds > 0),
  timed_out        boolean not null default false,
  started_at       timestamptz not null,
  finished_at      timestamptz not null default now(),
  check (correct_count <= question_count)
);

create index exam_attempts_user_idx on public.exam_attempts (user_id, finished_at desc);

alter table public.exam_attempts enable row level security;

create policy "Användare läser sina egna provförsök"
  on public.exam_attempts for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Provsimuleringen kräver tillgång.
create policy "Användare sparar sina egna provförsök"
  on public.exam_attempts for insert
  to authenticated
  with check (user_id = (select auth.uid()) and (select public.has_full_access()));

-- Svar från provsimuleringen pekar på sitt försök.
alter table public.answers add column exam_attempt_id uuid references public.exam_attempts (id) on delete cascade;
