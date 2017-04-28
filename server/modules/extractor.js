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

	var ads = $('.li-result')
	var cars = []
	for(var i=0; i < ads.length; i++){
		var carAd = $(ads[i])
		var car = {}

		car.title = carAd.find('.bloc-titre-list').text().replace(/\n/g, ' ').replace(/ {2,}/g, ' ').trim()
		car.dateAdded = extractDate(carAd.find('.btn-publication').text())
		car.lastSeen = extractDate(carAd.find('.btn-maj').text())
		car.imgUrl = carAd.find('.figure img').attr('src')

		if(car.imgUrl === '/lng/fr_FR/images/visuel_generique.jpg'){
			car.imgUrl = 'http://www.leparking.fr/lng/fr_FR/images/visuel_generique.jpg'
		}

		var detailsBloc = carAd.find('.left-annonce-bloc li')
		car.year = $(detailsBloc.get(2)).text().match(/\d{4}/).join('')
		car.mileage = $(detailsBloc.get(1)).text()
		car.fuel = $(detailsBloc.get(0)).text()
		car.gearbox = $(detailsBloc.get(4)).text()
		car.location = $(detailsBloc.get(5)).text()
		var departement = car.location.match(/\d\d|^$/)
		if(departement){
			departement = departement.join('')
		}
		car.departement = departement
		
		var sources = ''
		carAd.find('.link-mysite.tag_f_list a').each((index, element) => {
			if(index > 0){
				sources += '; '
			}
			sources += $(element).text()
		})
		car.source = sources
		car.price = carAd.find('.prix-bf .prix').text().match(/\d/g).join('')

		// car.title += ' ' + $(detailsBloc.get(6)).children().remove().end().text()
		car.model = modelExtractor.extractModel(car.title, modelExtractor.models) || modelExtractor.extractModel(car.title, modelExtractor.models)
		
		car.title += ' ' + $(detailsBloc.get(6)).text()
		car.spec = modelExtractor.extractModel(car.title, modelExtractor.engines) + ' ' + modelExtractor.extractModel(car.title, modelExtractor.finitions)
		
		// console.log('car', car)
		cars.push(car)
	}
	return cars
}

function processPage(html){
	var $ = cheerio.load(html)
	var author = $('meta[name^="author"]').attr('content')
	if(author && author.match('Reezocorp')){
		return reezocar(html)
	}
	return leparking(html)
}


function extractDate(date){
	var extracted_date = date.match(/(0[1-9]|[1-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/[0-9]{4}/g).join('')
	return moment(extracted_date, 'DD/MM/YYYY').format('YYYY-MM-DD')
}

module.exports = { reezocar, leparking, processPage }