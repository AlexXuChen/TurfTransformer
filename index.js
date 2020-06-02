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
    
    let count = 0
    for(let i = 0; i < currentGroup.length; i++) {
        for (let j = i + 1; j < currentGroup.length; j++) {
            const intersection = turf.lineIntersect(currentGroup[i].turfPath, currentGroup[j].turfPath)
            // console.log(intersection)
            if (intersection.features.length > 2) {
                console.log(intersection)
                count++
            }
        }
    }
    console.log(count)
        

    // for(let i in currentGroup) {
    //     if(i > 0){
    //         for (let j = 0; j < i; j++) {
    //             const intersection = turf.lineIntersect(currentGroup[j].turfPath, currentGroup[i].turfPath)
    //             console.log(currentGroup[i].turfPath, intersection)
    //         }
    //     }
    // }
    // console.log(key)
})

app.get('/', (req, res) => res.json(groupedIds))
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))