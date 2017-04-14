global.Promise = require('bluebird')
var request = require('request')
var cheerio = require('cheerio')
var hasha = require('hasha')
var fs = require('fs')
var fsp = require('fs-promise')
const path = require('path')
const debug = require('debug')('index')
const config = require('config')
const moment = require('moment')

const modelExtractor = require('./modelExtractor')

// The URL we will scrape from - in our example Anchorman 2.

var url = 'http://www.imdb.com/title/tt1229340/'
// url = 'http://www.leparking.fr/#!/voiture-occasion/i20.html'
// url = 'http://www.reezocar.com/search/hyundai+i20.html?page=1&minYear=2015&maxYear=2017&minMileage=0&maxMileage=250000%2B&minPrice=100&maxPrice=1000000%2B&energy=petrol&doors=4%2F5&cy=fr&body=hatchback%2Csaloon%2Csmall%2Cestate%2Cmpv%2Csuv%2Cconvertible%2Ccoupe%2Cclassic%2Ccommercial%2Cother&color_int=beige%2Cbrun%2Cgris%2Cnoir%2Cothers&int=al%2Cfl%2Cpl%2Ccl%2Cvl%2Cothers&dist=2000%2B&picture=on'
url = 'http://www.reezocar.com/search/hyundai+i20.html?size=400&minYear=2015&maxYear=2017&minMileage=0&maxMileage=250000%2B&minPrice=100&maxPrice=1000000%2B&energy=petrol&doors=4%2F5&cy=fr&body=hatchback%2Csaloon%2Csmall%2Cestate%2Cmpv%2Csuv%2Cconvertible%2Ccoupe%2Cclassic%2Ccommercial%2Cother&color_int=beige%2Cbrun%2Cgris%2Cnoir%2Cothers&int=al%2Cfl%2Cpl%2Ccl%2Cvl%2Cothers&dist=2000%2B&picture=on'
url = 'http://www.reezocar.com/search/hyundai+i20.html?size=400&minYear=2015&maxYear=2017&minMileage=0&maxMileage=250000%2B&minPrice=100&maxPrice=1000000%2B&energy=petrol&doors=4%2F5&cy=fr&body=hatchback%2Csaloon%2Csmall%2Cestate%2Cmpv%2Csuv%2Cconvertible%2Ccoupe%2Cclassic%2Ccommercial%2Cother&color_int=beige%2Cbrun%2Cgris%2Cnoir%2Cothers&int=al%2Cfl%2Cpl%2Ccl%2Cvl%2Cothers&dist=2000%2B&picture=on'
// The structure of our request call
// The first parameter is our URL
// The callback function takes 3 parameters, an error, response status code and the html

init()
// downloadPage(url, 'reezocar')
readPage('2017-04-14-reezocar.html')
.then((html) => {
	processPage(html);
})
.catch((err) => {
	throw err
});

function readPage(pageName) {
	return fsp.readFile( path.join(config.get('folders.download'), config.get('folders.pages'), pageName), 'utf-8')
}



function downloadPage(url, pageName) {
	request(url, function(error, response, html){

		// First we'll check to make sure no errors occurred when making the request

		if(!error){
			var currentDate = moment().format('YYYY-MM-DD')
			var downloadPath = path.join(config.get('folders.download'), config.get('folders.pages'),  currentDate + '-' + pageName + '.html')
			fs.writeFile(downloadPath, html, (err) => {
				if(err){
					throw err
				}
				debug('writeFile page')
			});
		}

		debug('error', error)
	})
}

function processPage(html){
	var $ = cheerio.load(html);

	var ads = $('.rzc-ad')

	var cars = []

	for(var i=0; i < ads.length; i++){
		var car = $(ads[i])
		var title = car.find('.ad-title a').html()
		var dateCreated = extractDate(car.find('.ad-date_create').html())
		var imgUrl = car.find('.picture img').attr('src')
		var year = $(car.find('.ad-details li').get(2)).children().remove().end().text()
		var km = $(car.find('.ad-details li').get(3)).children().remove().end().text().match(/\d/g).join('')
		var fuel = $(car.find('.ad-details li').get(4)).children().remove().end().text()
		var gearbox = $(car.find('.ad-details li').get(5)).children().remove().end().text()
		var location = car.find('.ad-picture li.loc').children().remove().end().text().trim()
		var dept = location.match(/\d\d|^$/)
		if(dept){
			dept = dept.join('')
		}
		var source = car.find('.ad-picture li.src a').text().trim()
		var price = car.find('.ad-price').text().match(/\d/g).join('')
		var model = modelExtractor.extractModel(title, modelExtractor.engines) + ' ' + modelExtractor.extractModel(title, modelExtractor.finitions)
		// console.log(i, title, dateCreated, imgUrl)
		console.log(i, title, '---',model);
		// console.log(year, km, fuel, gearbox, dept, source, price)
		
		// downloadImage(photos[i].attribs.src)
		// getImage(photos[i].attribs.loadlate)
	}
}

function extractDate(date){
	return date.match(/(0[1-9]|[1-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/[0-9]{4}/g).join('')
}

function getImage(url){
	return new Promise((resolve, reject) => {
		console.log('start getImage')
		var imgName = path.basename(url)
		debug(imgName)

		// Look in folder , no need to download if it's there
		var imagePath = path.join(config.get('folders.download'), config.get('folders.images'), imgName)
		fsp.stat(imagePath)
		.then(() => {
			debug('image %s exists, loading up...', imgName)
		})
		// Download image
		.catch(() => {
			downloadImage(url, imgName).catch((err) => {
				debug('error', err)
			})
		})
		.catch((err) => {
			debug('error', err)
		})

	})
}

function downloadImage(url, imgName){
	return new Promise( (resolve, reject) => {
		debug('downloading',url)

		// TODO : use url as image name as image name may come twice

		var imagePath = path.join(config.get('folders.download'), config.get('folders.images'), imgName)
		request.head(url, function(err, res, body){
			console.log('content-type:', res.headers['content-type'])
			console.log('content-length:', res.headers['content-length'])

			request(url).pipe(fs.createWriteStream(imagePath)).on('close', () => {
				resolve();
			})
		})
	})
}

function init(){
	var pagesPath = path.join(config.get('folders.download'), config.get('folders.pages'))
	if (!fs.existsSync( pagesPath )) {
		fs.mkdirSync(pagesPath);
	}
	var imagePath = path.join(config.get('folders.download'), config.get('folders.images'))
	if (!fs.existsSync( imagePath )) {
		fs.mkdirSync(imagePath);
	}
	debug('init folder structure done')
}