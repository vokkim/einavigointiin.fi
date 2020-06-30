import assert from 'assert'
import {parseCoordinates} from '../src/client/coordinates-parser.js'

describe('parseCoordinates', () => {
  it('Should return valid coordinates from latlon strings', () => {
    assert.deepEqual(parseCoordinates('59.222, 22.323'), {latitude: 59.222, longitude: 22.323})
    assert.deepEqual(parseCoordinates('59.222,    22.323'), {latitude: 59.222, longitude: 22.323})
    assert.deepEqual(parseCoordinates('59.222 22.323'), {latitude: 59.222, longitude: 22.323})
    assert.deepEqual(parseCoordinates('59 22'), {latitude: 59, longitude: 22})
    assert.deepEqual(parseCoordinates('59.11,022'), {latitude: 59.11, longitude: 22})
    assert.deepEqual(parseCoordinates('-59.11, -022.23'), {latitude: -59.11, longitude: -22.23})
    assert.deepEqual(parseCoordinates('-59, -180.00'), {latitude: -59, longitude: -180.00})
    assert.deepEqual(parseCoordinates('59.11, 185.1'), null)
    assert.deepEqual(parseCoordinates('-180, 85'), null)
    assert.deepEqual(parseCoordinates('-180- 85'), null)
  })

   it.skip('Should return valid coordinates from HDMS strings', () => {
    assert.deepEqual(parseCoordinates(`59°49'12.2"N 22°11'01.2"E`), {latitude: 59.820056, longitude: 22.183667})
  })
})