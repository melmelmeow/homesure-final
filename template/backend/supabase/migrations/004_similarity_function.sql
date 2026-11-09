CREATE OR REPLACE FUNCTION public.similarity(str1 TEXT, str2 TEXT)
RETURNS FLOAT AS $$
BEGIN
  RETURN similarity(lower(str1), lower(str2));
END;
$$ LANGUAGE plpgsql IMMUTABLE;
