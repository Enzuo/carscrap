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
const extractor = require('./modules/extractor')

var urls = [
	// {
	// 	url : 'http://www.reezocar.com/search/hyundai+i20.html?page=1&minYear=2015&maxYear=2017&minMileage=0&maxMileage=250000%2B&minPrice=100&maxPrice=1000000%2B&energy=petrol&doors=4%2F5&cy=fr&body=hatchback%2Csaloon%2Csmall%2Cestate%2Cmpv%2Csuv%2Cconvertible%2Ccoupe%2Cclassic%2Ccommercial%2Cother&color_int=beige%2Cbrun%2Cgris%2Cnoir%2Cothers&int=al%2Cfl%2Cpl%2Ccl%2Cvl%2Cothers&dist=2000%2B&picture=on',
	// 	scraper : normalScrap,
	// },
	// {
	// 	url : 'http://www.reezocar.com/search/hyundai+i20.html?page=2&minYear=2015&maxYear=2017&minMileage=0&maxMileage=250000%2B&minPrice=100&maxPrice=1000000%2B&energy=petrol&doors=4%2F5&cy=fr&body=hatchback%2Csaloon%2Csmall%2Cestate%2Cmpv%2Csuv%2Cconvertible%2Ccoupe%2Cclassic%2Ccommercial%2Cother&color_int=beige%2Cbrun%2Cgris%2Cnoir%2Cothers&int=al%2Cfl%2Cpl%2Ccl%2Cvl%2Cothers&dist=2000%2B&picture=on',
	// 	scraper : normalScrap,
	// },
	// {
	// 	url : 'http://www.reezocar.com/search/hyundai+i20.html?page=3&minYear=2015&maxYear=2017&minMileage=0&maxMileage=250000%2B&minPrice=100&maxPrice=1000000%2B&energy=petrol&doors=4%2F5&cy=fr&body=hatchback%2Csaloon%2Csmall%2Cestate%2Cmpv%2Csuv%2Cconvertible%2Ccoupe%2Cclassic%2Ccommercial%2Cother&color_int=beige%2Cbrun%2Cgris%2Cnoir%2Cothers&int=al%2Cfl%2Cpl%2Ccl%2Cvl%2Cothers&dist=2000%2B&picture=on',
	// 	scraper : normalScrap,
	// },
	{
		url : 'http://www.leparking.fr/#!/voiture-occasion/i20.html',
		scraper : phantomScrap,
	}
]

db.init()
.then((db) => {
	var carsPromises = []
	for(var i=0; i < urls.length; i++){
		var url = urls[i]
		var p = getPage(url.url, url.scraper)
		.then((html) => {
			return extractor.processPage(html) 
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