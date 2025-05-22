-- Add is_deleted column to contractors table with default value of false
ALTER TABLE public.contractors ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Create an index on is_deleted column for faster filtering
CREATE INDEX IF NOT EXISTS idx_contractors_is_deleted ON public.contractors (is_deleted);

-- Update any existing records to have is_deleted = false
UPDATE public.contractors SET is_deleted = FALSE WHERE is_deleted IS NULL;
