global.Promise = require('bluebird')
var request = require('request')
var cheerio = require('cheerio')
var pHash = require('phash')
var fs = require('fs')
var fsp = require('fs-promise')
const path = require('path')
const debug = require('debug')('index')
const config = require('config')
const moment = require('moment')
const md5 = require('blueimp-md5')

const modelExtractor = require('./modules/modelExtractor')
const db = require('./modules/database')

const normalScrap = require('./modules/normalScrap')
const phantomScrap = require('./modules/phantomScrap')

var urls = [
	{
		url : 'http://www.reezocar.com/search/hyundai+i20.html?page=1&minYear=2015&maxYear=2017&minMileage=0&maxMileage=250000%2B&minPrice=100&maxPrice=1000000%2B&energy=petrol&doors=4%2F5&cy=fr&body=hatchback%2Csaloon%2Csmall%2Cestate%2Cmpv%2Csuv%2Cconvertible%2Ccoupe%2Cclassic%2Ccommercial%2Cother&color_int=beige%2Cbrun%2Cgris%2Cnoir%2Cothers&int=al%2Cfl%2Cpl%2Ccl%2Cvl%2Cothers&dist=2000%2B&picture=on',
		scraper : normalScrap,
	},
	// {
	// 	url : 'http://www.reezocar.com/search/hyundai+i20.html?page=2&minYear=2015&maxYear=2017&minMileage=0&maxMileage=250000%2B&minPrice=100&maxPrice=1000000%2B&energy=petrol&doors=4%2F5&cy=fr&body=hatchback%2Csaloon%2Csmall%2Cestate%2Cmpv%2Csuv%2Cconvertible%2Ccoupe%2Cclassic%2Ccommercial%2Cother&color_int=beige%2Cbrun%2Cgris%2Cnoir%2Cothers&int=al%2Cfl%2Cpl%2Ccl%2Cvl%2Cothers&dist=2000%2B&picture=on',
	// 	scraper : normalScrap,
	// },
	// {
	// 	url : 'http://www.reezocar.com/search/hyundai+i20.html?page=3&minYear=2015&maxYear=2017&minMileage=0&maxMileage=250000%2B&minPrice=100&maxPrice=1000000%2B&energy=petrol&doors=4%2F5&cy=fr&body=hatchback%2Csaloon%2Csmall%2Cestate%2Cmpv%2Csuv%2Cconvertible%2Ccoupe%2Cclassic%2Ccommercial%2Cother&color_int=beige%2Cbrun%2Cgris%2Cnoir%2Cothers&int=al%2Cfl%2Cpl%2Ccl%2Cvl%2Cothers&dist=2000%2B&picture=on',
	// 	scraper : normalScrap,
	// },
	// {
	// 	url : 'http://www.leparking.fr/#!/voiture-occasion/i20.html',
	// 	scraper : phantomScrap,
	// }
]

db.init()
.then((db) => {
	var carsPromises = []
	for(var i=0; i < urls.length; i++){
		var p = getPage(urls[i].url, urls[i].scraper)
		.then((html) => {
			return processPage(html) 
		})
		.then((cars) => {
			return Promise.all(cars.map(addImageHash)) //TODO : cars.map(addImageHash)
		})
		.catch((err) => {
			throw err
		})
		carsPromises.push(p)
	}

	Promise.all(carsPromises).then((cars) => {
		//http://stackoverflow.com/questions/10865025/merge-flatten-an-array-of-arrays-in-javascript
		var mergedCars = [].concat.apply([], cars)

		console.log('merged cars', mergedCars)

		// db.car_scrap.insert(mergedCars, (err, res) => {
		// 	if(err) debug('error in db',err)
		// 	debug('cars inserted', res)
		// 	debug('computing car flat...')
		// 	db.compute_cars((err, result)=>{
		// 		if(err) throw err
		// 		debug('car flat computed succesfully', result)
		// 	})
		// })
	})
})

/**
 * 
 * @param {String} url 
 * @param {String} pageName 
 * @returns Promise
 * @resolve {String} Html Code of the page
 */
function getPage(url, scraper) {
	var currentDate = moment().format('YYYY-MM-DD')
	var pageName = currentDate + '-' + url.replace(/\/|:|\?/g,'_')
	pageName = pageName.substring(0, 80)
	var pagePath = path.join(config.get('folders.download'), config.get('folders.pages'), pageName)		
	return fsp.stat(pagePath)
	.then(()=>{
		debug('get local page', pageName)
		return fsp.readFile( path.join(config.get('folders.download'), config.get('folders.pages'), pageName), 'utf-8')
	})
	.catch(()=> {
		var _html
		return scraper.downloadPage(url, pagePath)
		.then((html) => {
			_html = html
			return fsp.writeFile(pagePath, html)
		})
		.then(() => {
			return _html
		})
	})
}

/**
 * Process Reezocar style html to extract cars informations
 * @param {*} html 
 * @return return array of cars
 */
function processPage(html){
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
	//TODO
	return Promise.all(carsImagesPromises)
}

function extractDate(date){
	var extracted_date = date.match(/(0[1-9]|[1-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/[0-9]{4}/g).join('')
	return moment(extracted_date, 'DD/MM/YYYY').format('YYYY-MM-DD')
}

function addImageHash(car){
	return getImage(car.imgUrl).then( (image) => {
		car.imgPHash = image.imgPHash
		car.imgName  = image.imgName
		return car
	})
}

function getImage(url){
	return new Promise((resolve) => {
		var imgName = url.replace(/\/|:|\?/g,'_')

		// Look in folder , no need to download if it's there
		var imagePath = path.join(config.get('folders.download'), config.get('folders.images'), imgName)
		var image = {}
		image.imgName = imgName
		image.imgPHash = ''
		fsp.stat(imagePath)
		.then(() => {
			// debug('image %s exists, loading up...', imgName)
			pHash.imageHash(imagePath, function(err, hash){
				if(err){
					debug(err + imgName)
					resolve(image)
				}
				image.imgPHash = md5(hash)
				resolve(image)
			})
		})
		// Download image
		.catch(() => {
			downloadImage(url, imagePath)
			.then(() => {
				pHash.imageHash(imagePath, function(err, hash){
					if(err){
						debug(err + imgName)
						resolve(image)
					}
					image.imgPHash = md5(hash)
					resolve(image)
				})
			})
		})
	})
}

function downloadImage(url, imagePath){
	return new Promise( (resolve) => {
		debug('download Image',url)

		request.head(url, function(){
			// console.log('content-type:', res.headers['content-type'])
			// console.log('content-length:', res.headers['content-length'])

			request(url).pipe(fs.createWriteStream(imagePath)).on('close', () => {
				resolve()
			})
		})
	})
}