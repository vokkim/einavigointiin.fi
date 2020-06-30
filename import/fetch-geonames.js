#!/usr/bin/env node

/*
  Fetch, filter and clean Maanmittauslaitos data sets.
*/
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const municipalityCodes = require('./municipality-codes.json')
const whichPolygon = require('which-polygon')
const _ = require('lodash')

const kohdeluokkaToType = {
  48112: 'kunta',
  48111: 'kaupunki',
  48120: 'kyla',
  36490: 'muu-vesisto',
  35070: 'saari',
  35060: 'niemi',
  16101: 'turvalaite',
}

const outputFile = path.resolve(__dirname, 'locations.geojson')
const locationsUrl = 'https://beta-paikkatieto.maanmittauslaitos.fi/maastotiedot/wfs3/v1/collections/paikannimi/items?f=json&kohdeluokka=48112,48111,48120,36490,35070,35060,16101'
const municipalityUrl = 'https://beta-paikkatieto.maanmittauslaitos.fi/maastotiedot/wfs3/v1/collections/kunta/items'
const properties = ['teksti', 'kohdeluokka', 'sijainti_piste', 'kirjasinkoko', 'kielikoodi', 'kirjasinvarikoodi', 'kuntatunnus']
let result = null
let municipalityData = null


function processResult(data) {
  console.log('municipalityData')
  const municipalityQuery = whichPolygon(municipalityData)
  const featuresWithProperLocation = data.features.map(feature => {
    const municipalityShape = municipalityQuery(feature.properties.sijainti_piste.coordinates)
    if (!municipalityShape) {
      console.log('No municipality shape for', feature.properties.teksti_fin || feature.properties.teksti_swe || feature.properties.teksti_sme || feature.properties.teksti_smn || feature.properties.teksti_sms)
      return null
    }
    const municipalityCode = municipalityShape.kuntatunnus
    const municipality = municipalityCodes.find(({code}) => code === municipalityCode)
    if (!municipality) {
      console.log('No municipality name for', municipalityCode)
    }
    return {
      geometry: feature.properties.sijainti_piste,
      type: feature.type,
      properties: {
        municipality: municipality ? municipality.name : '',
        kielikoodi: feature.properties.kielikoodi,
        kirjasinkoko: feature.properties.kirjasinkoko,
        [`teksti_${feature.properties.kielikoodi}`]: feature.properties.teksti,
        type: kohdeluokkaToType[feature.properties.kohdeluokka]
      }
    }
  }).filter(feature => Boolean(feature))

  let features = {}
  featuresWithProperLocation.forEach(feature => {
    const key = feature.geometry.coordinates.join(',')
    if (!['fin','swe'].includes(feature.properties.kielikoodi)) {
      return
    }
    if (!features[key]) {
      features[key] = feature
    } else if (!_.isEqual(features[key].properties, feature.properties)) {
      features[key].properties.teksti_swe = features[key].properties.teksti_swe || feature.properties.teksti_swe
      features[key].properties.teksti_fin = features[key].properties.teksti_fin || feature.properties.teksti_fin
      features[key].properties.kirjasinkoko = Math.max(features[key].properties.kirjasinkoko, feature.properties.kirjasinkoko)
    }
  })

  return {
    type: data.type,
    features: Object.values(features)
  }
}

async function fetchGeoJSONData(url) {
  const response = await axios.get(url)
  const nextUrl = response.data.links.length === 2 ? response.data.links[1].href : null
  delete response.data.links
  delete response.data.numberReturned
  delete response.data.timeStamp
  if (!result) {
    result = cleanupGeoJSON(response.data)
  } else {
    const cleanedJson = cleanupGeoJSON(response.data)
    result.features = result.features.concat(cleanedJson.features)
    console.log(`${url} :: ${result.features.length} :: ${cleanedJson.features.length}`)
  }
  return nextUrl
}

function cleanupGeoJSON(data) {
  const features = data.features.map(feature => {
    delete feature.id
    Object.keys(feature.properties).forEach(key => {
      if (!properties.includes(key)) {
        delete feature.properties[key]
      }
    })
    return feature
  })
  return {type: data.type, features}
}

async function loopApi(url) {
  let nextUrl = url
  let resultSize = 0
  while(nextUrl !== null) {
    nextUrl = await fetchGeoJSONData(nextUrl)
  }
}

console.log('Fetching municipality areas ...')
loopApi(municipalityUrl)
  .then(() => {
    municipalityData = result
    result = null
    return loopApi(locationsUrl)
  })
  .then(() => {
    result = processResult(result)
    fs.writeFileSync(outputFile, JSON.stringify(result))
    console.log(`Done!`)
  })
