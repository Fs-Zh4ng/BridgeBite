-- Fix the remaining security warning for get_daily_challenge function
CREATE OR REPLACE FUNCTION public.get_daily_challenge()
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  type TEXT,
  country TEXT,
  flag TEXT,
  points INTEGER,
  difficulty TEXT,
  options JSONB,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.title, c.description, c.type, c.country, c.flag, c.points, c.difficulty, c.options, c.created_at
  FROM public.challenges c
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$;