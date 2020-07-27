import React from 'react'
import 'ol/ol.css'
import {Map, View} from 'ol'
import {defaults} from 'ol/interaction'
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom'
import {Vector as VectorLayer} from 'ol/layer'
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
import {addCharts} from './map-charts'

export const MAP_MODE = {MEASURE: 'measure', NORMAL: 'normal'}

export class MapWrapper extends React.Component {
  constructor(props) {
    super(props)
    this.state = {measurements: [], hoveredHarbourFeature: null, hovering: false}
    this.measuringInteraction = null
    this.currentMeasureTooltip = null
    this.currentMeasurement = null
    this.tooltipOverlay = null
    this.pinMarker = null
    this.tooltipRef = React.createRef()
    this.measureTooltipRef = React.createRef()
    this.selected = null
  }

  componentDidMount() {
    this.initMap()
  }

  componentDidUpdate(prevProps) {
    if (this.props.mode === MAP_MODE.NORMAL && prevProps.mode === MAP_MODE.MEASURE) {
      this.clearMesaurement()
    } else if (this.props.mode === MAP_MODE.MEASURE && prevProps.mode === MAP_MODE.NORMAL) {
      this.initMeasurement()
    }
  }

  render() {
    const selectedHarbour = this.state.hoveredHarbourFeature ? this.state.hoveredHarbourFeature.harbour : null
    return (
      <div className={`map-wrapper ${this.props.mode} ${this.state.hovering ? 'hover' : ''}`}>
        <div id="map" />
        <div>{this.state.measurements.map(({feature, tooltipRef}, i) => <div key={i}><div ref={tooltipRef} className='map-tooltip-measure map-tooltip-measure--old'>{formatLength(feature.getGeometry())}</div></div>)}</div>
        <div ref={this.measureTooltipRef} className='map-tooltip-measure'></div>
        <div ref={this.tooltipRef} className='map-tooltip'>
          <div>{selectedHarbour ? selectedHarbour.name : ''}</div>
        </div>
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
        projection: 'EPSG:3857',
        center,
        zoom,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
      })
    })

    const mouseWheelZoom = new MouseWheelZoom({useAnchor: true})
    this.map.addInteraction(mouseWheelZoom)

    addCharts(this.map)

    const pinIconStyle = new Style({
      image: new Icon({
        anchor: [0.5, 1],
        anchorXUnits: 'fraction',
        src: '/pin.svg',
        scale: 1
      })
    })
    this.pinMarker = new Feature({})
    this.pinMarker.setStyle((feature, resolution) => {
      pinIconStyle.getImage().setScale(1/Math.pow(resolution, 1/7) * 5)
      return pinIconStyle
    })

    const markerLayer = new VectorLayer({
      source: new VectorSource({
        features: [this.pinMarker]
      }),
      zIndex: 1001,
    })

    this.map.addLayer(markerLayer)

    events.onValue(({type, value}) => {
      if (type === 'search') {
        const coordinates = fromLonLat([value.longitude, value.latitude])
        this.map.getView().setCenter(coordinates)
        this.map.getView().setZoom(14)
        this.pinMarker.setGeometry(new Point(coordinates))
        return
      }
      console.log(`Unknown map event type ${type}`)
    })

    placeOfficialHarbourMarkers(this.map)

    this.tooltipOverlay = new Overlay({
      element: this.tooltipRef.current,
      offset: [0, -15],
      positioning: 'bottom-center'
    })

    this.map.addOverlay(this.tooltipOverlay)

    this.map.on('click', this.onMapClick.bind(this))
    this.map.on('pointermove', this.onPointerMove.bind(this))
    this.map.on('moveend', () => {
      this.updateHash()
    })

  }


  onMapClick() {
    this.pinMarker.setGeometry(null)
  }

  onPointerMove(e) {
    if (!e.dragging) {
      const pixel = this.map.getEventPixel(e.originalEvent)
      const features = this.map.getFeaturesAtPixel(pixel, {hitTolerance: 3})
      const harbourFeatures = features.filter(f => Boolean(f.harbour))
      const hasHarbourFeatures = Boolean(harbourFeatures.length)
      if (hasHarbourFeatures !== this.state.hovering) {
        this.setState({hovering: hasHarbourFeatures})
      }

      if (hasHarbourFeatures) {
        if (harbourFeatures[0] !== this.state.hoveredHarbourFeature) {
          this.setState({hoveredHarbourFeature: harbourFeatures[0]})
          this.tooltipOverlay.setPosition(harbourFeatures[0].getGeometry().getCoordinates())
        }
      } else {
        if (this.state.hoveredHarbourFeature) {
          this.setState({hoveredHarbourFeature: null})
          this.tooltipOverlay.setPosition(null)
        }
        return
      }
    }
  }

  updateHash() {
    const view = this.map.getView()
    const center = view.getCenter()
    const [longitude, latitude] = toLonLat(center)
    const zoom = Math.round(view.getZoom())
    window.history.pushState(null, null, `#${latitude.toFixed(4)}/${longitude.toFixed(4)}/${zoom}`)
  }

  clearMesaurement() {
    this.map.removeLayer(this.measurementLayer)
    this.map.removeInteraction(this.draw)
    this.state.measurements.forEach(({tooltip}) => {
      this.map.removeOverlay(tooltip)
    })
    this.setState({measurements: []})
    this.currentMeasureTooltip.setPosition(null)
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
      stopClick: true,
      type: 'LineString',
      style: new Style({
        fill: new Fill({
          color: '#35abff'
        }),
        stroke: new Stroke({
          color: '#35abff',
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
      setTimeout(() => tooltip.setElement(tooltipRef.current), 1)
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

function placeOfficialHarbourMarkers(olMap) {
  const markers = window.HARBOUR_DATA.map(harbour => {
    const harbourIcon = getIconForHarbour(harbour)

    const iconStyle = new Style({
      image: harbourIcon
    })
    const marker = new Feature({
      geometry: new Point(fromLonLat([harbour.longitude, harbour.latitude])),
    })
    marker.harbour = harbour

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
