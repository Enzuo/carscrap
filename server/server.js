global.Promise = require('bluebird')
var path = require('path')
var express = require('express')
var debug = require('debug')('server')
var config = require('config')

var db = require('./modules/database')


var app = express()


app.use('/static', express.static('./client/static'))
app.use('/uploads', express.static(config.get('folders.download')))
app.use('/scripts', express.static('./node_modules/d3/build'))

db.init().then((db) => {
	app.get('/cars', (req, res) => {
		db.car_flat.where('model=$1', ['hyundai i20'], (err, result) => {
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
	res.sendFile(path.join(__dirname,'../client/index.html'))
})

debug('server listening')
app.listen(3000)