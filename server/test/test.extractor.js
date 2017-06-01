const test = require('tape')
const extractor = require('../modules/extractor')
const fs = require('fs')


var leParkingHtml = fs.readFileSync(__dirname + '/leparking.html')

test.only('extract car from le parking page', (assert) => {
	var cars = extractor.leparking(leParkingHtml)
	console.log(cars);
	assert.equal(cars.length, 2)
	assert.end()
})