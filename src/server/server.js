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
  if (req.params.view) {
    console.log('ITS A VIEW!', req.params.view)
  }
  res.set('Cache-Control', 'public, max-age=86400')
  res.send(index.toString('utf-8').replace('HARBOUR_DATA', 'HARBOUR_DATA='+JSON.stringify(harbours)))
})

app.get('/view/:key/', async (req, res) => {
  if (!req.url.endsWith('/')) {
    return res.redirect(req.url + '/')
  }
  const view = await findView(req.params.key)
  if (!view) {
    return res.sendStatus(404)
  }
  const index = await Promise.promisify(fs.readFile)(path.join(__dirname, '../../dist/index.html'))
  const harbours = await db.getHarbours(['official_harbour'], [view.id])
  res.set('Cache-Control', 'public, max-age=86400')
  res.send(index.toString('utf-8').replace('HARBOUR_DATA', 'HARBOUR_DATA='+JSON.stringify(harbours)))
})

app.get('(/view/:key)?/search/:search', async (req, res) => {
  const searchParam = (req.params.search || '').trim()
  if (searchParam.length < 3) {
    return res.sendStatus(400)
  }
  if (req.params.key) {
    const view = await findView(req.params.key)
    if (!view) {
      return res.sendStatus(404)
    }
    const result = await db.searchLocations(searchParam, [view.id])
    return res.send(result)
  }
  const result = await db.searchLocations(searchParam)
  res.send(result)
})

app.use('/', express.static(path.join(__dirname, '../../dist')))
app.use('/', express.static(path.join(__dirname, '../../assets')))


function findView(key) {
  if (!validateViewKey(key)) {
    return null
  }
  return db.getView(key)
}

function validateViewKey(value) {
  return value && value.length > 1 && value.match(/[a-zA-Z]*/)
}

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
