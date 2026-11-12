/*
# Add travel workflow, employee records, and HR-controlled request changes

1. Modified Tables
- `cpo_requests.destination` now represents the shared departure hub and is normalized to `الهيب` for existing requests.
- `cpo_requests.final_destination` stores the employee's final vacation destination.
- `cpo_requests.route_stops` stores the ordered travel timeline.
- `cpo_requests.travel_mode` stores road-plus-flight, direct flight, or car travel.
- `cpo_requests.flight_ticket_confirmed` and `hotel_ticket_confirmed` store the two booking confirmations.

2. New Tables
- `employees` stores the employee directory used by the rig screen and add-employee form.
- `hr_roles` stores server-managed HR role assignments linked to Supabase Auth users.

3. Security
- Employee records remain intentionally shared for this internal no-login directory and use explicit CRUD policies for anon and authenticated roles.
- Direct UPDATE access to `cpo_requests` is revoked for browser roles so a caller cannot change a destination by editing a row directly.
- `hr_update_cpo_request_destination` is a SECURITY DEFINER function that validates the authenticated caller has an active `hr` role before changing the complete destination workflow.
- HR roles cannot be created or edited by browser clients.

4. Important Notes
- Existing request rows are preserved; only the old departure label `إلى البريقة` is normalized to `الهيب`.
- Seed employee rows use stable employee numbers and `ON CONFLICT DO NOTHING`, so the migration is safe to replay without duplicating employees.
- The browser must use the HR function for destination changes; ordinary request submission remains available to the shared dashboard.
*/

CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_number text NOT NULL UNIQUE,
  name text NOT NULL,
  position text NOT NULL,
  nationality text NOT NULL,
  contact text NOT NULL DEFAULT '',
  rig text NOT NULL,
  is_suspended boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO anon, authenticated;

DROP POLICY IF EXISTS "Shared dashboard can read employees" ON public.employees;
CREATE POLICY "Shared dashboard can read employees"
  ON public.employees FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Shared dashboard can create employees" ON public.employees;
CREATE POLICY "Shared dashboard can create employees"
  ON public.employees FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Shared dashboard can update employees" ON public.employees;
CREATE POLICY "Shared dashboard can update employees"
  ON public.employees FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Shared dashboard can delete employees" ON public.employees;
CREATE POLICY "Shared dashboard can delete employees"
  ON public.employees FOR DELETE
  TO anon, authenticated
  USING (true);

INSERT INTO public.employees (employee_number, name, position, nationality, contact, rig)
VALUES
  ('00230', 'المعتصم بالله محمد إبراهيم', 'DRIVER', 'LIBYA', '0928766724', 'B2'),
  ('00255', 'مارير محمد نجيب', 'TP', 'ALGERIAN', '3670144160', 'B2'),
  ('00256', 'احمد المحمدي عبدالسلام الخالع', 'WEIDER', 'EGYPT', '', 'B2'),
  ('00258', 'ادريس علي بوشناف', 'RT', 'LIBYA', '', 'B2'),
  ('00259', 'اسماعيل احمد إبراهيم', 'DRILLER', 'SYRIAN', '3945452136', 'B2'),
  ('00260', 'جابر الأحمد احميد', 'ASST/DRILLER', 'SYRIAN', '', 'B2'),
  ('00261', 'حسن صالح حسن', 'FM', 'LIBYA', '', 'B2'),
  ('00262', 'جابر محمد حسين', 'ASST/DRILLER', 'LIBYA', '963941422526', 'B2'),
  ('00263', 'حسن مفتاح حسن', 'FM', 'LIBYA', '919870272', 'B2'),
  ('00270', 'خالد محمد الزروق', 'DRILLER', 'LIBYA', '0921345678', 'B3'),
  ('00271', 'سالم علي الورفلي', 'WEIDER', 'LIBYA', '', 'B3'),
  ('00280', 'أحمد فاضل الخطيب', 'RT', 'SYRIAN', '0944567890', 'B5'),
  ('00290', 'عمر يوسف القرضاوي', 'FM', 'EGYPT', '', 'B6'),
  ('00291', 'ماجد إبراهيم العجمي', 'TP', 'ALGERIAN', '0771234567', 'B6'),
  ('00300', 'فتحي محمد البشير', 'DRIVER', 'LIBYA', '0921098765', 'B7')
ON CONFLICT (employee_number) DO NOTHING;

ALTER TABLE public.cpo_requests
  ADD COLUMN IF NOT EXISTS final_destination text NOT NULL DEFAULT 'الهيب',
  ADD COLUMN IF NOT EXISTS route_stops text[] NOT NULL DEFAULT ARRAY['الهيب'],
  ADD COLUMN IF NOT EXISTS travel_mode text NOT NULL DEFAULT 'fly',
  ADD COLUMN IF NOT EXISTS flight_ticket_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hotel_ticket_confirmed boolean NOT NULL DEFAULT false;

UPDATE public.cpo_requests
SET destination = 'الهيب'
WHERE destination = 'إلى البريقة';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cpo_requests_travel_mode_check'
  ) THEN
    ALTER TABLE public.cpo_requests
      ADD CONSTRAINT cpo_requests_travel_mode_check
      CHECK (travel_mode IN ('road_half_fly', 'fly', 'car'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.hr_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role = 'hr'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_roles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hr_roles FROM anon, authenticated;
GRANT SELECT ON public.hr_roles TO authenticated;

DROP POLICY IF EXISTS "HR users can read their own role" ON public.hr_roles;
CREATE POLICY "HR users can read their own role"
  ON public.hr_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

REVOKE UPDATE ON public.cpo_requests FROM anon, authenticated;
DROP POLICY IF EXISTS "Shared dashboard can update requests" ON public.cpo_requests;

CREATE OR REPLACE FUNCTION public.hr_update_cpo_request_destination(
  p_request_id uuid,
  p_final_destination text,
  p_travel_mode text,
  p_flight_ticket_confirmed boolean,
  p_hotel_ticket_confirmed boolean
)
RETURNS public.cpo_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_request public.cpo_requests;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.hr_roles
    WHERE user_id = auth.uid()
      AND role = 'hr'
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_final_destination IS NULL OR length(trim(p_final_destination)) = 0 THEN
    RAISE EXCEPTION 'Invalid destination';
  END IF;

  IF p_travel_mode NOT IN ('road_half_fly', 'fly', 'car') THEN
    RAISE EXCEPTION 'Invalid travel mode';
  END IF;

  UPDATE public.cpo_requests
  SET
    final_destination = trim(p_final_destination),
    travel_mode = p_travel_mode,
    route_stops = CASE
      WHEN nationality = 'LIBYA' THEN ARRAY['الهيب', trim(p_final_destination)]
      ELSE ARRAY['الهيب', 'طرابلس', 'تونس', trim(p_final_destination)]
    END,
    flight_ticket_confirmed = CASE WHEN p_travel_mode = 'car' THEN false ELSE p_flight_ticket_confirmed END,
    hotel_ticket_confirmed = p_hotel_ticket_confirmed,
    updated_at = now()
  WHERE id = p_request_id
  RETURNING * INTO updated_request;

  IF updated_request.id IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  RETURN updated_request;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.hr_update_cpo_request_destination(uuid, text, text, boolean, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hr_update_cpo_request_destination(uuid, text, text, boolean, boolean) TO authenticated;

CREATE INDEX IF NOT EXISTS employees_rig_idx ON public.employees (rig);
CREATE INDEX IF NOT EXISTS cpo_requests_final_destination_idx ON public.cpo_requests (final_destination);
