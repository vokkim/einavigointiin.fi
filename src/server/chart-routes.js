const express = require('express')
const path = require('path')
const request = require('request')
const MBTiles = require('@mapbox/mbtiles')
const settings = require('./settings')

const api = express.Router()

let tiles = null

new MBTiles(path.resolve(settings.chartsPath, 'merikartat.mbtiles'), (err, db) => {
  if (err) {
    console.log('Unable to open charts file: ', path.resolve(settings.chartsPath, 'merikartat.mbtiles'))
    console.error(err)
  } else {
    tiles = db
  }
})

api.get('/satellite/:z/:x/:y.jpg', (req, res) => {
  const {z, x, y} = req.params
  const url = `http://karttamoottori.maanmittauslaitos.fi/maasto/wmts/1.0.0/ortokuva/default/ETRS-TM35FIN/${z}/${y}/${x}.jpg`
  const fwdRequest = request({url, headers: {'Referer': 'https://hkp.maanmittauslaitos.fi/'}}).on('error', () => {})
  res.header('Cache-Control', 'public, max-age=1209600, s-maxage=2764800')
  req.pipe(fwdRequest).pipe(res)
})

api.get('/:z/:x/:y', (req, res) => {
  const {z, x, y} = req.params
  if (!tiles) {
    res.sendStatus(500)
    return
  }
  tiles.getTile(z, x, y, (err, tile, headers) => {
    if (err && err.message && err.message === 'Tile does not exist') {
      req.pipe(request(`https://a.tile.openstreetmap.org/${z}/${x}/${y}.png`)).pipe(res)
    } else if (err) {
      console.error(`Error fetching tile ${z}/${x}/${y}:`, err)
      res.sendStatus(500)
    } else {
      headers['Cache-Control'] = 'public, max-age=1209600, s-maxage=2764800'
      res.writeHead(200, headers)
      res.end(tile)
    }
  })
})

module.exports = api
