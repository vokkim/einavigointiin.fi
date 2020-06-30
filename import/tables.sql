CREATE TABLE harbours (
  id UUID PRIMARY KEY,
  type VARCHAR(64) NOT NULL,
  name VARCHAR NOT NULL,
  harbour_number INTEGER UNIQUE,
  min_depth DECIMAL,
  max_depth DECIMAL,
  wkb_geometry GEOMETRY(POINT,4326) NOT NULL
)