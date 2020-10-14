import React from 'react'
import {render} from 'react-dom'
import {Bus} from 'baconjs'
import {MapWrapper} from './map'
import {state, setMapMode, setFollow, setMeasurements, setShowHarbours, setMenuOpen} from './store'
import Search from './search'
import {MeasurementIcon, LocationIcon, TrashIcon, HarbourIcon, MenuIcon, VisibleIcon, HiddenIcon, ShareIcon, EditIcon, MinusIcon, PlusIcon} from './icons'
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

class MenuLayer extends React.Component {
  render() {
    return (
      <div className={`menu__layer ${this.props.visible ? 'visible' : ''} ${this.props.className || ''}`}>
        <button
          className={'menu__layer--button-visiblity'}
          disabled={this.props.disabled}
          onClick={this.props.toggleVisibility}>
          {this.props.visible ? <VisibleIcon /> : <HiddenIcon />}
        </button>
        <span className="menu__layer--label">{this.props.label}</span>
        {this.props.onEdit && <button className="menu__layer--button-action" onClick={this.props.onEdit}><EditIcon /></button>}
        {this.props.onShare && <button className="menu__layer--button-action" onClick={this.props.onShare}><ShareIcon /></button>}
        {this.props.onDelete && <button className="menu__layer--button-action" onClick={this.props.onDelete}><TrashIcon /></button>}
        {this.props.extraIcon}
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
    const enableSmokescreen = this.state.menuOpen
    return (
      <div className={`app ${enableSmokescreen ? 'has-smokescreen' : ''}`}>
        {enableSmokescreen && <div className="smokescreen"  onClick={() => enableSmokescreen && setMenuOpen(false)}></div>}
        <div className="topbar">
          <Search onSelect={onSearchSelect}/>
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

            <div className="topbar__spacer"></div>
            <ToolbarButton
              className={'toolbar__button--zoom-in'}
              onClick={() => zoomIn()}>
              <PlusIcon />
            </ToolbarButton>
            <ToolbarButton
              className={'toolbar__button--zoom-out'}
              onClick={() => zoomOut()}>
              <MinusIcon />
            </ToolbarButton>
          </div>
        </div>
        {this.renderMenu()}
        <MapWrapper {...this.state} events={mapEventBus}/>
      </div>
    )
  }

  renderMenu() {
    return true // For now.
    return (
      <div className="menu__wrapper">
        <div className="menu__toggle" onClick={() => setMenuOpen(!this.state.menuOpen)}>
          <MenuIcon open={this.state.menuOpen}/>
        </div>
        <div className={`menu ${this.state.menuOpen ? 'open' : ''}`}>
          {this.state.menuOpen && (
            <div>
              <MenuLayer
                visible={this.state.showHarbours}
                toggleVisibility={() => setShowHarbours(!this.state.showHarbours)}
                extraIcon={<HarbourIcon />}
                label="Viralliset satamat" />
            </div>
          )}
        </div>
      </div>
    )
  }

  toggleMeasurementMode() {
    setMapMode(this.state.mapMode === MAP_MODE.MEASURE ? MAP_MODE.NORMAL : MAP_MODE.MEASURE)
  }
}


render(<App />, document.getElementById('app'))
