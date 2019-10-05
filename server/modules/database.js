var config = require('config')
var debug = require('debug')('database')
var massive = require('massive')
var path = require('path')

var connectionString = 'postgres://'+config.get('database.username')+':'+config.get('database.password')+'@'+config.get('database.host')+'/'+config.get('database.name')

module.exports = {
	init : async function () {
		debug('establishing connection...')
		const db = await massive({connectionString, scripts : path.join('server', 'bdb')});
		return db
	}
}