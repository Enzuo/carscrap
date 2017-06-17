const test = require('tape')
const extractor = require('../modules/extractor')
const fs = require('fs')


var leParkingHtml = fs.readFileSync(__dirname + '/leparking.html')

test('extract car from le parking page', (assert) => {
	var cars = extractor.leparking(leParkingHtml)
	console.log(JSON.stringify(cars, null, 2))
	assert.equal(cars.length, 2)
	assert.end()
})