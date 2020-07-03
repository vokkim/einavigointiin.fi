const express = require('express')
const fs = require('fs')
const path = require('path')
const Promise = require('bluebird')
const settings = require('./settings')
const db = require('./db')
const chartRoutes = require('./chart-routes')

const app = express()

app.disable('x-powered-by')
app.use('/map', chartRoutes)

app.get('/', async (req, res) => {
  const index = await Promise.promisify(fs.readFile)(path.join(__dirname, '../../dist/index.html'))
  const harbours = await db.getHarbours(['official_harbour'])
  res.set('Cache-Control', 'public, max-age=86400')
  res.send(index.toString('utf-8').replace('HARBOUR_DATA', 'HARBOUR_DATA='+JSON.stringify(harbours)))
})

app.get('/search/:search', async (req, res) => {
  const result = await db.searchLocations(req.params.search || '')
  res.send(result)
})

app.use('/', express.static(path.join(__dirname, '../../dist')))
app.use('/', express.static(path.join(__dirname, '../../assets')))


if (process.env.LISTEN_FDS) {
  const SD_LISTEN_FDS_START = 3;
  app.listen({fd: SD_LISTEN_FDS_START}, () => {
    console.log(`Listening systemd socket port`)
  })
} else {
  app.listen(settings.port, () => {
    console.log(`Listening ${settings.port}`)
  })
}
