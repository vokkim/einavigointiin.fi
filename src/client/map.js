import React from 'react'
import 'ol/ol.css'
import {Map, View} from 'ol'
import {defaults} from 'ol/interaction'
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom'
import {Vector as VectorLayer} from 'ol/layer'
import Geolocation from 'ol/Geolocation'
import {fromLonLat, toLonLat} from 'ol/proj'
import {setFollow, setGeolocationStatus, setMeasurements} from './store'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import VectorSource from 'ol/source/Vector'
import {ScaleLine} from 'ol/control'
import {Icon, Style} from 'ol/style'
import {MAX_ZOOM, MIN_ZOOM, M_TO_NM, MAP_MODE, GEOLOCATION_STATUS} from './enums'
import {getIconForHarbour} from './map-icons'
import {getLength} from 'ol/sphere'
import Draw from 'ol/interaction/Draw'
import {Circle as CircleStyle, Fill, Stroke} from 'ol/style'
import {unByKey} from 'ol/Observable'
import Overlay from 'ol/Overlay'
import {addCharts} from './map-charts'

export class MapWrapper extends React.Component {
  constructor(props) {
    super(props)
    this.state = {hoveredHarbourFeature: null, hovering: false}
    this.measuringInteraction = null
    this.currentMeasureTooltip = null
    this.currentMeasurement = null
    this.tooltipOverlay = null
    this.pinMarker = null
    this.myLocationMarker = null
    this.tooltipRef = React.createRef()
    this.measureTooltipRef = React.createRef()
    this.selected = null
    this.mouseWheelZoomInteraction = null
    this.harbourMarkerLayer = null
    this.positionAccuracyFeature = new Feature()
    this.positionFeature = new Feature()

    const myLocationIconStyle = new Style({
      image: new Icon({
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        src: '/my-location.svg',
        scale: 1
      })
    })
    this.positionFeature.setStyle((feature, resolution) => {
      myLocationIconStyle.getImage().setScale(1/Math.pow(resolution, 1/5) * 3)
      return myLocationIconStyle
    })

    const positionAccuracyStyle = new Style({
      stroke: new Stroke({
        color: 'rgb(219, 45, 151, 0.9)',
        width: 1
      }),
      fill: new Fill({
        color: 'rgb(219, 45, 151, 0.35)'
      })
    })

    this.positionAccuracyFeature.setStyle(positionAccuracyStyle)
  }

  componentDidMount() {
    this.initMap()
    if (this.props.follow) {
      this.initFollow()
    }
  }

  componentDidUpdate(prevProps) {
    const {mapMode, measurements} = this.props
    const {mapMode: previousMapMode, measurements: previousMeasurements} = prevProps
    if (measurements.length === 0 && previousMeasurements.length > 0) {
      this.clearMeasurements(previousMeasurements)
      this.initMeasurement()
    }
    if (mapMode === MAP_MODE.NORMAL && previousMapMode === MAP_MODE.MEASURE) {
      this.clearMeasurements(previousMeasurements)
    } else if (mapMode === MAP_MODE.MEASURE && previousMapMode === MAP_MODE.NORMAL) {
      this.initMeasurement()
    }

    if (this.props.follow && !prevProps.follow) {
      this.initFollow()
    } else if (!this.props.follow && prevProps.follow) {
      this.cancelFollow()
    }

    this.harbourMarkerLayer.setVisible(this.props.showHarbours)
  }

  render() {
    const selectedHarbour = this.state.hoveredHarbourFeature ? this.state.hoveredHarbourFeature.harbour : null
    return (
      <div className={`map-wrapper ${this.props.mapMode} ${this.state.hovering ? 'hover' : ''}`}>
        <div id="map" />
        <div>{this.props.measurements.map(({feature, tooltipRef}, i) => <div key={i}><div ref={tooltipRef} className='map-tooltip-measure map-tooltip-measure--old'>{formatLength(feature.getGeometry())}</div></div>)}</div>
        <div ref={this.measureTooltipRef} className='map-tooltip-measure'></div>
        <div ref={this.tooltipRef} className='map-tooltip'>
          <div>{selectedHarbour ? selectedHarbour.name : ''}</div>
        </div>
      </div>
    )
  }

  initMap() {
    console.log('Init map')
    const {events} = this.props
    const {center, zoom} = getChartOptions(this.props)

    const scaleLine = new ScaleLine({
      units: 'nautical'
    })

    this.map = new Map({
      target: 'map',
      controls: [scaleLine],
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

    this.mouseWheelZoomInteraction = new MouseWheelZoom({useAnchor: true})

    this.map.addInteraction(this.mouseWheelZoomInteraction)

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
        features: [this.pinMarker, this.positionAccuracyFeature, this.positionFeature]
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
      if (type === 'zoomIn') {
        this.map.getView().setZoom(Math.min(this.map.getView().getZoom() + 1, MAX_ZOOM))
      }
      if (type === 'zoomOut') {
        this.map.getView().setZoom(Math.max(this.map.getView().getZoom() - 1, MIN_ZOOM))
      }
      console.log(`Unknown map event type ${type}`)
    })

    this.harbourMarkerLayer = createHarbourMarkerLayer(this.props.showHarbours)
    this.map.addLayer(this.harbourMarkerLayer)

    this.tooltipOverlay = new Overlay({
      element: this.tooltipRef.current,
      offset: [0, -15],
      positioning: 'bottom-center'
    })

    this.map.addOverlay(this.tooltipOverlay)

    this.map.on('click', this.onMapClick.bind(this))
    this.map.on('pointermove', this.onPointerMove.bind(this))
    this.map.on('moveend', this.onMoveEnd.bind(this))
    this.map.on('pointerdrag', () => {
      if (this.props.follow && this.props.geolocationStatus === GEOLOCATION_STATUS.OK) {
        setFollow(false)
      }
    })
  }

  onMoveEnd() {
    this.updateHash()
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

  clearMeasurements(measurements) {
    this.map.removeLayer(this.measurementLayer)
    this.map.removeInteraction(this.draw)
    measurements.forEach(({tooltip}) => {
      this.map.removeOverlay(tooltip)
    })
    this.currentMeasureTooltip && this.currentMeasureTooltip.setPosition(null)
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
      const measurements = this.props.measurements.concat([{
        feature: this.currentMeasurement,
        tooltip,
        tooltipRef
      }])
      setMeasurements(measurements)
      setTimeout(() => tooltip.setElement(tooltipRef.current), 1)
      unByKey(listener)
    })
  }

  initFollow() {
    const view = this.map.getView()
    setGeolocationStatus(GEOLOCATION_STATUS.LOADING)
    if (this.geolocation) {
      const currentGeometry = this.positionFeature.getGeometry()
      if (this.positionFeature.getGeometry()) {
        view.setCenter(currentGeometry.getCoordinates())
      }
      return
    }

    this.geolocation = new Geolocation({
      trackingOptions: {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      },
      projection: view.getProjection()
    })

    this.geolocation.setTracking(true)

    this.geolocation.on('change', () => {
      const accuracy = this.geolocation.getAccuracy()
      if (accuracy > 200) {
        this.clearPositionMarker()
        setGeolocationStatus(GEOLOCATION_STATUS.ERROR)
        return
      }
      const accuracyGeometry = this.geolocation.getAccuracyGeometry()
      const coordinates = this.geolocation.getPosition()
      this.positionAccuracyFeature.setGeometry(accuracyGeometry)
      this.positionFeature.setGeometry(coordinates ? new Point(coordinates) : null)
      if (this.props.follow) {
        this.mouseWheelZoomInteraction.setMouseAnchor(false)
        view.setCenter(coordinates)
        setGeolocationStatus(GEOLOCATION_STATUS.OK)
      }
    })

    this.geolocation.on('error', () => {
      setGeolocationStatus(GEOLOCATION_STATUS.ERROR)
      this.clearPositionMarker()
    })
  }

  clearPositionMarker() {
    this.positionFeature.setGeometry(null)
    this.positionAccuracyFeature.setGeometry(null)
  }

  cancelFollow() {
    this.mouseWheelZoomInteraction.setMouseAnchor(true)
  }
}

function getChartOptions({zoom}) {
  const hashParts = (window.location.hash || '#').substring(1).split('/').map(parseFloat)
  if (hashParts.length === 3 && hashParts.every(v => isFinite(v))) {
    const center = fromLonLat([hashParts[1], hashParts[0]])
    return {center, zoom: hashParts[2]}
  }
  return {center: fromLonLat([22.96, 59.82]), zoom}
}

function createHarbourMarkerLayer(showHarbours) {
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

  return new VectorLayer({
    source: new VectorSource({
      features: markers
    }),
    minZoom: 9,
    visible: showHarbours,
    zIndex: 1000,
  })
}

function formatLength(line) {
  const length = getLength(line)
  return `${(length * M_TO_NM).toFixed(2)} nm`
}
