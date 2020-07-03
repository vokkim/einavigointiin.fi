import React from 'react'
import {render} from 'react-dom'
import {Bus} from 'baconjs'
import {MapWrapper, MAP_MODE} from './map'
import {settings} from './settings'
import Search from './search'
import {MeasurementIcon} from './icons'

const mapEventBus = new Bus()

function onSearchSelect(e) {
  mapEventBus.push({type: 'search', value: {latitude: e.value.latitude, longitude: e.value.longitude}})
}

class Button extends React.Component {
  render() {
    return (
      <button
        className={`topbar__button ${this.props.active ? 'active' : ''}`}
        onClick={this.props.onClick}>
        {this.props.children}
      </button>
    )
  }
}

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state={mapMode: MAP_MODE.NORMAL}
  }

  render() {
    return (
      <div>
        <div className="topbar">
          <Search onSelect={onSearchSelect}/>
          <Button
            active={this.state.mapMode === MAP_MODE.MEASURE}
            onClick={this.toggleMeasurementMode.bind(this)}>
            <MeasurementIcon />
          </Button>
        </div>
        <MapWrapper settings={settings} events={mapEventBus} mode={this.state.mapMode}/>
      </div>
    )
  }

  toggleMeasurementMode() {
    this.setState({mapMode: this.state.mapMode === MAP_MODE.MEASURE ? MAP_MODE.NORMAL : MAP_MODE.MEASURE})
  }
}

render(<App />, document.getElementById('app'))
