import React from 'react'
import {render} from 'react-dom'
import {Bus} from 'baconjs'
import Map from './map'
import {settings} from './settings'
import Search from './search'

const mapEventBus = new Bus()

function onSearchSelect(e) {
  mapEventBus.push({type: 'search', value: {latitude: e.value.latitude, longitude: e.value.longitude}})
}

class App extends React.Component {

  render() {
    return (
      <div>
        <div className="topbar">
          <Search onSelect={onSearchSelect}/>
        </div>
        <Map settings={settings} events={mapEventBus}/>
      </div>
    )
  }
}

render(<App />, document.getElementById('app'))
