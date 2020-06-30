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
        INITCAP(teksti_fin) as name_finnish,
        INITCAP(teksti_swe) as name_swedish,
        municipality,
        ST_X(wkb_geometry) as longitude,
        ST_Y(wkb_geometry) as latitude,
        CASE WHEN (starts_with(LOWER(concat(teksti_fin, '')), $2) OR starts_with(LOWER(concat(teksti_swe, '')), $2)) IS TRUE THEN 1 ELSE 2 END as priority
        FROM locations WHERE teksti_fin ILIKE $1 OR teksti_swe ILIKE $1
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
