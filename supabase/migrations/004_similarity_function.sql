-- Case-insensitive name matching used by /api/verify/ocr (profile name vs. name read from the title).
--
-- This used to define public.similarity(text, text). That has the same signature as pg_trgm's own
-- similarity(), so it either failed with "cannot change return type of existing function" or called
-- itself forever. It is exposed under its own name instead; 006 also drops the old wrapper on
-- databases where the original version of this file was already applied.
CREATE OR REPLACE FUNCTION public.name_similarity(str1 TEXT, str2 TEXT)
RETURNS REAL AS $$
BEGIN
  RETURN similarity(lower(str1), lower(str2));
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public, extensions;
