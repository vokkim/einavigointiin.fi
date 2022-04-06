
exports.up = function(db) {
  return db.runSql(`
CREATE TABLE harbours (
    id uuid NOT NULL,
    type varchar(64) NOT NULL,
    name varchar NOT NULL,
    harbour_number integer,
    min_depth numeric,
    max_depth numeric,
    wkb_geometry geometry(Point,4326) NOT NULL,
    view uuid,
    urls jsonb,
    municipality varchar
);
ALTER TABLE harbours OWNER TO einavigointiinfi;
ALTER TABLE harbours ADD CONSTRAINT harbours_harbour_number_key UNIQUE (harbour_number);
ALTER TABLE harbours ADD CONSTRAINT harbours_pkey PRIMARY KEY (id);

CREATE TABLE locations (
    ogc_fid integer NOT NULL,
    municipality varchar,
    kielikoodi varchar,
    kirjasinkoko integer,
    teksti_fin varchar,
    type varchar,
    teksti_swe varchar,
    wkb_geometry geometry(Point,4326)
);
ALTER TABLE locations ADD CONSTRAINT locations_pkey PRIMARY KEY (ogc_fid);
ALTER TABLE locations OWNER TO einavigointiinfi;


CREATE TABLE views (
    id uuid NOT NULL,
    name varchar NOT NULL,
    key varchar(64) NOT NULL
);
ALTER TABLE views ADD CONSTRAINT views_pkey PRIMARY KEY (id);
ALTER TABLE views OWNER TO einavigointiinfi;
ALTER TABLE harbours ADD CONSTRAINT harbours_view_fkey FOREIGN KEY (view) REFERENCES views(id);

GRANT ALL ON TABLE geography_columns TO einavigointiinfi;
GRANT ALL ON TABLE geometry_columns TO einavigointiinfi;
GRANT ALL ON TABLE spatial_ref_sys TO einavigointiinfi;
  `)
}

exports.down = function(db) {
  return db.runSql(`
    DROP TABLE harbours;
    DROP TABLE locations;
    DROP TABLE views;
  `)
}
