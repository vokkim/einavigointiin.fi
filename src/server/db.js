const express = require('express')
const pg = require('pg-promise')()
const settings = require('./settings')

const db = pg(settings.postgresConnection)

async function searchLocations(search) {
  const sanitizedSearch = search.trim().toLowerCase()
  try {
    const rows = await db.any(`
      SELECT
        type,
        name_finnish,
        name_swedish,
        secondary_text,
        ST_X(wkb_geometry) as longitude,
        ST_Y(wkb_geometry) as latitude,
        priority
        FROM (
          SELECT
            type,
            INITCAP(teksti_fin) as name_finnish,
            INITCAP(teksti_swe) as name_swedish,
            wkb_geometry,
            municipality as secondary_text,
            kirjasinkoko,
            CASE WHEN (starts_with(LOWER(concat(teksti_fin, '')), $2) OR starts_with(LOWER(concat(teksti_swe, '')), $2)) IS TRUE THEN 3 ELSE 4 END as priority
          FROM locations WHERE teksti_fin ILIKE $1 OR teksti_swe ILIKE $1
          UNION
          SELECT
            type,
            name as name_finnish,
            name as name_swedish,
            wkb_geometry,
            harbour_number::varchar as secondary_text,
            400 as kirjasinkoko,
            --CASE WHEN starts_with(LOWER(name)) IS TRUE THEN 1 ELSE 2 END as priority
            1 as priority
          FROM harbours WHERE (name ILIKE $1 OR harbour_number::varchar = $2) AND type != 'unknown_harbour'
        ) as hits
        ORDER BY priority ASC, kirjasinkoko DESC
        LIMIT 15
    `, [`%${sanitizedSearch}%`, sanitizedSearch])
    return rows
  } catch(e) {
    console.error(e)
    return []
  }
}

module.exports = {
  searchLocations
}
