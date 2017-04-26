global.Promise = require('bluebird')
var request = require('request')
var debug = require('debug')('normalScrap')

function downloadPage(url) {
	return new Promise((resolve, reject) => {
		debug('download Page', url)
		request(url, function(error, response, html){
			// First we'll check to make sure no errors occurred when making the request
			if(!error){
				resolve(html)
			}
			else{
				reject(error)
			}
		})
	})
}

module.exports = { downloadPage }