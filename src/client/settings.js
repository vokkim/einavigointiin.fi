import Store from 'store'

const LOCAL_STORAGE_KEY = 'einavigointiin'

const defaultSettings = {
  zoom: 10,
  fullscreen: false,
  follow: true
}

const charts = [
  {
    index: 2,
    name: 'sea',
    maxzoom: 15,
    minzoom: 5,
    opacity: 1,
    tilemapUrl: '/map/{z}/{x}/{y}',
    //bounds: [19.105224609375,59.645540251443215,27.88330078125,65.84776766596988]
  }
]

const fromLocalStorage = Store.get(LOCAL_STORAGE_KEY) || {}

const settings = {...defaultSettings, ...fromLocalStorage, charts}

function clearSettingsFromLocalStorage() {
  Store.remove(LOCAL_STORAGE_KEY)
}

export {
  settings,
  clearSettingsFromLocalStorage
}
