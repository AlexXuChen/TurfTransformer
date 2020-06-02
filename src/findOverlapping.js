const turf = require('@turf/turf')

const convertToArray = (paths) => {
  return paths.map(path => [path.latitude, path.longitude])

findOverlapping = async (vehiclePath) => {
  const newPaths = []
  const overlappingPaths = []
  for(let key in vehiclePath) {
    const turfPath = turf.lineString(convertToArray(vehiclePath[key].readings))
    newPaths.push(turfPath)
  }
  for(let key in newPaths) {
    const newPath = newPaths[key]
    for(let newKey in newPaths) {
      if(newKey !== key) {
        const currentPath = newPaths[newKey]
        var overlapping = turf.lineOverlap(currentPath, newPath);
        console.log(currentPath)
        // if(overlapping.features.geometry) {
        //   console.log(overlapping.features.geometry)
        //   overlappingPaths.push(overlapping)
        // }
      }
    }
  }
  return overlappingPaths
}

const findIntersection = (vehiclePath) => {
  for(let key in vehiclePath) {
    const turfPath = convertToArray(vehiclePath[key].readings)
    vehiclePath[key].turfPath = turf.lineString(turfPath)
  }
const intersection = turf.lineIntersect(vehiclePath[0].turfPath, vehiclePath[1].turfPath)
console.log(intersection)
return intersection
}

const findLength = (vehiclePath) => {
lengths = []
  for (let key in vehiclePath) {
    const turfPath = convertToArray(vehiclePath[key].readings)
    lengths.push(turf.length(turf.lineString(turfPath)))
  }
  return lengths
}

module.exports = { findOverlapping, findIntersection, findLength }