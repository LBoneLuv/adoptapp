-- Add 'abandoned' to the incident_type check constraint

-- First, drop the existing constraint
ALTER TABLE public.incidents DROP CONSTRAINT IF EXISTS incidents_incident_type_check;

-- Add the new constraint with 'abandoned' included
ALTER TABLE public.incidents 
ADD CONSTRAINT incidents_incident_type_check 
CHECK (incident_type IN ('lost', 'found', 'abandoned'));
