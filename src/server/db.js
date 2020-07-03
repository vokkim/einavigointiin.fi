const express = require('express')
const pg = require('pg-promise')()
const settings = require('./settings')

const db = pg(settings.postgresConnection)

async function searchLocations(search, views = []) {
  const sanitizedSearch = search.toLowerCase()
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
            INITCAP(name) as name_finnish,
            INITCAP(name) as name_swedish,
            wkb_geometry,
            harbour_number::varchar as secondary_text,
            400 as kirjasinkoko,
            1 as priority
          FROM harbours WHERE (name ILIKE $1 OR harbour_number::varchar = $2) AND (type = 'official_harbour' OR view = ANY($3::uuid[]))
        ) as hits
        ORDER BY priority ASC, kirjasinkoko DESC
        LIMIT 15
    `, [`%${sanitizedSearch}%`, sanitizedSearch, views])
    return rows
  } catch(e) {
    console.error(e)
    return []
  }
}

async function getView(key) {
  const rows = await db.any(`SELECT id, name FROM views WHERE key = $1`, [key])
  if (rows.length !== 1) {
    return null
  }
  return rows[0]
}

async function getHarbours(types, views = []) {
  const rows = await db.any(`
    SELECT
      type,
      INITCAP(name) as name,
      ST_X(wkb_geometry) as longitude,
      ST_Y(wkb_geometry) as latitude,
      harbour_number
    FROM harbours WHERE type = ANY($1) OR view = ANY($2::uuid[])
  `, [types, views])
  return rows
}

module.exports = {
  searchLocations,
  getHarbours,
  getView
}
