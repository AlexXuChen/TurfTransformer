const express = require('express')
const turf = require('@turf/turf')
const data2 = require('./data/data2')
const transformer = require('./src/transformer')

const app = express()
const port = 3000

transformer.sortByDate(data2)
const groupedIds = transformer.groupByAssetId(data2)
Object.keys(groupedIds).map((key) => {
    const currentGroup = groupedIds[key]

    for (let key in currentGroup) {
        const turfPath = transformer.convertToArray(currentGroup[key].readings)
        currentGroup[key].turfPath = turf.lineString(turfPath)
      }
    
    const pushNewPath = (pathArray, currentSegment) => {
        if(!pathArray.length) {
            pathArray.push(currentSegment)
        }else {
            for(let j = 0; j < pathArray.length; j++) {
                const latestSegment = currentSegment.turfPath
                let oldSegment = pathArray[j].turfPath
                const intersection = turf.lineIntersect(latestSegment, oldSegment)
                if (intersection.features.length > 2) {
                    const firstIntersection = intersection.features[0].geometry
                    const lastIntersection = intersection.features[intersection.features.length - 1].geometry
                    
                    const distanceLatestToFirst = transformer.calculateDistance(latestSegment.geometry.coordinates[0], firstIntersection.coordinates)
                    const distanceCurrentToFirst = transformer.calculateDistance(oldSegment.geometry.coordinates[0], firstIntersection.coordinates)
                    const firstDistanceDifference = distanceLatestToFirst - distanceCurrentToFirst
    
                    if (Math.abs(firstDistanceDifference) < 0.01) {
                        const distanceLatestToLast = transformer.calculateDistance(latestSegment.geometry.coordinates[0], lastIntersection.coordinates)
                        const distanceCurrentToLast = transformer.calculateDistance(oldSegment.geometry.coordinates[0], lastIntersection.coordinates)
                        const lastDistanceDifference = distanceLatestToLast - distanceCurrentToLast
                        // console.log("pushNewPath -> oldSegment", oldSegment)
                        // console.log("pushNewPath -> lastIntersection", lastIntersection)
                        const closestPath = transformer.findClosestPathCoords(lastIntersection.coordinates, oldSegment.geometry.coordinates)

                        if (closestPath.length == 1) {
                            closestPath.push(latestSegment.geometry.coordinates[0])
                        }
                        const newPath = transformer.buildNewPath(pathArray[j].timestamp, closestPath)
                        // console.log("pushNewPath -> pathArray", pathArray)
                        // console.log("pushNewPath -> newPath", newPath)
                        pathArray.push(closestPath)
                        console.log("FINAL pushNewPath -> pathArray", pathArray)
                    }
                }
            }
        }
    }

    const finalPaths = []
    let count = 0
    for(let i = 0; i < currentGroup.length; i++) {
        pushNewPath(finalPaths, currentGroup[i])
        count++
    }
    console.log(count)
})

app.get('/', (req, res) => res.json(groupedIds))
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))