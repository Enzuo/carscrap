const cheerio = require('cheerio')
const moment = require('moment')
const debug = require('debug')('extractor')

const modelExtractor = require('./modelExtractor')


/**
 * Process Reezocar style html to extract cars informations
 * @param {*} html 
 * @return return array of cars
 */
function reezocar(html){
	debug('reezocar process page')
	var $ = cheerio.load(html)

	var ads = $('.rzc-ad')

	var cars = []

	for(var i=0; i < ads.length; i++){
		var carAd = $(ads[i])
		var car = {}
		car.title = carAd.find('.ad-title a').html()
		car.dateAdded = extractDate(carAd.find('.ad-date_create').html())
		car.imgUrl = carAd.find('.picture img').attr('src')
		/* TODO can crash moment */
		car.year = moment($(carAd.find('.ad-details li').get(2)).children().remove().end().text()).format('YYYYMMDD')
		car.mileage = $(carAd.find('.ad-details li').get(3)).children().remove().end().text().match(/\d/g).join('')
		car.fuel = $(carAd.find('.ad-details li').get(4)).children().remove().end().text()
		car.gearbox = $(carAd.find('.ad-details li').get(5)).children().remove().end().text()
		car.location = carAd.find('.ad-picture li.loc').children().remove().end().text().trim()
		var departement = car.location.match(/\d\d|^$/)
		if(departement){
			departement = departement.join('')
		}
		car.departement = departement
		car.source = carAd.find('.ad-picture li.src a').text().trim()
		car.price = carAd.find('.ad-price').text().match(/\d/g).join('')
		var model = carAd.find('.ad-details .brand').children().remove().end().text() + carAd.find('.ad-details .model').children().remove().end().text()
		car.model = modelExtractor.extractModel(model, modelExtractor.models) || modelExtractor.extractModel(car.title, modelExtractor.models)
		car.spec = modelExtractor.extractModel(car.title, modelExtractor.engines) + ' ' + modelExtractor.extractModel(car.title, modelExtractor.finitions)
		
		// carsImagesPromises.push(addImageToData(imgUrl, car))
		cars.push(car)
	}

	return cars
}

function leparking(html){
	debug('leparking process page')
	var $ = cheerio.load(html)
	var cars = []
	return cars
}


function extractDate(date){
	var extracted_date = date.match(/(0[1-9]|[1-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/[0-9]{4}/g).join('')
	return moment(extracted_date, 'DD/MM/YYYY').format('YYYY-MM-DD')
}

module.exports = { reezocar, leparking }