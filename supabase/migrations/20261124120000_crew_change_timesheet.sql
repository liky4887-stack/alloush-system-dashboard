-- ═══════════════════════════════════════════════════════════════
-- ALLOUSH SYSTEM — CONSOLIDATED SCHEMA (V24)
-- = V23 (untouched) + Crew Change & Timesheet additions
-- All V23 sections preserved verbatim below.
-- New section 12 is PURELY ADDITIVE.
-- ═══════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ================================================================
-- 1. TABLES & ALTERATIONS
-- ================================================================
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_number text unique not null,
  name text not null,
  name_en text,
  position text,
  nationality text,
  rig text,
  passport_id text,
  national_id text,
  phone text,
  address text,
  emergency_phone text,
  birth_date_location text,
  missing_documents text,
  joining_date text,
  is_suspended boolean not null default false,
  auth_expiry_date date,
  health_cert_expiry_date date,
  auth_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.employees
add column if not exists name_en text,
add column if not exists passport_id text,
add column if not exists national_id text,
add column if not exists phone text,
add column if not exists address text,
add column if not exists emergency_phone text,
add column if not exists birth_date_location text,
add column if not exists missing_documents text,
add column if not exists joining_date text,
add column if not exists is_suspended boolean not null default false,
add column if not exists auth_expiry_date date,
add column if not exists health_cert_expiry_date date,
add column if not exists auth_status text not null default 'active',
add column if not exists created_at timestamptz not null default now(),
add column if not exists updated_at timestamptz not null default now();

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('HR','SUPERVISOR')),
  rig text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles
add column if not exists role text,
add column if not exists rig text,
add column if not exists created_at timestamptz not null default now(),
add column if not exists updated_at timestamptz not null default now();

create table if not exists public.cpo_requests (
  id uuid primary key default gen_random_uuid(),
  employee_name text not null,
  employee_number text not null,
  grade text,
  nationality text,
  destination text,
  final_destination text,
  route_stops text[],
  travel_mode text,
  flight_ticket_confirmed boolean not null default false,
  hotel_confirmed boolean not null default false,
  status text not null default 'pending',
  rig text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cpo_requests
add column if not exists grade text,
add column if not exists nationality text,
add column if not exists destination text,
add column if not exists final_destination text,
add column if not exists route_stops text[],
add column if not exists travel_mode text,
add column if not exists flight_ticket_confirmed boolean not null default false,
add column if not exists hotel_confirmed boolean not null default false,
add column if not exists status text not null default 'pending',
add column if not exists rig text,
add column if not exists created_at timestamptz not null default now(),
add column if not exists updated_at timestamptz not null default now();

create table if not exists public.vacation_requests (
  id uuid primary key default gen_random_uuid(),
  employee_number text not null,
  employee_name text not null,
  rig text not null,
  requested_by uuid not null references auth.users(id),
  status text not null default 'pending',
  destination text,
  travel_mode text,
  flight_ticket_confirmed boolean not null default false,
  hotel_confirmed boolean not null default false,
  route_stops text[],
  end_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vacation_requests
add column if not exists destination text,
add column if not exists travel_mode text,
add column if not exists flight_ticket_confirmed boolean not null default false,
add column if not exists hotel_confirmed boolean not null default false,
add column if not exists route_stops text[],
add column if not exists end_date timestamptz,
add column if not exists created_at timestamptz not null default now(),
add column if not exists updated_at timestamptz not null default now();

create table if not exists public.employee_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  employee_number text not null,
  position text,
  nationality text,
  rig text not null,
  requested_by uuid not null references auth.users(id),
  status text not null default 'pending',
  request_type text not null default 'ADD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.employee_requests
add column if not exists position text,
add column if not exists nationality text,
add column if not exists rig text,
add column if not exists requested_by uuid references auth.users(id),
add column if not exists status text not null default 'pending',
add column if not exists request_type text not null default 'ADD',
add column if not exists created_at timestamptz not null default now(),
add column if not exists updated_at timestamptz not null default now();

create table if not exists public.archived_employee_requests (
  id uuid primary key,
  name text not null,
  employee_number text not null,
  position text,
  nationality text,
  rig text not null,
  requested_by uuid,
  status text not null,
  request_type text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  archived_at timestamptz not null default now()
);

create table if not exists public.health_cert_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  employee_number text not null,
  employee_name text not null,
  rig text not null,
  requested_by uuid not null references auth.users(id),
  proposed_date date not null,
  status text not null default 'pending',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.health_cert_requests
add column if not exists employee_id uuid references public.employees(id) on delete cascade,
add column if not exists employee_number text,
add column if not exists employee_name text,
add column if not exists rig text,
add column if not exists requested_by uuid references auth.users(id),
add column if not exists proposed_date date,
add column if not exists status text not null default 'pending',
add column if not exists reviewed_by uuid references auth.users(id),
add column if not exists reviewed_at timestamptz,
add column if not exists created_at timestamptz not null default now(),
add column if not exists updated_at timestamptz not null default now();

create table if not exists public.keepalive (
  id smallint primary key default 1,
  pinged_at timestamptz not null default now()
);
insert into public.keepalive (id) values (1) on conflict (id) do nothing;

-- ================================================================
-- 2. NORMALIZE CONSTRAINTS
-- ================================================================
alter table public.cpo_requests drop constraint if exists cpo_requests_status_check;
alter table public.cpo_requests add constraint cpo_requests_status_check check (status in ('pending','approved','rejected'));
alter table public.vacation_requests drop constraint if exists vacation_requests_status_check;
alter table public.vacation_requests add constraint vacation_requests_status_check check (status in ('pending','approved','denied','completed'));
alter table public.employee_requests drop constraint if exists employee_requests_status_check;
alter table public.employee_requests add constraint employee_requests_status_check check (status in ('pending','approved','denied'));
alter table public.employee_requests drop constraint if exists employee_requests_request_type_check;
alter table public.employee_requests add constraint employee_requests_request_type_check check (request_type in ('ADD','REMOVE'));
alter table public.employees drop constraint if exists employees_auth_status_check;
alter table public.employees add constraint employees_auth_status_check check (auth_status in ('active','ended'));
alter table public.health_cert_requests drop constraint if exists health_cert_requests_status_check;
alter table public.health_cert_requests add constraint health_cert_requests_status_check check (status in ('pending','approved','denied'));
alter table public.user_profiles drop constraint if exists user_profiles_role_check;
alter table public.user_profiles add constraint user_profiles_role_check check (role in ('HR','SUPERVISOR'));

-- ================================================================
-- 3. INDEXES (V22 Optimizations)
-- ================================================================
create index if not exists idx_employees_rig on public.employees (rig);
create index if not exists idx_employees_suspended on public.employees (is_suspended);
create index if not exists idx_employees_name_lower on public.employees (lower(name));
create index if not exists idx_employees_created_id on public.employees (created_at desc, id desc);
create index if not exists idx_cpo_requests_rig on public.cpo_requests (rig);
create index if not exists idx_cpo_requests_status on public.cpo_requests (status);
create index if not exists idx_cpo_requests_created_id on public.cpo_requests (created_at desc, id desc);
create index if not exists idx_vacation_requests_rig on public.vacation_requests (rig);
create index if not exists idx_vacation_requests_status on public.vacation_requests (status);
create index if not exists idx_vacation_requests_requested_by on public.vacation_requests (requested_by);
create index if not exists idx_vacation_requests_created_id on public.vacation_requests (created_at desc, id desc);
create index if not exists idx_employee_requests_rig on public.employee_requests (rig);
create index if not exists idx_employee_requests_status on public.employee_requests (status);
create index if not exists idx_employee_requests_requested_by on public.employee_requests (requested_by);
create index if not exists idx_employee_requests_created_id on public.employee_requests (created_at desc, id desc);
create index if not exists idx_health_cert_requests_rig on public.health_cert_requests (rig);
create index if not exists idx_health_cert_requests_status on public.health_cert_requests (status);
create index if not exists idx_health_cert_requests_employee on public.health_cert_requests (employee_id);
create index if not exists idx_health_cert_requests_created_id on public.health_cert_requests (created_at desc, id desc);
create unique index if not exists uniq_hcr_pending_per_employee on public.health_cert_requests (employee_id) where status = 'pending';

-- ================================================================
-- 4. VIEWS (V22 Security Fixes)
-- ================================================================
create or replace view public.v_unused_indexes 
with (security_invoker = true) as
select relname as table_name, indexrelname as index_name, idx_scan as times_used,
       pg_size_pretty(pg_relation_size(pg_index.indexrelid)) as index_size
from pg_stat_user_indexes
join pg_index on pg_index.indexrelid = pg_stat_user_indexes.indexrelid
where idx_scan = 0 and not indisprimary and not indisunique
order by pg_relation_size(pg_index.indexrelid) desc;
grant select on public.v_unused_indexes to authenticated;

drop materialized view if exists public.mv_rig_stats;
create materialized view public.mv_rig_stats as
select rig, count(*) as total, count(*) filter (where is_suspended) as suspended
from public.employees
group by rig;
create unique index if not exists idx_mv_rig_stats_rig on public.mv_rig_stats (rig);
revoke select on public.mv_rig_stats from anon, authenticated;

create or replace function public.refresh_mv_rig_stats()
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (select public.is_hr()) then raise exception 'not authorized'; end if;
  refresh materialized view concurrently public.mv_rig_stats;
end $$;
revoke all on function public.refresh_mv_rig_stats() from public;
grant execute on function public.refresh_mv_rig_stats() to authenticated;

-- ================================================================
-- 5. HELPER FUNCTIONS
-- ================================================================
create or replace function public.is_hr()
returns boolean language sql stable security definer set search_path = public as $$
select exists (select 1 from public.user_profiles where id = (select auth.uid()) and role = 'HR');
$$;

create or replace function public.is_any_supervisor()
returns boolean language sql stable security definer set search_path = public as $$
select exists (select 1 from public.user_profiles where id = (select auth.uid()) and role = 'SUPERVISOR');
$$;

create or replace function public.is_supervisor_of(target_rig text)
returns boolean language sql stable security definer set search_path = public as $$
select exists (select 1 from public.user_profiles where id = (select auth.uid()) and role = 'SUPERVISOR' and rig = target_rig);
$$;

-- ================================================================
-- 6. TRIGGERS (Restored all missing V21 triggers)
-- ================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_employees_updated on public.employees;
create trigger trg_employees_updated before update on public.employees for each row execute function public.touch_updated_at();
drop trigger if exists trg_user_profiles_updated on public.user_profiles;
create trigger trg_user_profiles_updated before update on public.user_profiles for each row execute function public.touch_updated_at();
drop trigger if exists trg_cpo_requests_updated on public.cpo_requests;
create trigger trg_cpo_requests_updated before update on public.cpo_requests for each row execute function public.touch_updated_at();
drop trigger if exists trg_vacation_requests_updated on public.vacation_requests;
create trigger trg_vacation_requests_updated before update on public.vacation_requests for each row execute function public.touch_updated_at();
drop trigger if exists trg_employee_requests_updated on public.employee_requests;
create trigger trg_employee_requests_updated before update on public.employee_requests for each row execute function public.touch_updated_at();
drop trigger if exists trg_health_cert_requests_updated on public.health_cert_requests;
create trigger trg_health_cert_requests_updated before update on public.health_cert_requests for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, role, rig) values (new.id, 'SUPERVISOR', nullif(new.raw_user_meta_data ->> 'rig', '')) on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- MISSING TRIGGER RESTORED: Guard Employee Protected Columns
create or replace function public.guard_employee_protected_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select public.is_hr()) then return new; end if;
  if new.health_cert_expiry_date is distinct from old.health_cert_expiry_date then
    raise exception 'Supervisors cannot modify health_cert_expiry_date directly. Submit a health certificate request.' using errcode = '42501';
  end if;
  if new.is_suspended is distinct from old.is_suspended then
    raise exception 'Supervisors cannot modify is_suspended.' using errcode = '42501';
  end if;
  if new.auth_status is distinct from old.auth_status then
    raise exception 'Supervisors cannot modify auth_status.' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_employee_protected on public.employees;
create trigger trg_guard_employee_protected before update on public.employees for each row execute function public.guard_employee_protected_columns();

-- MISSING TRIGGER RESTORED: Validate Health Cert Proposal
create or replace function public.validate_health_cert_proposal()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'pending' and new.proposed_date < current_date then
    raise exception 'Proposed health certificate date cannot be in the past.';
  end if;
  return new;
end $$;
drop trigger if exists trg_validate_health_cert_proposal on public.health_cert_requests;
create trigger trg_validate_health_cert_proposal before insert or update on public.health_cert_requests for each row execute function public.validate_health_cert_proposal();

-- MISSING TRIGGER RESTORED: Approve Health Cert Request
create or replace function public.approve_health_cert_request()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.status = 'approved' and (tg_op = 'INSERT' or old.status is distinct from 'approved') then
    update public.employees set health_cert_expiry_date = new.proposed_date where id = new.employee_id;
    if not found then
      raise exception 'Employee % not found for health certificate request %', new.employee_id, new.id;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_approve_health_cert on public.health_cert_requests;
create trigger trg_approve_health_cert after insert or update of status on public.health_cert_requests for each row execute function public.approve_health_cert_request();

-- V22 Fix: Search path applied
create or replace function public.handle_duplicate_employee_insert()
returns trigger language plpgsql set search_path = '' as $$
begin
  if exists (select 1 from public.employees where employee_number = NEW.employee_number) then
    update public.employees
    set name = coalesce(NEW.name, name),
        position = coalesce(NEW.position, position),
        nationality = coalesce(NEW.nationality, nationality),
        rig = coalesce(NEW.rig, rig),
        updated_at = now()
    where employee_number = NEW.employee_number;
    return null;
  end if;
  return NEW;
end;
$$;
drop trigger if exists trg_handle_duplicate_employee_insert on public.employees;
create trigger trg_handle_duplicate_employee_insert before insert on public.employees for each row execute function public.handle_duplicate_employee_insert();

-- ================================================================
-- 7. HR-ONLY RPCs (Restored missing V21 Functions)
-- ================================================================
create or replace function public.hr_update_cpo_request_destination(p_request_id uuid, p_new_destination text)
returns void language plpgsql security definer set search_path = public as $$
declare v_nat text; v_mode text; v_route text[];
begin
  if not (select public.is_hr()) then raise exception 'not authorized'; end if;
  select nationality, travel_mode into v_nat, v_mode from public.cpo_requests where id = p_request_id;
  if not found then raise exception 'request not found'; end if;
  if v_mode = 'car' or v_nat in ('LIBYA','ليبي') then
    v_route := array['الهيب','طرابلس',p_new_destination];
  else
    v_route := array['الهيب','طرابلس','تونس',p_new_destination];
  end if;
  update public.cpo_requests set destination = 'الهيب', final_destination = p_new_destination, route_stops = v_route where id = p_request_id;
end $$;

create or replace function public.delete_employee_cascade(p_employee_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_emp_num text;
begin
  if not (select public.is_hr()) then raise exception 'not authorized'; end if;
  select employee_number into v_emp_num from public.employees where id = p_employee_id;
  if not found then raise exception 'employee not found'; end if;
  delete from public.vacation_requests where employee_number = v_emp_num;
  delete from public.employee_requests where employee_number = v_emp_num;
  delete from public.employees where id = p_employee_id;
end $$;

create or replace function public.hr_approve_employee_request(p_request_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_req record;
begin
  if not (select public.is_hr()) then raise exception 'not authorized'; end if;
  select * into v_req from public.employee_requests where id = p_request_id;
  if not found then raise exception 'request not found'; end if;
  if v_req.status != 'pending' then raise exception 'request already processed'; end if;
  if v_req.request_type = 'ADD' then
    insert into public.employees (employee_number, name, position, nationality, rig)
    values (v_req.employee_number, v_req.name, v_req.position, v_req.nationality, v_req.rig)
    on conflict (employee_number) do update set
      name = excluded.name, position = excluded.position, nationality = excluded.nationality, rig = excluded.rig, updated_at = now();
    update public.employee_requests set status = 'approved' where id = p_request_id;
  elsif v_req.request_type = 'REMOVE' then
    delete from public.employees where employee_number = v_req.employee_number;
    update public.employee_requests set status = 'approved' where id = p_request_id;
  end if;
end $$;

create or replace function public.hr_archive_processed_employee_requests()
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (select public.is_hr()) then raise exception 'not authorized'; end if;
  insert into public.archived_employee_requests (id, name, employee_number, position, nationality, rig, requested_by, status, request_type, created_at, updated_at)
  select id, name, employee_number, position, nationality, rig, requested_by, status, request_type, created_at, updated_at
  from public.employee_requests where status in ('approved', 'denied');
  delete from public.employee_requests where status in ('approved', 'denied');
end $$;

create or replace function public.hr_purge_old_archives(p_months_old int default 6)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (select public.is_hr()) then raise exception 'not authorized'; end if;
  delete from public.archived_employee_requests where archived_at < now() - (p_months_old || ' months')::interval;
end $$;

revoke all on function public.hr_update_cpo_request_destination(uuid, text) from public;
revoke all on function public.delete_employee_cascade(uuid) from public;
revoke all on function public.hr_approve_employee_request(uuid) from public;
revoke all on function public.hr_archive_processed_employee_requests() from public;
revoke all on function public.hr_purge_old_archives(int) from public;

grant execute on function public.hr_update_cpo_request_destination(uuid, text) to authenticated;
grant execute on function public.delete_employee_cascade(uuid) to authenticated;
grant execute on function public.hr_approve_employee_request(uuid) to authenticated;
grant execute on function public.hr_archive_processed_employee_requests() to authenticated;
grant execute on function public.hr_purge_old_archives(int) to authenticated;

-- ================================================================
-- 8. RLS & POLICIES
-- ================================================================
do $$
declare p record;
begin
  for p in select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in ('employees','user_profiles','cpo_requests','vacation_requests','employee_requests','health_cert_requests','keepalive','archived_employee_requests')
  loop execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename); end loop;
end $$;

alter table public.employees enable row level security;
alter table public.user_profiles enable row level security;
alter table public.cpo_requests enable row level security;
alter table public.vacation_requests enable row level security;
alter table public.employee_requests enable row level security;
alter table public.archived_employee_requests enable row level security;
alter table public.health_cert_requests enable row level security;
alter table public.keepalive enable row level security;

create policy cpo_requests_consolidated on public.cpo_requests for all to authenticated
using ((select public.is_hr()) or (select public.is_supervisor_of(rig)))
with check ((select public.is_hr()) or (select public.is_supervisor_of(rig)));

create policy user_profiles_read_own on public.user_profiles for select to authenticated using ((select auth.uid()) = id);
create policy employees_hr_all on public.employees for all to authenticated using ((select public.is_hr())) with check ((select public.is_hr()));
create policy employees_supervisor_select on public.employees for select to authenticated using ((select public.is_any_supervisor()));
create policy employees_supervisor_update_own_rig on public.employees for update to authenticated using ((select public.is_supervisor_of(rig))) with check ((select public.is_supervisor_of(rig)));

create policy vacations_hr_all on public.vacation_requests for all to authenticated using ((select public.is_hr())) with check ((select public.is_hr()));
create policy vacations_supervisor_insert on public.vacation_requests for insert to authenticated with check ((select public.is_supervisor_of(rig)) and requested_by = (select auth.uid()) and status = 'pending');
create policy vacations_supervisor_select on public.vacation_requests for select to authenticated using ((select public.is_supervisor_of(rig)));
create policy vacations_supervisor_update_pending on public.vacation_requests for update to authenticated using ((select public.is_supervisor_of(rig)) and requested_by = (select auth.uid()) and status = 'pending') with check ((select public.is_supervisor_of(rig)) and requested_by = (select auth.uid()) and status = 'pending');
create policy vacations_supervisor_delete_pending on public.vacation_requests for delete to authenticated using ((select public.is_supervisor_of(rig)) and requested_by = (select auth.uid()) and status = 'pending');

create policy emp_requests_hr_all on public.employee_requests for all to authenticated using ((select public.is_hr())) with check ((select public.is_hr()));
create policy emp_requests_supervisor_insert on public.employee_requests for insert to authenticated with check ((select public.is_supervisor_of(rig)) and requested_by = (select auth.uid()) and status = 'pending');
create policy emp_requests_supervisor_select on public.employee_requests for select to authenticated using ((select public.is_supervisor_of(rig)));
create policy emp_requests_supervisor_update_pending on public.employee_requests for update to authenticated using ((select public.is_supervisor_of(rig)) and requested_by = (select auth.uid()) and status = 'pending') with check ((select public.is_supervisor_of(rig)) and requested_by = (select auth.uid()) and status = 'pending');
create policy emp_requests_supervisor_delete_pending on public.employee_requests for delete to authenticated using ((select public.is_supervisor_of(rig)) and requested_by = (select auth.uid()) and status = 'pending');
create policy archived_emp_requests_hr_all on public.archived_employee_requests for all to authenticated using ((select public.is_hr())) with check ((select public.is_hr()));

create policy health_cert_requests_hr_all on public.health_cert_requests for all to authenticated using ((select public.is_hr())) with check ((select public.is_hr()));
create policy health_cert_requests_supervisor_insert on public.health_cert_requests for insert to authenticated with check ((select public.is_supervisor_of(rig)) and requested_by = (select auth.uid()) and status = 'pending');
create policy health_cert_requests_supervisor_select on public.health_cert_requests for select to authenticated using ((select public.is_supervisor_of(rig)));
create policy health_cert_requests_supervisor_update_pending on public.health_cert_requests for update to authenticated using ((select public.is_supervisor_of(rig)) and requested_by = (select auth.uid()) and status = 'pending') with check ((select public.is_supervisor_of(rig)) and requested_by = (select auth.uid()) and status = 'pending');
create policy health_cert_requests_supervisor_delete_pending on public.health_cert_requests for delete to authenticated using ((select public.is_supervisor_of(rig)) and requested_by = (select auth.uid()) and status = 'pending');

create policy keepalive_anon_read on public.keepalive for select to anon using (true);

-- ================================================================
-- 9. PRIVILEGES
-- ================================================================
revoke all on table public.employees, public.user_profiles, public.cpo_requests, public.vacation_requests, public.employee_requests, public.archived_employee_requests, public.health_cert_requests, public.keepalive from anon;
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.employees, public.cpo_requests, public.vacation_requests, public.employee_requests, public.health_cert_requests to authenticated;
grant select, insert, delete on table public.archived_employee_requests to authenticated;
grant select on table public.user_profiles to authenticated;
grant select on table public.keepalive to anon;

-- ================================================================
-- 10. SEED AUTH USERS
-- ================================================================
do $$
declare u record; new_user_id uuid;
begin
  for u in select * from (values
      ('hr@alloush.local', 'Hr!9kP2$vL5#qR8*mX3', 'HR', null::text),
      ('b2@alloush.local', 'B2@jH6#xW9$qZ2&nM4', 'SUPERVISOR', 'B2'),
      ('b3@alloush.local', 'B3!cV7&bN1*mK5*xP8', 'SUPERVISOR', 'B3'),
      ('b5@alloush.local', 'B5@tY2!rT8^wQ3$zL6', 'SUPERVISOR', 'B5'),
      ('b6@alloush.local', 'B6$fD4#gH9!sW1&vB7', 'SUPERVISOR', 'B6'),
      ('b7@alloush.local', 'B7%pM3$nJ8#cR5@tF1', 'SUPERVISOR', 'B7'),
      ('b8@alloush.local', 'B8^kL6!xZ2@vB9$mQ4', 'SUPERVISOR', 'B8'),
      ('b9@alloush.local', 'B9&wS1@yU7#bN4%hJ8', 'SUPERVISOR', 'B9'),
      ('b10@alloush.local', 'B10*rQ5$cV1!mK9&xP3', 'SUPERVISOR', 'B10'),
      ('b11@alloush.local', 'B11!zX8#pL4^tR2$fW6', 'SUPERVISOR', 'B11'),
      ('laheeb@alloush.local', 'Lhb@bM7!kH3%vC9#nY5', 'SUPERVISOR', 'LAHEEB')
    ) as t(email, pass, role, rig)
  loop
    if not exists (select 1 from auth.users where email = u.email) then
      new_user_id := gen_random_uuid();
      insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change_token_current, email_change)
      values (new_user_id, '00000000-0000-0000-0000-000000000000', u.email, crypt(u.pass, gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('role', u.role, 'rig', u.rig), false, 'authenticated', 'authenticated', '', '', '', '', '');
    end if;
    update auth.users set encrypted_password = crypt(u.pass, gen_salt('bf')), email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now(), confirmation_token = '', recovery_token = '', email_change_token_new = '', email_change_token_current = '', email_change = '' where email = u.email;
    insert into public.user_profiles (id, role, rig) select au.id, u.role, u.rig from auth.users au where au.email = u.email on conflict (id) do update set role = excluded.role, rig = excluded.rig;
  end loop;
end $$;

-- ================================================================
-- 11. REALTIME & CLEANUP
-- ================================================================
do $$
declare t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then execute 'create publication supabase_realtime'; end if;
  foreach t in array array['employees','cpo_requests','vacation_requests','employee_requests','health_cert_requests'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

do $$
declare req record;
begin
  for req in select * from public.employee_requests where status = 'pending' and request_type = 'ADD' loop
    if exists (select 1 from public.employees where employee_number = req.employee_number) then
      update public.employee_requests set status = 'approved' where id = req.id;
    end if;
  end loop;
end $$;

-- ================================================================
-- 12. ═══════════════ V24 — CREW CHANGE & TIMESHEET ═══════════════
-- PURELY ADDITIVE. Nothing below touches V23 objects.
-- ================================================================

-- ----------------------------------------------------------------
-- 12.1 EXTEND vacation_requests WITH SCHEDULING + ACTUAL DATES
-- ----------------------------------------------------------------
-- start_date          : planned departure date (first day of vacation)
-- actual_start_date   : HR sign-off — employee actually left rig (inclusive)
-- actual_end_date     : HR sign-on   — employee actually returned to rig (inclusive)
-- signed_off_by/at    : who confirmed departure + when
-- signed_on_by/at     : who confirmed return + when
-- notes               : free text for HR
alter table public.vacation_requests
  add column if not exists start_date        date,
  add column if not exists actual_start_date date,
  add column if not exists actual_end_date   date,
  add column if not exists signed_off_by     uuid references auth.users(id) on delete set null,
  add column if not exists signed_off_at     timestamptz,
  add column if not exists signed_on_by      uuid references auth.users(id) on delete set null,
  add column if not exists signed_on_at      timestamptz,
  add column if not exists notes             text;

-- ----------------------------------------------------------------
-- 12.2 NEW INDEXES FOR CREW CHANGE & TIMESHEET QUERIES
-- ----------------------------------------------------------------
create index if not exists idx_vac_req_start_date
  on public.vacation_requests (start_date);

create index if not exists idx_vac_req_status_actual_start
  on public.vacation_requests (status, actual_start_date);

create index if not exists idx_vac_req_status_actual_end
  on public.vacation_requests (status, actual_end_date);

create index if not exists idx_vac_req_rig_status
  on public.vacation_requests (rig, status);

create index if not exists idx_vac_req_employee_number
  on public.vacation_requests (employee_number);

-- partial index: upcoming departures (approved, not yet signed off)
create index if not exists idx_vac_req_upcoming_departure
  on public.vacation_requests (start_date)
  where status = 'approved' and actual_start_date is null;

-- partial index: currently on vacation (signed off, not yet returned)
create index if not exists idx_vac_req_on_vacation
  on public.vacation_requests (end_date)
  where actual_start_date is not null and actual_end_date is null;

-- ----------------------------------------------------------------
-- 12.3 SAFETY CONSTRAINT (guarded — no DROP)
-- ----------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'vacation_requests_actual_dates_order'
      and conrelid = 'public.vacation_requests'::regclass
  ) then
    alter table public.vacation_requests
      add constraint vacation_requests_actual_dates_order
      check (
        actual_end_date is null
        or actual_start_date is null
        or actual_end_date >= actual_start_date
      );
  end if;
end $$;

-- ----------------------------------------------------------------
-- 12.4 RPC: HR SIGN-OFF (employee leaves rig → vacation begins)
-- ----------------------------------------------------------------
create or replace function public.hr_sign_off_vacation(
  p_request_id  uuid,
  p_actual_date date default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status       text;
  v_actual_start date;
begin
  if not (select public.is_hr()) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select status, actual_start_date
    into v_status, v_actual_start
  from public.vacation_requests
  where id = p_request_id;

  if not found then
    raise exception 'vacation request % not found', p_request_id;
  end if;

  if v_status <> 'approved' then
    raise exception 'vacation request must be approved before sign-off (current: %)', v_status;
  end if;

  if v_actual_start is not null then
    raise exception 'vacation request already signed off on %', v_actual_start;
  end if;

  update public.vacation_requests
  set actual_start_date = coalesce(p_actual_date, current_date),
      signed_off_by     = (select auth.uid()),
      signed_off_at     = now()
  where id = p_request_id;
end $$;

revoke all on function public.hr_sign_off_vacation(uuid, date) from public;
grant execute on function public.hr_sign_off_vacation(uuid, date) to authenticated;

-- ----------------------------------------------------------------
-- 12.5 RPC: HR SIGN-ON (employee returns to rig → vacation ends)
-- ----------------------------------------------------------------
create or replace function public.hr_sign_on_vacation(
  p_request_id  uuid,
  p_actual_date date default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status       text;
  v_actual_start date;
  v_actual_end   date;
begin
  if not (select public.is_hr()) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select status, actual_start_date, actual_end_date
    into v_status, v_actual_start, v_actual_end
  from public.vacation_requests
  where id = p_request_id;

  if not found then
    raise exception 'vacation request % not found', p_request_id;
  end if;

  if v_status <> 'approved' then
    raise exception 'vacation request must be approved (current: %)', v_status;
  end if;

  if v_actual_start is null then
    raise exception 'cannot sign-on before sign-off';
  end if;

  if v_actual_end is not null then
    raise exception 'vacation already signed on %', v_actual_end;
  end if;

  update public.vacation_requests
  set actual_end_date = coalesce(p_actual_date, current_date),
      signed_on_by    = (select auth.uid()),
      signed_on_at    = now()
  where id = p_request_id;
end $$;

revoke all on function public.hr_sign_on_vacation(uuid, date) from public;
grant execute on function public.hr_sign_on_vacation(uuid, date) to authenticated;

-- ----------------------------------------------------------------
-- 12.6 RPC: HR CANCEL SIGN (undo sign-off / sign-on by mistake)
-- ----------------------------------------------------------------
create or replace function public.hr_cancel_vacation_sign(
  p_request_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (select public.is_hr()) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.vacation_requests
  set actual_start_date = null,
      actual_end_date   = null,
      signed_off_by     = null,
      signed_off_at     = null,
      signed_on_by      = null,
      signed_on_at      = null
  where id = p_request_id
    and status = 'approved';
end $$;

revoke all on function public.hr_cancel_vacation_sign(uuid) from public;
grant execute on function public.hr_cancel_vacation_sign(uuid) to authenticated;

-- ----------------------------------------------------------------
-- 12.7 RPC: HR SET VACATION SCHEDULE (fill start_date / end_date)
-- ----------------------------------------------------------------
create or replace function public.hr_set_vacation_schedule(
  p_request_id uuid,
  p_start_date date,
  p_end_date   date
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (select public.is_hr()) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if p_end_date < p_start_date then
    raise exception 'end_date must be >= start_date';
  end if;

  update public.vacation_requests
  set start_date = p_start_date,
      end_date   = p_end_date::timestamptz
  where id = p_request_id
    and status in ('pending', 'approved');
end $$;

revoke all on function public.hr_set_vacation_schedule(uuid, date, date) from public;
grant execute on function public.hr_set_vacation_schedule(uuid, date, date) to authenticated;

-- ----------------------------------------------------------------
-- 12.8 VIEW: CREW CHANGE
-- ----------------------------------------------------------------
-- Phases:
--   upcoming_departure : approved, not yet signed off   → "قريب ينزل أجازة"
--   on_vacation        : signed off, not yet returned   → "قريب يرجع من الأجازة"
--   returned           : signed on                      → history only
create or replace view public.v_crew_change
with (security_invoker = true) as
select
  vr.id,
  vr.employee_number,
  vr.employee_name,
  vr.rig,
  vr.status,
  vr.start_date,
  case when vr.end_date is not null then vr.end_date::date else null end as end_date,
  vr.actual_start_date,
  vr.actual_end_date,
  vr.notes,
  case
    when vr.actual_start_date is null and vr.status = 'approved' then 'upcoming_departure'
    when vr.actual_start_date is not null and vr.actual_end_date is null then 'on_vacation'
    when vr.actual_end_date is not null then 'returned'
    else 'other'
  end as phase,
  case
    when vr.actual_start_date is null and vr.status = 'approved' and vr.start_date is not null
      then (vr.start_date - current_date)
    when vr.actual_start_date is not null and vr.actual_end_date is null and vr.end_date is not null
      then (vr.end_date::date - current_date)
    else null
  end as days_until_next_event,
  case
    when vr.actual_start_date is not null and vr.actual_end_date is null
      then (current_date - vr.actual_start_date + 1)
    when vr.actual_start_date is not null and vr.actual_end_date is not null
      then (vr.actual_end_date - vr.actual_start_date + 1)
    else null
  end as days_on_vacation
from public.vacation_requests vr
where vr.status = 'approved';

grant select on public.v_crew_change to authenticated;

-- ----------------------------------------------------------------
-- 12.9 VIEW: TIMESHEET PER EMPLOYEE
-- ----------------------------------------------------------------
-- vacation_days   : inclusive (actual_end - actual_start + 1)
-- rig_days_before : days between previous return and this departure (exclusive)
create or replace view public.v_vacation_timesheet
with (security_invoker = true) as
with ordered as (
  select
    vr.id,
    vr.employee_number,
    vr.employee_name,
    vr.rig,
    vr.start_date,
    case when vr.end_date is not null then vr.end_date::date else null end as end_date,
    vr.actual_start_date,
    vr.actual_end_date,
    lag(vr.actual_end_date) over (
      partition by vr.employee_number
      order by vr.actual_start_date
    ) as prev_actual_end
  from public.vacation_requests vr
  where vr.status in ('approved', 'completed')
    and vr.actual_start_date is not null
)
select
  id,
  employee_number,
  employee_name,
  rig,
  actual_start_date,
  actual_end_date,
  case
    when actual_end_date is not null
      then (actual_end_date - actual_start_date + 1)
    else
      (current_date - actual_start_date + 1)
  end as vacation_days,
  case
    when prev_actual_end is not null
      then (actual_start_date - prev_actual_end - 1)
    else null
  end as rig_days_before,
  case
    when actual_end_date is null then true
    else false
  end as is_currently_on_vacation
from ordered;

grant select on public.v_vacation_timesheet to authenticated;

-- ----------------------------------------------------------------
-- 12.10 SUMMARY VIEW: per-employee totals
-- ----------------------------------------------------------------
create or replace view public.v_vacation_summary
with (security_invoker = true) as
select
  employee_number,
  employee_name,
  rig,
  count(*)                                  as total_cycles,
  sum(vacation_days)                        as total_vacation_days,
  sum(coalesce(rig_days_before, 0))         as total_rig_days,
  max(actual_start_date)                    as last_departure,
  max(actual_end_date)                      as last_return
from public.v_vacation_timesheet
group by employee_number, employee_name, rig;

grant select on public.v_vacation_summary to authenticated;

-- ----------------------------------------------------------------
-- 12.11 ENSURE REALTIME INCLUDES vacation_requests (already was)
-- ----------------------------------------------------------------
-- No action needed — vacation_requests is already in the publication.
-- Views cannot be added to realtime; the tab should refresh on
-- vacation_requests changes (already subscribed in App.tsx).

-- ═══════════════════════════════════════════════════════════════
-- END V24
-- ═══════════════════════════════════════════════════════════════
