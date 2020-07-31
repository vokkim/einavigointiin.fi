import Store from 'store'
import * as Bacon from 'baconjs'
import {MAP_MODE} from './enums'

const LOCAL_STORAGE_KEY = 'einavigointiin'

const defaultState = {
  menuOpen: false,
  zoom: 10,
  follow: false,
  showHarbours: true,
  mapMode: MAP_MODE.NORMAL,
  geolocationStatus: 'ok',
  measurements: []
}

const fromLocalStorage = Store.get(LOCAL_STORAGE_KEY) || {}

const initialState = {...defaultState, ...fromLocalStorage}

const updateBus = new Bacon.Bus()

function filterUpdatesForKey(k) {
  return updateBus.filter(({key}) => key === k)
}

function performStateChangeForKey(k) {
  return (state, update) => ({...state, [k]: update.value})
}

export function clearSettingsFromLocalStorage() {
  Store.remove(LOCAL_STORAGE_KEY)
}

function pushUpdateFor(key) {
  return (value) => updateBus.push({key, value})
}

export const state = Bacon.update(
  initialState,
  [filterUpdatesForKey('menuOpen'), performStateChangeForKey('menuOpen')],
  [filterUpdatesForKey('follow'), performStateChangeForKey('follow')],
  [filterUpdatesForKey('showHarbours'), performStateChangeForKey('showHarbours')],
  [filterUpdatesForKey('geolocationStatus'), performStateChangeForKey('geolocationStatus')],
  [filterUpdatesForKey('mapMode'), (state, update) => {
    return {
      ...state,
      mapMode: update.value,
      measurements: update.value !== MAP_MODE.MEASURE ? [] : state.measurements}
  }],
  [filterUpdatesForKey('measurements'), performStateChangeForKey('measurements')]
) //.skipDuplicates((a, b) => JSON.stringify(a) === JSON.stringify(b))


state.onValue(data => {
  const {zoom, follow, showHarbours} = data
  Store.set(LOCAL_STORAGE_KEY, {zoom, follow, showHarbours})
})

export const setMenuOpen = pushUpdateFor('menuOpen')
export const setMapMode = pushUpdateFor('mapMode')
export const setFollow = pushUpdateFor('follow')
export const setGeolocationStatus = pushUpdateFor('geolocationStatus')
export const setMeasurements = pushUpdateFor('measurements')
export const setShowHarbours = pushUpdateFor('showHarbours')
