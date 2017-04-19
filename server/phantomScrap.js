global.Promise = require('bluebird')
var phantom = require('phantom')
var debug = require('debug')('my-phantom')


//http://stackoverflow.com/questions/11340038/phantomjs-not-waiting-for-full-page-load
var phInstance, _page, outObj
var requestsArray = []

// var outObj = phInstance.createOutObject();
// outObj.requestsArray = [];


phantom.create(['--ignore-ssl-errors=yes', '--load-images=no'])
.then(instance => {

	phInstance = instance

	// outObj = phInstance.createOutObject();
	// outObj.requestsArray = [];

	return phInstance.createPage()
}).then(page => {

	page.viewportSize = {
		width: 1280,
		height: 720
	};

	page.property('viewportSize', {width: 1280, height: 720}).then(function() {
		console.log('set property viewportSize')
	});

	// page.onResourceRequested = function(requestData, networkRequest) {
	// 	requestsArray.push(requestData.id);
	// 	console.log('!request',requestData.id)
	// };

	// page.onResourceReceived = function(response) {
	// 	var index = requestsArray.indexOf(response.id);
	// 	requestsArray.splice(index, 1);
	// 	console.log('!received',response.id)
	// };

	// page.property('onResourceRequested', function(requestData, networkRequest, debug, out) {
	// 	if(debug){
	// 	// do something with it
	// 	}
	// 	out.requestsArray.push(requestData.id);
	// 	console.log('!request',requestData.id)
	// }, process.env.DEBUG, outObj)

	page.on('onResourceRequested', function (requestData, networkRequest) {
		requestsArray.push(requestData.url); // this would push the url into the urls array above
		debug('!request',requestData.id)
	});

	page.on('onResourceRequested', function (response) {
		var index = requestsArray.indexOf(response.id)
		requestsArray.splice(index, 1)
		debug('!received',response.id)
	});

	// page.property('onResourceReceived', function(response) {
	// 	var index = requestsArray.indexOf(response.id)
	// 	requestsArray.splice(index, 1)
	// 	console.log('!received',response.id)
	// })


    _page = page
    // return _page.open('http://www.leparking.fr/#!/voiture-occasion/nissan.html')
    // return _page.open('http://www.imdb.com/')
	return _page.open('http://www.leparking.fr/#!/voiture-occasion/i20.html')
}).then(status => {

	
    console.log('status', status)
	// _page.property('readyState').then(readyState => {
	// 	console.log('readyState', readyState)
	// })



	return waitFor(isParkingResultatsLoaded)
})
// .then(waitNoNetwork)
.then( (content) => {
    return _page.property('content')
})
.then(content => {
    // console.log(content)
	console.log('close')
    _page.close()
    phInstance.exit()
}).catch(e => console.log(e))


function waitNoNetwork(){
	return new Promise((resolve, reject) => {
		var interval = setInterval(() => {
			if (requestsArray.length === 0) {
				console.log('page loaded !')
				clearInterval(interval);
				return resolve(_page.property('content'))
			}
		}, 3500)
	})
}

function isParkingResultatsLoaded(){
	return _page.evaluate(function() {
		var resultats = document.getElementById('resultats')
		if(resultats) {
			return resultats.innerHTML
		}
	}).then( resultats => {
		console.log('evaluate', resultats)
		if (resultats){
			return true
		}
		else {
			return false
		}
	})
}

function waitFor(testFx, onReady, timeOutMillis) {
	return new Promise((resolve, reject) => {
		var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000 //< Default Max Timout is 3s
		var start = new Date().getTime()
		// var condition = false
		var interval = setInterval(function() {
			testFx().then((condition) => {
				if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
					// If not time-out yet and condition not yet fulfilled
					// condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
				} else {
					if(!condition) {
						// If condition still not fulfilled (timeout but condition is 'false')
						console.log("'waitFor()' timeout");
						resolve()
						// phInstance.exit(1);
						clearInterval(interval)
					} else {
						// Condition fulfilled (timeout and/or condition is 'true')
						console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
						clearInterval(interval); //< Stop this interval
						resolve()
					}
				}
			}).catch(error => {
				reject(error)
			})
		}, 250) //< repeat check every 250ms
	})
};
