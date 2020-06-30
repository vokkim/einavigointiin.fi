import React from 'react'
import _ from 'lodash'
import 'ol/ol.css'
import {Map, View} from 'ol'
import {defaults} from 'ol/interaction'
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom'
import {Tile as TileLayer} from 'ol/layer'
import {transformExtent} from 'ol/proj'
import XYZ from 'ol/source/XYZ'
import {fromLonLat, toLonLat} from 'ol/proj'

import {MAX_ZOOM, MIN_ZOOM} from './enums'

class MapWrapper extends React.Component {
  componentDidMount() {
    initMap(this.props.settings, this.props.events)
  }
  render() {
    return (
      <div className='map-wrapper'>
        <div id="map" />
      </div>
    )
  }
}

function getChartOptions(settings) {
  const hashParts = (window.location.hash || '#').substring(1).split('/').map(parseFloat)
  if (hashParts.length === 3 && hashParts.every(v => isFinite(v))) {
    const center = fromLonLat([hashParts[1], hashParts[0]])
    return {center, zoom: hashParts[2]}
  }
  return {center: fromLonLat([22.96,59.82]), zoom: settings.zoom}
}

function initMap(settings, events) {
  console.log('Init map')
  const {center, zoom} = getChartOptions(settings)
  const olMap = new Map({
    target: 'map',
    controls: [],
    layers: [],
    interactions: defaults({
      mouseWheelZoom: false,
      pinchRotate: false
    }),
    view: new View({
      center,
      zoom,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
    })
  })

  const mouseWheelZoom = new MouseWheelZoom({useAnchor: true})
  olMap.addInteraction(mouseWheelZoom)


  addCharts(olMap, settings.charts)

  events.onValue(({type, value}) => {
    if (type === 'search') {
      olMap.getView().setCenter(fromLonLat([value.longitude, value.latitude]))
      olMap.getView().setZoom(14)
      return
    }
    console.log(`Unknown map event type ${type}`)
  })


  function updateHash() {
    const view = olMap.getView()
    const center = view.getCenter()
    const [longitude, latitude] = toLonLat(center)
    const zoom = Math.round(view.getZoom())
    window.history.pushState(null, null, `#${latitude.toFixed(4)}/${longitude.toFixed(4)}/${zoom}`)
  }

  olMap.on('moveend', updateHash)
}

function addCharts(map, charts) {
  // Initialize charts based on initial charts
  _.each(charts, chart => {
    const {index, opacity, maxzoom, minzoom, tilemapUrl} = chart

    const extent = getChartExtent(chart)

    const source = new XYZ({
      url: tilemapUrl,
      maxZoom: maxzoom,
      minZoom: minzoom
    })

    const layer = new TileLayer({
      source,
      extent,
      zIndex: index,
      opacity
    })

    map.addLayer(layer)
  })
}

function getChartExtent(provider) {
  if (!provider.bounds) {
    return undefined
  }
  if (!_.isArray(provider.bounds) || provider.bounds.length !== 4) {
    throw new Error('Unrecognized bounds format: ' + JSON.stringify(provider.bounds))
  }

  return transformExtent(provider.bounds, 'EPSG:4326', 'EPSG:3857')
}

export default MapWrapper
