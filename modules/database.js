var config = require('config')
var debug = require('debug')('database')
var massive = require('massive')

var connectionString = 'postgres://'+config.get('database.username')+':'+config.get('database.password')+'@'+config.get('database.host')+'/'+config.get('database.name')

module.exports = {
	init : function () {
		return new Promise((resolve, reject) => {
			debug('establishing connection...')
			massive.connect({connectionString}, function(err, db){
				if (err) return reject(err)
				resolve(db)
			})
		})
	}
}