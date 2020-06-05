const express = require('express')
const turf = require('@turf/turf')

const testDataSample1 = require('./data/plowpath')
const transformer = require('./src/transformer')

const app = express()
const port = 3000


const requestHandler = async (req, res) => {

    transformer.sortByDate(testDataSample1)

    const groupedIds = transformer.groupByAssetId(testDataSample1)

    const optimizedPaths = Object.keys(groupedIds).map((key) => {
        const currentGroup = groupedIds[key]
        transformer.addTurfPath(currentGroup)

        for (let currentCursor = 0; currentCursor < currentGroup.length; currentCursor++) {

            const latestSegment = currentGroup[currentCursor]
            const latestTurfPath = latestSegment.turfPath
            
            for(let subCursor = currentCursor+1;  subCursor < currentGroup.length; subCursor++){
                const oldSegment = currentGroup[subCursor]
                const oldTurfPath = oldSegment.turfPath
                const intersection = turf.lineIntersect(latestTurfPath, oldTurfPath)
                if(intersection.features.length > 2){
                    const newPath = []
                    const firstIntersection = intersection.features[0].geometry
                    const lastIntersection = intersection.features[intersection.features.length - 1].geometry

                    const distanceLatestToFirst = transformer.calculateDistance(latestTurfPath.geometry.coordinates[0], firstIntersection.coordinates)
                    const distanceCurrentToFirst = transformer.calculateDistance(oldTurfPath.geometry.coordinates[0], firstIntersection.coordinates)
                    const firstDistanceDifference = distanceLatestToFirst - distanceCurrentToFirst

                    const closestEndPath = transformer.slicePathFromIntersectionToEnd(lastIntersection.coordinates, oldTurfPath.geometry.coordinates)
                    const newEndPath = transformer.buildNewPath(oldSegment.timestamp, closestEndPath)
                    newPath.push(newEndPath)
                    if (Math.abs(firstDistanceDifference) > 0.01) { //IF: latest Path are closed to old Path
                        const closestStartPath = transformer.slicePathFromStartToIntersection(firstIntersection.coordinates, oldTurfPath.geometry.coordinates)
                        const newStartPath = transformer.buildNewPath(oldSegment.timestamp, closestStartPath)
                        newPath.unshift(newStartPath)
                    }
                    currentGroup.splice(subCursor, 1, ...newPath)
                    if(newPath.length === 2) subCursor++

                }

            }
        }

        for (let i = 0; i < currentGroup.length; i++) {
            if (!currentGroup[i].readings) {
                currentGroup[i].readings = transformer.convertToReading(currentGroup[i].turfPath.geometry.coordinates)
            }
            delete currentGroup[i].turfPath
        }
        return currentGroup
       
    })
  
    const finalOptimizedPaths = optimizedPaths.reduce((prev, curr) => {
        return prev.concat(curr)
    })
    
    res.status(200)
    res.json(finalOptimizedPaths)
}
app.get('/', requestHandler)
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))


