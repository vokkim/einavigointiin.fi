//'40° 26.7717, -79° 56.93172'

const latLonCoordinates = /^-?[0-9]{1,2}(\.?[0-9]{1,10})?[,\s]{1,2}?\s*-?[0-9]{1,3}(\.?[0-9]{1,10})?$/g
const minutesSecondsCoordinates = /^\d{1,2}[°\s]\s*\d{1,2}['\s]\s*\d{1,2}(\.\d{1,2})["\s]?[NS][\s,]\s*\d{1,2}[°\s]\s*\d{1,2}['\s]\s*\d{1,2}(\.\d{1,2})["\s]?[EW]$/g // 59°49'12.0"N 22°00'00.0"E

export function parseCoordinates(value) {
  if (value.match(latLonCoordinates)) {
    const sanitizedValue = value.replace(/\s\s*/g, ' ').replace(/[,\s]\s?/g, ',')
    const [latitude, longitude] = sanitizedValue.split(',').map(parseFloat)
    if (latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
      return {latitude, longitude}
    }
  }
  if (value.match(minutesSecondsCoordinates)) {
    //console.log('minsec match!')
  }
  return null
}
