/*
  # Add Vehicle Service Tracking

  1. New Table
    - `vehicle_services`
      - `id` (uuid, primary key)
      - `vehicle_id` (uuid, FK to vehicles)
      - `service_date` (date) - when service is due
      - `service_kilometers` (integer) - kilometers when service is due
      - `description` (text) - type of service (Λάδι, Φίλτρα, Ελαστικά, κτλ)
      - `completed` (boolean) - whether service was completed
      - `completed_at` (timestamptz) - when service was performed
      - `completed_kilometers` (integer) - kilometers when service was completed
      - `notes` (text) - service notes/results
      - `created_at` (timestamptz)

  2. Modified Tables
    - `vehicles` - add next_service_date and next_service_kilometers fields

  3. Security
    - RLS disabled (public app)
*/

CREATE TABLE IF NOT EXISTS vehicle_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  service_date date,
  service_kilometers integer,
  description text NOT NULL DEFAULT '',
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  completed_kilometers integer,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'next_service_date'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN next_service_date date;
    ALTER TABLE vehicles ADD COLUMN next_service_kilometers integer;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS vehicle_services_vehicle_id_idx ON vehicle_services(vehicle_id);
CREATE INDEX IF NOT EXISTS vehicle_services_completed_idx ON vehicle_services(completed);
CREATE INDEX IF NOT EXISTS vehicles_next_service_date_idx ON vehicles(next_service_date);
