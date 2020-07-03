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
import VectorSource from 'ol/source/Vector'
import {Icon, Style} from 'ol/style'
import {MAX_ZOOM, MIN_ZOOM, M_TO_NM} from './enums'
import {getIconForHarbour} from './map-icons'

import {getLength} from 'ol/sphere'
import Draw from 'ol/interaction/Draw'
import {Circle as CircleStyle, Fill, Stroke} from 'ol/style'
import {unByKey} from 'ol/Observable'
import Overlay from 'ol/Overlay'

export const MAP_MODE = {MEASURE: 'measure', NORMAL: 'normal'}
export class MapWrapper extends React.Component {

  constructor(props) {
    super(props)
    this.state = {measurements: []}
    this.measuringInteraction = null
    this.currentMeasureTooltip = null
    this.currentMeasurement = null
    this.selected = null
  }

  componentDidMount() {
    this.initMap()
    this.measureTooltipRef = React.createRef()
    this.tooltipRef = React.createRef()
  }

  componentDidUpdate(prevProps) {
    if (this.props.mode === MAP_MODE.NORMAL && prevProps.mode === MAP_MODE.MEASURE) {
      this.clearMesaurement()
    } else if (this.props.mode === MAP_MODE.MEASURE && prevProps.mode === MAP_MODE.NORMAL) {
      this.initMeasurement()
    }
  }

  render() {
    return (
      <div className={`map-wrapper ${this.props.mode}`}>
        <div id="map" />
        <div>{this.state.measurements.map(({feature, tooltipRef}, i) => <div key={i}><div ref={tooltipRef} className='map-tooltip-measure map-tooltip-measure--old'>{formatLength(feature.getGeometry())}</div></div>)}</div>
        <div ref={this.measureTooltipRef} className='map-tooltip-measure'></div>
        <div ref={this.tooltipRef} className='map-tooltip'></div>
      </div>
    )
  }

  initMap() {
    console.log('Init map')
    const {settings, events} = this.props
    const {center, zoom} = getChartOptions(settings)
    this.map = new Map({
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
    this.map.addInteraction(mouseWheelZoom)

    addCharts(this.map, settings.charts)

    const pinIconStyle = new Style({
      image: new Icon({
        anchor: [0.5, 1],
        anchorXUnits: 'fraction',
        src: 'pin.svg',
        scale: 1
      })
    })
    const pinMarker = new Feature({})
    pinMarker.setStyle(pinIconStyle)
    pinMarker.setStyle((feature, resolution) => {
      pinIconStyle.getImage().setScale(1/Math.pow(resolution, 1/7) * 5)
      return pinIconStyle
    })

    const markerLayer = new VectorLayer({
      source: new VectorSource({
        features: [pinMarker]
      }),
      zIndex: 1001,
    })

    this.map.addLayer(markerLayer)

    events.onValue(({type, value}) => {
      if (type === 'search') {
        const coordinates = fromLonLat([value.longitude, value.latitude])
        this.map.getView().setCenter(coordinates)
        this.map.getView().setZoom(14)
        pinMarker.setGeometry(new Point(coordinates))
        return
      }
      console.log(`Unknown map event type ${type}`)
    })


    function updateHash() {
      const view = this.map.getView()
      const center = view.getCenter()
      const [longitude, latitude] = toLonLat(center)
      const zoom = Math.round(view.getZoom())
      window.history.pushState(null, null, `#${latitude.toFixed(4)}/${longitude.toFixed(4)}/${zoom}`)
    }

    this.map.on('moveend', updateHash.bind(this))

    placeOfficialHarbourMarkers(this.map)
  }

  clearMesaurement() {
    this.map.removeLayer(this.measurementLayer)
    this.map.removeInteraction(this.draw)
    this.state.measurements.forEach(({tooltip}) => {
      this.map.removeOverlay(tooltip)
    })
    this.setState({measurements: []})
    this.measurementLayer = null
    this.draw = null
  }

  initMeasurement() {
    if (!this.map) {
      return
    }
    const source = new VectorSource()
    this.measurementLayer = new VectorLayer({
      source: source,
      zIndex: 10,
      style: new Style({
        fill: new Fill({
          color: '#3450FF'
        }),
        stroke: new Stroke({
          color: '#3450FF',
          width: 3
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: '#3450FF'
          })
        })
      })
    })

    this.map.addLayer(this.measurementLayer)

    this.draw = new Draw({
      source: source,
      type: 'LineString',
      style: new Style({
        fill: new Fill({
          color: '#35abff'
        }),
        stroke: new Stroke({
          color: '#35abff',
          lineDash: [20, 10],
          width: 3
        }),
        image: new CircleStyle({
          radius: 5,
          stroke: new Stroke({
            color: '#ffffff',
            width: 1
          }),
          fill: new Fill({
            color: '#35abff'
          })
        })
      })
    })
    this.map.addInteraction(this.draw)


    var listener
    this.draw.on('drawstart', (evt) => {
      this.currentMeasurement = evt.feature

      this.currentMeasureTooltip = new Overlay({
        element: this.measureTooltipRef.current,
        offset: [0, -15],
        positioning: 'bottom-center'
      })
      this.map.addOverlay(this.currentMeasureTooltip)

      listener = this.currentMeasurement.getGeometry().on('change', (e) => {
        const output = formatLength(e.target)
        const tooltipCoord = e.target.getLastCoordinate()
        this.measureTooltipRef.current.innerHTML = output
        this.currentMeasureTooltip.setPosition(tooltipCoord)
      })
    })

    this.draw.on('drawend', () => {
      const tooltipRef = React.createRef()
      const tooltip = this.currentMeasureTooltip
      const measurements = this.state.measurements.concat([{
        feature: this.currentMeasurement,
        tooltip,
        tooltipRef
      }])
      this.setState({measurements})
      setTimeout(() => {
        tooltip.setElement(tooltipRef.current)
      }, 1)
      unByKey(listener)
    })
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
  const markers = window.HARBOUR_DATA.map(harbour => {
    const harbourIcon = getIconForHarbour(harbour)

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

  const layer = new VectorLayer({
    source: new VectorSource({
      features: markers
    }),
    minZoom: 9,
    zIndex: 1000,
  })

  olMap.addLayer(layer)
}

function formatLength(line) {
  const length = getLength(line)
  return `${(length * M_TO_NM).toFixed(2)} nm`
}
