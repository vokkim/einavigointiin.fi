import React from 'react'
import AsyncSelect from 'react-select/async'
import {LighthouseIcon, PinIcon, HarbourIcon} from './icons'
import {parseCoordinates} from './coordinates-parser'

function loadOptions(inputValue) {
  const sanitizedInputValue = inputValue.trim()
  if (sanitizedInputValue.length < 3) {
    return []
  }
  const coordinates = parseCoordinates(sanitizedInputValue)
  if (coordinates) {
    console.log('CORDINATE', coordinates)
    return Promise.resolve([{value: {...coordinates, type: 'coordinate'}}])
  }
  const url = `/search/${sanitizedInputValue}`
  return fetch(url)
    .then(response => {
      if (response.status !== 200) {
        throw new Error(`Search error ${response.status}`)
      }
      return response.json()
    })
    .then(results => {
      return results.map(row => ({
        value: row,
        label: row.name_finnish || row.name_swedish
      })
      )
    })
}

function getIconForType(type) {
  switch (type) {
  case 'turvalaite':
    return <LighthouseIcon />
  case 'official_harbour':
    return <HarbourIcon />
  default:
    return <PinIcon />
  }
}

function optionFormatter({value}, {inputValue}) {
  if (value.type === 'coordinate') {
    const {latitude, longitude} = value
    return <div className="search__value">{getIconForType(value.type)}<span>{`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`}</span></div>
  }
  const trimmedInput = (inputValue || '').trim().toLowerCase()
  const idxFinnish = ((value.name_finnish || '').toLowerCase()).indexOf(trimmedInput)
  const idxSwedish = ((value.name_swedish || '').toLowerCase()).indexOf(trimmedInput)
  const municipality = value.municipality
  const label = idxSwedish > idxFinnish ? value.name_swedish : value.name_finnish || value.name_swedish
  return <div className="search__value">{getIconForType(value.type)}<span>{label}</span> <span className="search__value--municipality">{municipality}</span></div>
}

class IndicatorsContainer extends React.Component {
  render() {
    return ''
  }
}

export default class Search extends React.Component {
  constructor(props) {
    super(props)
    this.state = {input: ''}
  }
  render() {
    return (
      <div id="search">
        <AsyncSelect
          cacheOptions
          defaultOptions
          escapeClearsValue
          value={null}
          menuIsOpen={this.state.input.length < 3 ? false : true}
          className='search'
          classNamePrefix="search"
          components={{IndicatorsContainer}}
          loadingMessage={() => <span>...</span>}
          openMenuOnFocus={false}
          placeholder='Hae saarta, satamaa, paikkaa tai koordinaattia'
          formatOptionLabel={optionFormatter}
          noOptionsMessage={() => <span>Ei hakutuloksia</span>}
          loadOptions={loadOptions}
          onInputChange={this.onInputChange.bind(this)}
          onChange={this.props.onSelect}
        />
      </div>
    )
  }
  onInputChange(input) {
    this.setState({input})
  }
}
