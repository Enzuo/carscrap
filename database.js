var config = require('config')
var debug = require('debug')('database')

/*******************************************************************************
 *
 *                                  Sequelize
 * 
 ******************************************************************************/
/*
var Sequelize = require('sequelize')

var sequelize = new Sequelize(config.get('database.name'), config.get('database.username'), config.get('database.password'),{
	host: config.get('database.host'),
	dialect: 'postgres',	
	pool: {
		max: 5,
		min: 0,
		idle: 10000
	},
})

var carScrap = sequelize.define('carScrap_seq', {
	imgHash: Sequelize.BIGINT,

	mytitle: Sequelize.STRING,
	model: Sequelize.STRING,
	year: Sequelize.DATE,
	km: Sequelize.INTEGER,
	
	imgUrl: Sequelize.STRING,
	fuel: Sequelize.STRING,
	gearbox: Sequelize.STRING,
	dateCreated: Sequelize.DATE,
	dateSeen: { type : Sequelize.DATE, defaultValue: Sequelize.NOW },
	departement: Sequelize.STRING,
	source: Sequelize.STRING,
	
	price: Sequelize.INTEGER,
})

carScrap.sync().then(() => {
	debug('carScrap model synced')
	return carScrap.create({
		imgHash: '034832',
		title: 'Super car'
	})
})
*/
// Bad :
// - Doesnt alter table
// 
// Good :
// - Good autocompletion for types
// - Promises


/*******************************************************************************
 *
 *                                  Node ORM 
 * 
 ******************************************************************************/
/*
var orm = require('orm')

var opts = {
	host: config.get('database.host'),
	database: config.get('database.name'),
	user: config.get('database.username'),
	password: config.get('database.password'),
	protocol: 'postgres',
	// port: '3306',
	query: {pool: true}
}

orm.connect(opts, (err, db) => {
	if (err) throw err
	var carScrap = db.define('carScrap_orm', {
		imgHash: { type : 'integer' },

		title: String,
		model: String,
		year: Date,
		km: { type : 'integer' },
		
		imgUrl: String,
		fuel: String,
		gearbox: String,
		dateCreated: Date,
		// dateSeen: { type : 'date', defaultValue: function() { return new Date() } },
		departement: String,
		source: String,
		
		price: { type : 'integer' },
	})

	db.sync(function(err) {
		if (err) throw err
		carScrap.create({
			imgHash: '034832',
			title: 'Super car'
		}, function(err) {
			if (err) throw err
		})
	})
})
*/
// Bad :
// - couldn't get it to work easily
// - less types than sequelize
// - can't migrate my model Cannot redefine property: model
// - The name, making it hard to find help on google

var massive = require('massive')
var connectionString = 'postgres://'+config.get('database.username')+':'+config.get('database.password')+'@'+config.get('database.host')+'/'+config.get('database.name')

var opts = {
	db: config.get('database.name'),
	host: config.get('database.host'),
	username: config.get('database.username'),
	password: config.get('database.password'),
}
massive.connect({connectionString}, function(err, db){
	if (err) throw err
	//just pass in the sku as an argument
	//your SQL would be 'select * from products where sku=$1'
	db.setup((err, res) => {
		if(err) throw err

		// console.log(db)

		db.car_ads.insert({
			imgHash: '034832',
			title: 'Super car'
		}, function(err, res){
			if(err) throw err
		})
	})
})


