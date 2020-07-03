import {Icon} from 'ol/style'

export function getIconForHarbour(harbour) {
  switch (harbour.type) {
  case 'official_harbour':
    return new Icon({
      anchor: [0.25, 0.5],
      anchorXUnits: 'fraction',
      src: createIconForHarbour(harbour.harbour_number),
      scale: 1
    })
  case 'merikarhu_harbour':
    return merikarhuHarbourIcon
  default:
    return null
  }
}

const merikarhuHarbourIcon = new Icon({
  anchor: [0.5, 0.5],
  anchorXUnits: 'fraction',
  src: createIconForMerikarhuHarbour(),
  scale: 1
})

function createIconForHarbour(number) {
  const harbourIconAsText = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="31px" height="14px" viewBox="0 0 31 14" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
<g id="Group-46" transform="translate(1.000000, 1.000000)">
<text fill="#EE3339" font-family="ArialMT, Arial" font-size="9" font-weight="normal" letter-spacing="0.2">
<tspan x="14" y="9">${number}</tspan>
</text>
<g>
<circle stroke="#EE3339" fill-opacity="0.559686407" fill="#FEFEFE" cx="6" cy="6" r="6"></circle>
<polygon fill="#EE3339" points="5 1 10 7 5 7"></polygon>
<path d="M3.79305374,4.83082608 L8.40473886,10.7259805 C6.75954003,11.0688737 5.4131096,10.5707029 4.36544758,9.23146804 C3.31778555,7.89223319 3.12698761,6.42535253 3.79305374,4.83082608 Z" fill="#EE3339" transform="translate(5.904739, 7.830826) rotate(-51.000000) translate(-5.904739, -7.830826) "></path>
</g>
</g>
</g>
</svg>`.replace('\n', '')

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(harbourIconAsText)
}

function createIconForMerikarhuHarbour() {
  const harbourIconAsText = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="15px" height="15px" viewBox="0 0 15 15" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
<g transform="translate(1.000000, 1.000000)">
<path d="M4.5,5.5 L5,11.2570625" stroke="#007F44" stroke-width="0.5" stroke-linecap="square"></path>
<circle stroke="#007F44" cx="6.5" cy="6.5" r="6.5" stroke-width="1.2"></circle>
<path d="M8.7078346,2.2843464 C8.01234144,3.65969974 7.57248322,4.85081948 7.38825994,5.8577056 C7.20403666,6.86459173 7.20403666,8.07755002 7.38825994,9.49658048 C6.5727345,9.40016789 5.7825442,9.40016789 5.01768905,9.49658048 C4.2528339,9.59299308 3.71179075,9.76079958 3.3945596,10 C3.53713238,8.39738746 3.94215644,7.1114452 4.6096318,6.1421732 C5.27710717,5.1729012 6.64317477,3.88695893 8.7078346,2.2843464 Z" fill="#007F44"></path>
<path d="M8.64214667,6.95757203 C6.5609206,8.76204176 5.69406655,10.2982376 6.04158452,11.5661595 L4.61480263,13.459563 C4.14718969,11.40399 4.2471209,9.89156755 4.91459626,8.92229555 C5.52962772,8.02917977 6.37192252,7.11361168 8.32292692,6.7170227 C8.47999118,6.68509557 8.58639777,6.76527868 8.64214667,6.95757203 Z" fill="#007F44" transform="translate(6.483996, 10.084883) rotate(-127.000000) translate(-6.483996, -10.084883) "></path>
</g>
</g>
</svg>`.replace('\n', '')

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(harbourIconAsText)
}

