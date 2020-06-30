#!/usr/bin/env node

const path = require('path')
const shell = require('shelljs')

const dbConfig = {
  db: 'einavigointiinfi',
  user: 'einavigointiinfi',
  password: 'einavigointiinfi'
}

const file = 'locations-clipped.geojson'
const table = 'locations'
shell.exec(`docker run --network host --env OGR_GEOJSON_MAX_OBJ_SIZE=1000 --env PG_USE_COPY=YES --rm -v ${__dirname}:/data osgeo/gdal:alpine-normal-latest ogr2ogr -f "PostgreSQL" PG:"host=host.docker.internal dbname=${dbConfig.db} user=${dbConfig.user} password=${dbConfig.password}" "/data/${file}" -nln ${table}`)

console.log('Done!')
