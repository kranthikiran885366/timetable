-- Add additional columns to rooms table for enhanced room management
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS building TEXT,
ADD COLUMN IF NOT EXISTS floor TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing rooms with sample building and floor data
UPDATE public.rooms 
SET building = CASE 
  WHEN name LIKE '%A%' THEN 'Building A'
  WHEN name LIKE '%B%' THEN 'Building B'
  WHEN name LIKE '%C%' THEN 'Building C'
  WHEN name LIKE '%D%' THEN 'Building D'
  ELSE 'Main Building'
END,
floor = CASE 
  WHEN name LIKE '%1%' THEN '1st Floor'
  WHEN name LIKE '%2%' THEN '2nd Floor'
  WHEN name LIKE '%3%' THEN '3rd Floor'
  WHEN name LIKE '%4%' THEN '4th Floor'
  ELSE 'Ground Floor'
END
WHERE building IS NULL OR floor IS NULL;

-- Add index for better performance on building and floor queries
CREATE INDEX IF NOT EXISTS idx_rooms_building ON public.rooms(building);
CREATE INDEX IF NOT EXISTS idx_rooms_floor ON public.rooms(floor);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON public.rooms(type);
