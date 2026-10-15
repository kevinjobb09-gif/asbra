-- =====================================================================
-- 0002: Användarnas svar
-- Varje svar sparas så att vi kan visa resultat, framsteg och repetera fel.
-- Alla besökare får en anonym inloggning direkt, så svaren sparas även utan
-- konto. När man köper kopplas e-posten till samma användare (delmål 7).
-- =====================================================================

create table public.answers (
  id             bigint generated always as identity primary key,
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  question_id    uuid not null references public.questions (id) on delete cascade,
  selected_index smallint not null check (selected_index between 0 and 3),
  is_correct     boolean not null,
  mode           text not null check (mode in ('chapter', 'free', 'exam', 'review')),
  answered_at    timestamptz not null default now()
);

create index answers_user_question_idx on public.answers (user_id, question_id, answered_at desc);
create index answers_user_time_idx on public.answers (user_id, answered_at desc);

alter table public.answers enable row level security;

-- Man ser bara sina egna svar.
create policy "Användare läser sina egna svar"
  on public.answers for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Man kan bara spara svar i eget namn och bara på granskade frågor.
create policy "Användare sparar sina egna svar"
  on public.answers for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.questions q where q.id = question_id and q.status = 'reviewed')
  );

-- Inga policies för update/delete: svar kan inte ändras i efterhand.
