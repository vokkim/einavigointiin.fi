import React from 'react'
import {render} from 'react-dom'
import {Bus} from 'baconjs'
import {MapWrapper} from './map'
import {state, setMapMode, setFollow} from './store'
import Search from './search'
import {MeasurementIcon, LocationIcon} from './icons'
import {MAP_MODE} from './enums'

const mapEventBus = new Bus()

function onSearchSelect(e) {
  mapEventBus.push({type: 'search', value: {latitude: e.value.latitude, longitude: e.value.longitude}})
}

class ToolbarButton extends React.Component {
  render() {
    return (
      <button
        className={`toolbar__button ${this.props.active ? 'active' : ''} ${this.props.className || ''}`}
        onClick={this.props.onClick}>
        {this.props.children}
      </button>
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
    return (
      <div>
        <div className="topbar">
          <Search onSelect={onSearchSelect}/>
        </div>
        <div className="toolbar">
          <ToolbarButton
            active={this.state.mapMode === MAP_MODE.MEASURE}
            onClick={this.toggleMeasurementMode.bind(this)}>
            <MeasurementIcon />
          </ToolbarButton>
          <ToolbarButton
            active={this.state.follow}
            className={`toolbar__button--geolocation-${this.state.geolocationStatus}`}
            onClick={() => {
              setFollow(!this.state.follow)}
            }>
            <LocationIcon />
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
