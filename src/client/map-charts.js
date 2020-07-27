import _ from 'lodash'
import {Tile as TileLayer} from 'ol/layer'
import {transformExtent} from 'ol/proj'
import XYZ from 'ol/source/XYZ'
import proj4 from 'proj4'
import {get as getProjection} from 'ol/proj'
import {register} from 'ol/proj/proj4'

const TILE_PIXEL_RATIO = window.devicePixelRatio === 2 ? 2 : 1

function createChartLayer({index, opacity, maxZoom, minZoomVisible, maxZoomVisible, url, projection, supportRetina, bounds}) {
  const source = new XYZ({
    url,
    maxZoom,
    minZoom: 0,
    projection,
    tilePixelRatio: supportRetina ? TILE_PIXEL_RATIO : 1
  })

  const layer = new TileLayer({
    source,
    extent: getChartLayerExtent(bounds),
    zIndex: index,
    minZoom: minZoomVisible,
    maxZoom: maxZoomVisible,
    opacity
  })

  return layer
}

export function addCharts(map) {

  const baseLayer = createChartLayer({
    index: 2,
    maxZoom: 15,
    maxZoomVisible: 17,
    opacity: 1,
    projection: 'EPSG:3857',
    url: '/map/{z}/{x}/{y}',
    attribution: '© Liikennevirasto. Rannikkokartat 6/2017, CC 4.0. Ei navigointikäyttöön.',
    supportRetina: true
  })

  proj4.defs('EPSG:3067', '+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs')
  register(proj4)
  const proj3067 = getProjection('EPSG:3067')
  proj3067.setExtent([-548576, 6291456, 1548576, 8388608])

  const year = new Date().getFullYear()
  const month = new Date().getMonth() + 1
  const satelliteLayer = createChartLayer({
    index: 3,
    maxZoom: 15,
    minZoomVisible: 17,
    opacity: 1,
    projection: 'EPSG:3067',
    url: '/map/satellite/{z}/{x}/{y}.jpg',
    attribution: `© Maanmittauslaitos. Ortokuva ${month}/${year}, CC 4.0`,
    supportRetina: false,
    //bounds: [-548576, 6291456, 1548576, 8388608]
  })

  map.addLayer(baseLayer)
  map.addLayer(satelliteLayer)
}

function getChartLayerExtent(bounds) {
  if (!bounds) {
    return undefined
  }
  if (!_.isArray(bounds) || bounds.length !== 4) {
    throw new Error('Unrecognized bounds format: ' + JSON.stringify(bounds))
  }
  return transformExtent(bounds, 'EPSG:4326', 'EPSG:3857')
}

