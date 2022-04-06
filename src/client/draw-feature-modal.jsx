import React from 'react'
import {PinIcon, HarbourIcon} from './icons'

export default class DrawFeatureModal extends React.Component {
  constructor(props) {
    super(props)
    const {feature} = props
    this.state = {
      name: feature.name || '',
      icon: feature.icon || '',
      color: feature.color || '',
      description: feature.description || ''
    }
  }

  render() {
    const feature = this.state.selectedDrawFeature
    return (
      <div className="draw-feature modal">
          <div>
          <label>
            Nimi:
            <input type="text" value={this.state.name} onChange={(e) => this.setState({name: e.target.value})} />
          </label>
          </div>

          <div>
          <label>
            Kuvake:
            <input type="text" value={this.state.icon} onChange={(e) => this.setState({icon: e.target.value})} />
          </label>
          </div>

          <div>
          <label>
            Väri:
            <input type="text" value={this.state.color} onChange={(e) => this.setState({color: e.target.value})} />
          </label>
          </div>

          <div>
          <label>
            Kuvaus:
            <input type="text" value={this.state.description} onChange={(e) => this.setState({description: e.target.value})} />
          </label>
          </div>
          <button onClick={() => this.submit()}>OK</button>
      </div>
    )
  }

  submit() {
    console.log('SUBMIT')
    const {feature} = this.props
    feature.name = this.state.name
    feature.icon = this.state.icon
    feature.color = this.state.color
    feature.description = this.state.description
    this.props.onValue(feature)
  }
}