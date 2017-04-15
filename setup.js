global.Promise = require('bluebird')
var debug = require('debug')('setup')
var config = require('config')
var path = require('path')
var fs = require('fs')
var db = require('./modules/database')

initFolders()

db.init().then((db) => {
	debug('creating database structure')
	db.setup((err) => {
		if (err) throw err
		debug('done')
	})
})


function initFolders(){
	debug('creating download folders')
	var pagesPath = path.join(config.get('folders.download'), config.get('folders.pages'))
	if (!fs.existsSync( pagesPath )) {
		fs.mkdirSync(pagesPath)
	}
	var imagePath = path.join(config.get('folders.download'), config.get('folders.images'))
	if (!fs.existsSync( imagePath )) {
		fs.mkdirSync(imagePath)
	}
}