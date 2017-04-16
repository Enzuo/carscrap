global.Promise = require('bluebird')
var path = require('path')
var express = require('express')
var debug = require('debug')('server')
var config = require('config')

var db = require('./modules/database')


var app = express()


app.use('/static', express.static('static'))
app.use('/uploads', express.static(config.get('folders.download')))
app.use('/scripts', express.static(path.join(__dirname, 'node_modules/d3/build')))

db.init().then((db) => {
	app.get('/cars', (req, res) => {
		db.compute_cars((err, result) => {
			var success = false
			if(!err) success = true
			res.json({
				success : success,
				data    : result,
				error   : err,
			})
		})
	})
})


app.get('/', function(req, res){
	res.sendFile(path.join(__dirname,'index.html'))
})

debug('server listening')
app.listen(3000)