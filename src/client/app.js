import React from 'react'
import {render} from 'react-dom'
import {Bus} from 'baconjs'
import {MapWrapper} from './map'
import {state, setMapMode, setFollow, setMeasurements} from './store'
import Search from './search'
import {MeasurementIcon, LocationIcon, TrashIcon, MinusIcon, PlusIcon} from './icons'
import {MAP_MODE} from './enums'

const mapEventBus = new Bus()

function onSearchSelect(e) {
  mapEventBus.push({type: 'search', value: {latitude: e.value.latitude, longitude: e.value.longitude}})
}

function zoomIn() {
  mapEventBus.push({type: 'zoomIn'})
}
function zoomOut() {
  mapEventBus.push({type: 'zoomOut'})
}

class Button extends React.Component {
  render() {
    return (
      <div className="button_wrapper">
        <button
          className={`button ${this.props.active ? 'active' : ''} ${this.props.className || ''}`}
          disabled={this.props.disabled}
          onClick={this.props.onClick}>
          {this.props.children}
        </button>
        {this.props.active && (this.props.secondaryButtons || [])}
      </div>
    )
  }
}


class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    state.onValue(newState => this.setState(newState))
  }

  render() {
    if (!this.state.mapMode) {
      return <div></div>
    }
    const measurementMode = this.state.mapMode === MAP_MODE.MEASURE
    return (
      <div className={'app'}>
        <div className="topbar">
          <Button
            active={this.state.follow}
            className={`button--geolocation-${this.state.geolocationStatus}`}
            onClick={() => setFollow(!this.state.follow)}>
            <LocationIcon />
          </Button>
          <Button
            active={measurementMode}
            onClick={this.toggleMeasurementMode.bind(this)}
            secondaryButtons={[
              <Button
                key={1}
                className="button--secondary"
                onClick={() => setMeasurements([])}
                disabled={this.state.measurements.length === 0}>
                <TrashIcon />
              </Button>
            ]}>
            <MeasurementIcon />
          </Button>

          <Search onSelect={onSearchSelect}/>

          <div className="topbar__spacer"></div>
        </div>
        <div className="zoombar">
          <Button
            className={'button--zoom-in'}
            onClick={() => zoomIn()}>
            <PlusIcon />
          </Button>
          <Button
            className={'button--zoom-out'}
            onClick={() => zoomOut()}>
            <MinusIcon />
          </Button>
        </div>
        <MapWrapper {...this.state} events={mapEventBus}/>
      </div>
    )
  }

  toggleMeasurementMode() {
    setMapMode(this.state.mapMode === MAP_MODE.MEASURE ? MAP_MODE.NORMAL : MAP_MODE.MEASURE)
  }
}


render(<App />, document.getElementById('app'))
