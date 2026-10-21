-- Fields you've locked so fetching never suggests or fills them, e.g. "title,synopsis,cover".
ALTER TABLE media ADD COLUMN locked_fields TEXT;
