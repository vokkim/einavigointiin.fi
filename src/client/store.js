import Store from 'store'
import * as Bacon from 'baconjs'
import {MAP_MODE} from './enums'

const LOCAL_STORAGE_KEY = 'einavigointiin'

const defaultState = {
  zoom: 10,
  follow: false,
  mapMode: MAP_MODE.NORMAL,
  geolocationStatus: 'ok'
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
  [filterUpdatesForKey('follow'), performStateChangeForKey('follow')],
  [filterUpdatesForKey('geolocationStatus'), performStateChangeForKey('geolocationStatus')],
  [filterUpdatesForKey('mapMode'), performStateChangeForKey('mapMode')]
).skipDuplicates((a, b) => JSON.stringify(a) === JSON.stringify(b))


state.onValue(data => {
  const {zoom, follow} = data
  Store.set(LOCAL_STORAGE_KEY, {zoom, follow})
})

export const setMapMode = pushUpdateFor('mapMode')
export const setFollow = pushUpdateFor('follow')
export const setGeolocationStatus = pushUpdateFor('geolocationStatus')
