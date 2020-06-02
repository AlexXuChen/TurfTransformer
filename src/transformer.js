const _ = require('lodash')

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

module.exports = { transformData, groupByAssetId, sortByDate, convertToArray }