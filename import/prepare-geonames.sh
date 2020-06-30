#!/bin/bash
set -e

PARENT_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd $PARENT_PATH
cd ..

node_modules/mapshaper/bin/mapshaper -i import/locations.geojson -clip source=import/map-area-mask.geojson -o import/locations-clipped.geojson
