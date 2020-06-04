const express = require('express')
const turf = require('@turf/turf')
const testDataSample1 = require('./data/data2')
const transformer = require('./src/transformer')

const app = express()
const port = 3000


const requestHandler = async (req, res) => {

    transformer.sortByDate(testDataSample1)
    
    const groupedIds = transformer.groupByAssetId(testDataSample1)
    const optimizedPath = Object.keys(groupedIds).map((key) => {
        const currentGroup = groupedIds[key]
        transformer.addTurfPath(currentGroup)
        
        const pushNewPath = (pathArray, currentSegment) => {
            if(!pathArray.length) {
                pathArray.push(currentSegment)
            }else {
                for(let cursor = 0; cursor < pathArray.length; cursor++) {
                    const latestSegment = pathArray[cursor].turfPath
                    let oldSegment = currentSegment.turfPath

                    const intersection = turf.lineIntersect(latestSegment, oldSegment)
                    if (intersection.features.length > 2) {
                        const firstIntersection = intersection.features[0].geometry
                        const lastIntersection = intersection.features[intersection.features.length - 1].geometry
                        
                        const distanceLatestToFirst = transformer.calculateDistance(latestSegment.geometry.coordinates[0], firstIntersection.coordinates)
                        const distanceCurrentToFirst = transformer.calculateDistance(oldSegment.geometry.coordinates[0], firstIntersection.coordinates)
                        const firstDistanceDifference = distanceLatestToFirst - distanceCurrentToFirst
        
                        if (Math.abs(firstDistanceDifference) < 0.01) { //IF: latest Path are closed to old Path
                            //1. find last intersection
                            //2. get segment between intersection and old Path
                            console.log("old path end is far than latest")
                            const closestPath = transformer.slicePathFromIntersectionToEnd(lastIntersection.coordinates, oldSegment.geometry.coordinates)
                            const newPath = transformer.buildNewPath(currentSegment.timestamp, closestPath)
                            pathArray.push(newPath)
                            cursor ++                            
                        }else {
                            console.log("old path start is far than latest and get path from start to intersection")
                            let closestPath = transformer.slicePathFromStartToIntersection(firstIntersection.coordinates, oldSegment.geometry.coordinates)
                            console.log("pushNewPath -> closestPath", closestPath)
                            let newPath = transformer.buildNewPath(currentSegment.timestamp, closestPath)
                            pathArray.push(newPath)
                            cursor ++
                            closestPath = transformer.slicePathFromIntersectionToEnd(lastIntersection.coordinates, oldSegment.geometry.coordinates)
                            newPath = transformer.buildNewPath(currentSegment.timestamp, closestPath)
                            pathArray.push(newPath)
                            cursor ++                
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
        return finalPaths
    })

  
    res.status(200)
    res.json(optimizedPath)
}
app.get('/', requestHandler)
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))


