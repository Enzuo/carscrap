global.Promise = require('bluebird')
const request = require('request')
const pHash = require('phash')
const fs = require('fs')
const fsp = require('fs-promise')
const path = require('path')
const debug = require('debug')('index')
const config = require('config')
const moment = require('moment')
const md5 = require('blueimp-md5')
const _ = require("underscore")._


const db = require('./modules/database')

const scrapers = {
	normalScrap : require('./modules/normalScrap'),
	phantomScrap : require('./modules/phantomScrap'),
}
const extractor = require('./modules/extractor')

var urls = config.get('urls')

db.init()
.then((db) => {
	var carsPromises = []
	for(var i=0; i < urls.length; i++){
		var url = urls[i]
		var p = getPage(url.url, scrapers[url.scraper])
		.then((html) => {
			return extractor.processPage(html) 
		})
		.then((cars) => {
			return Promise.map(cars, addImageHash, {concurrency: 2})
		})
		.catch((err) => {
			debug('got an error scrapping all cars', err)
		})
		carsPromises.push(p)
	}

	Promise.all(carsPromises).then((cars) => {
		//http://stackoverflow.com/questions/10865025/merge-flatten-an-array-of-arrays-in-javascript
		var mergedCars = [].concat.apply([], cars)

		// console.log('merged cars', mergedCars)
		debug('got all merged Cars from different url sources', mergedCars.length)
		var allCarScraps = prepareCarScrap(mergedCars, ['title','dateAdded','year','mileage','fuel','gearbox','location','departement','source','price','model','spec','imgPHash','imgName'])
		
		debug('got allCarScraps ready for insert')
		db.car_scrap.insert(allCarScraps, (err, res) => {
			if(err) {
				debug(allCarScraps)
				return debug('error in db',err)
			}
			debug('cars inserted', res)
			debug('computing car flat...')
			db.compute_cars((err, result)=>{
				if(err) throw err
				debug('car flat computed succesfully', result)
			})
		})
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
						debug(err, imgName)
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

		// TODO change method here, handle stream error
		// Also think up some security to avoid asking 1000+ images from the server at the same time...
		request.head(url, function(){
			// console.log('content-type:', res.headers['content-type'])
			// console.log('content-length:', res.headers['content-length'])

			request(url).pipe(fs.createWriteStream(imagePath)).on('close', () => {
				resolve()
			})
		})
	})
}

function prepareCarScrap(cars, keys){
	var carsScrap = []
	for(var i=0; i<cars.length; i++){
		carsScrap.push(_.pick(cars[i], keys))
	}
	return carsScrap
}