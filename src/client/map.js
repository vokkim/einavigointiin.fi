import React from 'react'
import _ from 'lodash'
import 'ol/ol.css'
import {Map, View} from 'ol'
import {defaults} from 'ol/interaction'
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom'
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer'
import {transformExtent} from 'ol/proj'
import XYZ from 'ol/source/XYZ'
import {fromLonLat, toLonLat} from 'ol/proj'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import GeoJSON from 'ol/format/GeoJSON'
import VectorSource from 'ol/source/Vector'
import {Icon, Style, Fill, Stroke} from 'ol/style'
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

  placeOfficialHarbourMarkers(olMap)
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

function placeOfficialHarbourMarkers(olMap) {

  const markers = HARBOUR_DATA.map(harbour => {

    const harbourIcon = new Icon({
      anchor: [0.5, 0.5],
      anchorXUnits: 'fraction',
      src: createIconForHarbour(harbour.harbour_number),
      scale: 1
    })

    const iconStyle = new Style({
      image: harbourIcon
    })
    const marker = new Feature({
      geometry: new Point(fromLonLat([harbour.longitude, harbour.latitude])),
    })

    marker.setStyle((feature, resolution) => {
      iconStyle.getImage().setScale(1/Math.pow(resolution, 1/4) * 5)
      return iconStyle
    })

    return marker
  })


  const markerLayer = new VectorLayer({
    source: new VectorSource({
      features: markers
    }),
    minZoom: 9,
    zIndex: 1000,
  })

  olMap.addLayer(markerLayer)
}

function createIconForHarbour(number) {
  const harbourIconAsText = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="31px" height="14px" viewBox="0 0 31 14" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
<g id="Group-46" transform="translate(1.000000, 1.000000)">
<text fill="#EE3339" font-family="ArialMT, Arial" font-size="9" font-weight="normal" letter-spacing="0.2">
<tspan x="14" y="9">${number}</tspan>
</text>
<g>
<circle stroke="#EE3339" fill-opacity="0.559686407" fill="#FEFEFE" cx="6" cy="6" r="6"></circle>
<polygon fill="#EE3339" points="5 1 10 7 5 7"></polygon>
<path d="M3.79305374,4.83082608 L8.40473886,10.7259805 C6.75954003,11.0688737 5.4131096,10.5707029 4.36544758,9.23146804 C3.31778555,7.89223319 3.12698761,6.42535253 3.79305374,4.83082608 Z" fill="#EE3339" transform="translate(5.904739, 7.830826) rotate(-51.000000) translate(-5.904739, -7.830826) "></path>
</g>
</g>
</g>
</svg>`.replace('\n', '')

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(harbourIconAsText)
}



export default MapWrapper
