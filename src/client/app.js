import React from 'react'
import {render} from 'react-dom'
import {Bus} from 'baconjs'
import {MapWrapper} from './map'
import {state, setMapMode, setFollow, setMeasurements, setShowHarbours} from './store'
import Search from './search'
import {MeasurementIcon, LocationIcon, TrashIcon, HarbourIcon} from './icons'
import {MAP_MODE} from './enums'

const mapEventBus = new Bus()

function onSearchSelect(e) {
  mapEventBus.push({type: 'search', value: {latitude: e.value.latitude, longitude: e.value.longitude}})
}

class ToolbarButton extends React.Component {
  render() {
    return (
      <div className="toolbar__buttonwrapper">
        <button
          className={`toolbar__button ${this.props.active ? 'active' : ''} ${this.props.className || ''}`}
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
      <div>
        <div className="topbar">
          <Search onSelect={onSearchSelect}/>
        </div>
        <div className="toolbar">
          <ToolbarButton
            active={this.state.follow}
            className={`toolbar__button--geolocation-${this.state.geolocationStatus}`}
            onClick={() => setFollow(!this.state.follow)}>
            <LocationIcon />
          </ToolbarButton>
          <ToolbarButton
            active={measurementMode}
            onClick={this.toggleMeasurementMode.bind(this)}
            secondaryButtons={[
              <ToolbarButton
                key={1}
                className="toolbar__button--secondary"
                onClick={() => setMeasurements([])}
                disabled={this.state.measurements.length === 0}>
                <TrashIcon />
              </ToolbarButton>
            ]}>
            <MeasurementIcon />
          </ToolbarButton>

          <ToolbarButton
            active={this.state.showHarbours}
            onClick={() => setShowHarbours(!this.state.showHarbours)}>
            <HarbourIcon />
          </ToolbarButton>
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
