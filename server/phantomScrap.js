global.Promise = require('bluebird')
var phantom = require('phantom')
var debug = require('debug')('my-phantom')


//http://stackoverflow.com/questions/11340038/phantomjs-not-waiting-for-full-page-load


function downloadPage(url){

	var _phInstance
	var _page

	return phantom.create(['--ignore-ssl-errors=yes', '--load-images=no'])
	.then(instance => {
		_phInstance = instance

		return _phInstance.createPage()
	}).then(page => {
		_page = page

		page.property('viewportSize', {width: 1280, height: 720}).then(function() {
			debug('set property viewportSize')
		})

		return _page.open(url)
	}).then(status => {

		debug('status', status)

		return waitFor(isParkingResultatsLoaded)
	})
	.then( () => {
		return _page.property('content')
	})
	.then(content => {
		debug('close phantom instance')
		_page.close()
		_phInstance.exit()
		return content
	})

	function isParkingResultatsLoaded(){
		return _page.evaluate(function() {
			var resultats = document.getElementById('resultats')
			if(resultats) {
				return resultats.innerHTML
			}
		}).then( resultats => {
			debug('evaluate')
			if (resultats){
				return true
			}
			else {
				return false
			}
		})
	}
}


function waitFor(testFx, timeOutMillis) {
	return new Promise((resolve, reject) => {
		var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000 //< Default Max Timout is 3s
		var start = new Date().getTime()
		var interval = setInterval(function() {
			testFx().then((condition) => {
				if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
					// If not time-out yet and condition not yet fulfilled
				} else {
					if(!condition) {
						// If condition still not fulfilled (timeout but condition is 'false')
						debug("waitFor() timeout")
						resolve('timeout')
						clearInterval(interval)
					} else {
						// Condition fulfilled (timeout and/or condition is 'true')
						debug('waitFor() finished in ' + (new Date().getTime() - start) + 'ms.')
						clearInterval(interval)
						resolve('condition fulfilled')
					}
				}
			}).catch(error => {
				reject(error)
			})
		}, 250) //< repeat check every 250ms
	})
}


module.exports = { downloadPage }