/*
# Create shared core personnel request table

1. New Tables
- `cpo_requests` stores core personnel movement requests submitted from the dashboard.
- `id` is the generated request identifier.
- `employee_number` stores the optional employee number or name entered by the requester.
- `grade` stores the selected employee grade.
- `nationality` stores the selected nationality.
- `destination` stores the selected destination.
- `status` stores the request workflow status and defaults to `pending`.
- `created_at` and `updated_at` store audit timestamps.

2. Security
- Row level security is enabled on `cpo_requests`.
- The dashboard is a shared internal workspace without a sign-in screen, so anon and authenticated roles can use the table.
- Separate CRUD policies allow the dashboard to list, create, update, and remove shared requests.

3. Important Notes
- This migration is idempotent and safe to apply again.
- No existing tables or user data are modified.
*/

CREATE TABLE IF NOT EXISTS public.cpo_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_number text NOT NULL,
  grade text NOT NULL,
  nationality text NOT NULL,
  destination text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cpo_requests ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cpo_requests TO anon, authenticated;

DROP POLICY IF EXISTS "Shared dashboard can read requests" ON public.cpo_requests;
CREATE POLICY "Shared dashboard can read requests"
  ON public.cpo_requests FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Shared dashboard can create requests" ON public.cpo_requests;
CREATE POLICY "Shared dashboard can create requests"
  ON public.cpo_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Shared dashboard can update requests" ON public.cpo_requests;
CREATE POLICY "Shared dashboard can update requests"
  ON public.cpo_requests FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Shared dashboard can delete requests" ON public.cpo_requests;
CREATE POLICY "Shared dashboard can delete requests"
  ON public.cpo_requests FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS cpo_requests_created_at_idx
  ON public.cpo_requests (created_at DESC);
