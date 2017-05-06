global.Promise = require('bluebird')
var phantom = require('phantom')
var debug = require('debug')('my-phantom')


//http://stackoverflow.com/questions/11340038/phantomjs-not-waiting-for-full-page-load

var _phInstance
var _page
var _ressourceLoader = []

var _scrapedHTML = ''
var _lastScrapedHTML = ''
var _pageNumberToLoad = 2


function initPhantomJs(){
	debug('initPhantomJS')
	// return phantom.create(['--ignore-ssl-errors=yes', '--load-images=no', '--remote-debugger-port=9000'])
	return phantom.create(['--ignore-ssl-errors=yes', '--load-images=no'])
	.then(instance => {
		_phInstance = instance

		return _phInstance.createPage()
	}).then(page => {
		_page = page


		// _page.property(onConsoleMessage, function(msg) {
  		// 	console.log(msg);
		// }

		page.on('onResourceRequested', function (requestData, networkRequest) {
			// debug('!request',requestData.url,'ID:',requestData.id)
			_ressourceLoader.push({
				id   : requestData.id,
				url  : requestData.url,
				time : Date.now(),
				done : false,
			})
		})

		page.on('onResourceReceived', function(responseData){
			// debug('onResourceReceived', responseData.id)
			var request = _ressourceLoader.find((request) => {
				if(request.id === responseData.id){
					return true
				}
			})
			request.done = true
			request.timeStarted = request.time
			request.time = Date.now()
		})
	})
}

function closePhantomJS(){
	debug('close phantom instance')
	_page.close()
	_phInstance.exit()
}

function downloadPage(url){

	return initPhantomJs()
	.then(() => {
		_page.property('viewportSize', {width: 1280, height: 720}).then(function() {
			debug('set property viewportSize')
		})
		return _page.open(url)
	})
	.then(loadFirstResultPage)
	.then(loadAllOtherPages)
	.then(() => {
		closePhantomJS()
		return _scrapedHTML
	})
	.catch((err) => {
		debug('ERROR', err)
		closePhantomJS()
		return _scrapedHTML
	})

	function loadAllOtherPages(){
		return promiseWhile( () => {
			// > 2500 cause there can be sponsor ads on every empty pages (about 2056 characters)
			// TODO should count stuff with cheerio instead here
			var shouldContinue = _lastScrapedHTML !== '' && _lastScrapedHTML.length > 2500 && _pageNumberToLoad <= 40 ? true : false 
			debug('shouldContinueLoadingPages ?', shouldContinue, _pageNumberToLoad) 
			return shouldContinue
		}, 
		() => {
			debug('load Page', _pageNumberToLoad)
			return leParking.loadPage(_pageNumberToLoad)		
			.then(leParking.waitForPageLoad)
			.then(() => {
				return waitFor(leParking.isParkingResultatsLoaded, 7000)
			})
			.then(leParking.getResultList)
			.then(resultsHTML => {
				_pageNumberToLoad++
				_lastScrapedHTML = resultsHTML
				_scrapedHTML += resultsHTML
			})
		})
	}

	function loadFirstResultPage(){
		debug('start scraping')
		return leParking.waitForPageLoad()
		.then(() => {
			return waitFor(leParking.isParkingResultatsLoaded, 7000)
		})
		.then(leParking.getResultList)
		.then(resultsHTML => {
			_lastScrapedHTML = resultsHTML
			_scrapedHTML += resultsHTML
		})
	}


	// function loadResultPage(status){
	// 	// debugger
	// 	debug('status', status)
	// 	return waitFor(isParkingResultatsLoaded)
	// 	.then( () => {
	// 		return _page.property('content')
	// 	})
	// 	.then( () => {		
	// 		return pWait(50000)
	// 	})
	// 	.then( (content) => {
	// 		// debug('content 1', content)
	// 		debug('load Page')
	// 		// return _page.evaluate(function(data) {
	// 		// 	console.log('data', data)
	// 		// 	return ctrl.setPage_reload(2)
	// 		// })
	// 		// return _page.evaluateJavaScript('function() { return window }')
	// 		// return _page.evaluate(function (){
	// 		// 	return window.ctrl
	// 		// })
	// 		// return _page.injectJs('nextPage.js').then(() => {
	// 			// return _page.evaluate(function () {
	// 			// 	return window.loadPage()
	// 			// })
	// 		// })
	// 		return _page.evaluate(function(){
	// 			return window.ctrl.set_pageReload(2)
	// 			// return JSON.stringify(Object.keys(window.ctrl))
	// 		})
	// 	}).then( (res) => {
	// 		debug('setPage_reload result', res)
	// 		return pWait(50000)
	// 	})
	// 	.then( () => {
	// 		return _page.property('content')
	// 	})
	// 	.then( (content) => {
	// 		// debug('content 2', content)
	// 		return _page.evaluate(function() {
	// 			var resultats = document.getElementById('resultats')
	// 			return resultats.innerHTML
	// 		})
	// 	})
	// 	.then((resultats)=>{
	// 		console.log('RESULTATS page 2', resultats)
	// 		return waitFor(isParkingResultatsLoaded)
	// 	})
	// 	.then(() => {
	// 		debug('load Page test finished')
	// 	})
	// }
}


var leParking = {
	
	getResultList : function () {
		return _page.evaluate(function() {
			var resultats = document.getElementById('resultats')
			if(resultats){
				return resultats.innerHTML
			}
		})
	},

	loadPage : function (number) {
		debug('loadPage',number)
		return _page.evaluate(function(pNumber){
			return window.ctrl.set_pageReload(pNumber)
			// return JSON.stringify(Object.keys(window.ctrl))
		}, number)
		.then((result) => {
			debug('loadPage result ?', result)
			_ressourceLoader = []
			return waitFor(() => {
				return Promise.resolve(_ressourceLoader.length > 0 ? true : false)
			}, 5000)
		})
	},

	waitForPageLoad : function () {
		return new Promise((resolve, reject) => {
			var timeoutId = setTimeout(() => {
				reject('TIMEOUT waitForPageLoad')
			}, 120000)
			waitAfterLastRequest(() => {
				clearTimeout(timeoutId)
				resolve()
			})
		})
	},

	isParkingResultatsLoaded : function(){
		return leParking.getResultList()
		.then( resultats => {
			debug('evaluate')
			return resultats ? true : false
		})
	},
}

function waitAfterLastRequest (callback) {

	var undone = _ressourceLoader.find((element) => {
		return element.done === false ? true : false
	})
	var timeToWait = 5000
	var currentTime = Date.now()
	var timeSinceLastRequest = currentTime - _ressourceLoader[_ressourceLoader.length-1].time
	var timeRemainingToWait = timeToWait - timeSinceLastRequest

	if(undone){
		debug('request not finished')
		timeRemainingToWait = timeToWait
	}

	debug('waitAfterLastRequest', timeRemainingToWait)
	if(timeRemainingToWait <= 0){
		return callback()
	}
	setTimeout(() => {
		waitAfterLastRequest(callback)
	}, timeRemainingToWait)
}

// https://github.com/ariya/phantomjs/blob/master/examples/waitfor.js
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
						reject('TIMEOUT waitFor')
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



// http://blog.victorquinn.com/javascript-promise-while-loop
var promiseWhile = function(condition, action) {
	var resolver = Promise.defer()

	var loop = function() {
		if (!condition()) return resolver.resolve()
		return Promise.cast(action())
			.then(loop)
			.catch(resolver.reject)
	}

	process.nextTick(loop)

	return resolver.promise
}

var pWait = function(time){
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve()
		}, time)
	})
}

module.exports = { downloadPage }

//ctrl.setPage_reload(2)