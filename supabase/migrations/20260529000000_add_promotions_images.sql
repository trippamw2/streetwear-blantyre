-- Add images column for promotion sliders
ALTER TABLE public.promotions 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Update existing records to populate images from image if not already set
UPDATE public.promotions 
SET images = ARRAY[image] 
WHERE images IS NULL OR array_length(images, 1) IS NULL;