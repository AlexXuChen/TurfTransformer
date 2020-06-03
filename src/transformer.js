const _ = require('lodash')
const turf = require('@turf/turf')

const transformData = () => {

}

const convertToArray = (paths) => {
    return paths.map(path => [path.latitude, path.longitude])
  }

const sortByDate = (vehiclePath) => {
    vehiclePath.sort(function(x, y){
          return new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime();
      })
}

const groupByAssetId = (lines) => {
    return _.mapValues(_.groupBy(lines, 'assetId'),
line => line.map(reading => _.omit(reading, 'assetId')));
}

const calculateDistance = (first, second) => turf.distance(turf.point(first), turf.point(second))

const findClosestPathCoords = (coords, segments) => {
    const distances = segments.map(segment => {
        return calculateDistance(coords, segment)
    })
    const minDistance = Math.min.apply(Math, distances)
    return segments.slice(segments.indexOf(minDistance))
}

const buildNewPath = (timestamp, coordinates) => {
    return{
        timestamp, 
        plowing: true,
        turfPath: {
            type: 'Feature',
            properties: {},
            geometry: { 
                type: 'LineString', 
                coordinates 
            }
        }
    }
}

module.exports = { transformData, groupByAssetId, sortByDate, convertToArray, calculateDistance, findClosestPathCoords, buildNewPath }