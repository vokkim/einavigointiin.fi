import Store from 'store'

const LOCAL_STORAGE_KEY = 'einavigointiin'

const defaultSettings = {
  zoom: 10,
  fullscreen: false,
  follow: true
}

const fromLocalStorage = Store.get(LOCAL_STORAGE_KEY) || {}

const settings = {...defaultSettings, ...fromLocalStorage}

function clearSettingsFromLocalStorage() {
  Store.remove(LOCAL_STORAGE_KEY)
}

export {
  settings,
  clearSettingsFromLocalStorage
}
