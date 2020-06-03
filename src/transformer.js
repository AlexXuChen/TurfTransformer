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

const slicePathFromIntersection = (intersectionCoords, segmentsCoords) => {
    console.log("slicePathFromIntersection -> intersectionCoords", intersectionCoords)
    const distances = segmentsCoords.map(segment => {
        return calculateDistance(intersectionCoords, segment)
    })
    const minDistance = Math.min.apply(Math, distances)

    const newPath = segmentsCoords.slice(segmentsCoords.indexOf(minDistance))
    if(newPath.length === 1) newPath.unshift(intersectionCoords)
    return newPath
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

const addTurfPath = (currentGroup) => {
    for (let key in currentGroup) {
        const turfPath = convertToArray(currentGroup[key].readings)
        currentGroup[key].turfPath = turf.lineString(turfPath)
    }
}

module.exports = { 
    transformData, 
    groupByAssetId,
    sortByDate,
    convertToArray,
    calculateDistance,
    slicePathFromIntersection,
    buildNewPath,
    addTurfPath
}