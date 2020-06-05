const express = require('express')
const turf = require('@turf/turf')

const testDataSample1 = require('./data/plowpath')
const transformer = require('./src/transformer')

const app = express()
const port = 3000


const requestHandler = async (req, res) => {

    transformer.sortByDate(testDataSample1)

    const groupedIds = transformer.groupByAssetId(testDataSample1)
    const optimizedPath = Object.keys(groupedIds).map((key) => {
        const finalPaths = []
        const currentGroup = groupedIds[key]
        transformer.addTurfPath(currentGroup)
        const pushNewPath = (pathArray, currentSegment) => {
            let isIntersected = false
            if (pathArray.length) {
                for (let cursor = 0; cursor < pathArray.length; cursor++) {
                    const latestSegment = pathArray[cursor].turfPath
                    let oldSegment = currentSegment.turfPath

                    const intersection = turf.lineIntersect(latestSegment, oldSegment)
                    if (intersection.features.length > 2) {
                        const firstIntersection = intersection.features[0].geometry
                        const lastIntersection = intersection.features[intersection.features.length - 1].geometry

                        const distanceLatestToFirst = transformer.calculateDistance(latestSegment.geometry.coordinates[0], firstIntersection.coordinates)
                        const distanceCurrentToFirst = transformer.calculateDistance(oldSegment.geometry.coordinates[0], firstIntersection.coordinates)
                        const firstDistanceDifference = distanceLatestToFirst - distanceCurrentToFirst

                        const closestPath = transformer.slicePathFromIntersectionToEnd(lastIntersection.coordinates, oldSegment.geometry.coordinates)
                        const newPath = transformer.buildNewPath(currentSegment.timestamp, closestPath)
                        pathArray.push(newPath)
                        cursor++
                        isIntersected = true
                        if (Math.abs(firstDistanceDifference) > 0.01) { //IF: latest Path are closed to old Path
                            const closestPath = transformer.slicePathFromStartToIntersection(firstIntersection.coordinates, oldSegment.geometry.coordinates)
                            const newPath = transformer.buildNewPath(currentSegment.timestamp, closestPath)
                            pathArray.push(newPath)
                            cursor++
                        }else{
                            console.log(firstDistanceDifference)
                        }
                    }
                }
            }
            if (!isIntersected) {
                pathArray.push(currentSegment)
            }
        }

        let count = 0
        for (let i = 0; i < currentGroup.length; i++) {
            pushNewPath(finalPaths, currentGroup[i])
            count++
        }
        console.log(count)

        for (let i = 0; i < finalPaths.length; i++) {
            if (!finalPaths[i].readings) {
                finalPaths[i].readings = transformer.convertToReading(finalPaths[i].turfPath.geometry.coordinates)
            }
            delete finalPaths[i].turfPath
        }
        return finalPaths
    })
    const finalPath = optimizedPath.reduce((prev, curr) => {
        return prev.concat(curr)
    })
    console.log("requestHandler -> optimizedPath", optimizedPath.length)
    res.status(200)
    res.json(finalPath)
}
app.get('/', requestHandler)
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))


