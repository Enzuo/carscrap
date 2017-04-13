var request = require('request')
var cheerio = require('cheerio')
var hasha = require('hasha')
var fs = require('fs')
var fsp = require('fs-promise')
const path = require('path')
const debug = require('debug')('index')
const config = require('config')
const moment = require('moment')

// The URL we will scrape from - in our example Anchorman 2.

var url = 'http://www.imdb.com/title/tt1229340/'

// The structure of our request call
// The first parameter is our URL
// The callback function takes 3 parameters, an error, response status code and the html

init()
// downloadPage(url)
readPage('page.html')
.then((html) => {
	processPage(html);
})
.catch((err) => {
	throw err
});

function readPage(pageName) {
	return fsp.readFile( path.join(config.get('folders.download'), config.get('folders.pages'), pageName), 'utf-8')
}

function downloadPage(url) {
	request(url, function(error, response, html){

		// First we'll check to make sure no errors occurred when making the request

		if(!error){
			// Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionality

			var $ = cheerio.load(html);

			// Finally, we'll define the variables we're going to capture

			var title, release, rating;
			var json = { title : "", release : "", rating : ""};

			var currentDate = moment().format('YYYY-MM-DD')
			var downloadPath = path.join(config.get('folders.download'), config.get('folders.pages'), 'page' + currentDate + '.html')
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

	var photos = $('.primary_photo img')

	for(var i=0; i < photos.length; i++){
		// downloadImage(photos[i].attribs.src)
		getImage(photos[i].attribs.loadlate)
	}
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