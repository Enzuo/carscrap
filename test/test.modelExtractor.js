const test = require('tape')
const modelExtractor = require('../modelExtractor')


const engines = [
	['1.2 75',       ['1.2','75'],  '75', 'clim'],
	['1.2 84',       ['1.2','84'],  '1.2', 'ea', 'uefa'],
	['1.4 100',      ['1.4','100'], '1.4'],
	['1.4 120',      ['1.4','120']],
	['1.0 tgdi 100', ['1.0','100'], '1.0', 'active', 't-gdi', 'tgdi'],
	['1.0 tgdi 120', ['1.0','120']],
]

test('extract first depth definition', (assert) => {
	var engine = modelExtractor.extractModel('my car 1.2 cv84', engines)
	assert.equal(engine, '1.2 84')
	assert.end()
})

test('no matching defintion', (assert) => {
	var engine = modelExtractor.extractModel('kangoo 1.3 super 100', engines)
	assert.equal(engine, '')
	assert.end()
})

test('deep definition', (assert) => {
	var engine = modelExtractor.extractModel('my car with clim', engines)
	assert.equal(engine, '1.2 75')
	assert.end()
})

test('only matching one parameter of an array definition', (assert) => {
	var engine = modelExtractor.extractModel('my car 120', engines)
	assert.equal(engine, '')
	assert.end()
})

test('same definition depth first model is favorite', (assert) => {
	var engine = modelExtractor.extractModel('my car 1.0 75', engines)
	assert.equal(engine, '1.2 75')
	assert.end()
})

test('can find model with deepest definition', (assert) => {
	var engine = modelExtractor.extractModel('my car is a tgdi', engines)
	assert.equal(engine, '1.0 tgdi 100', 'should find model with deepest definition')
	assert.end()
})

test('do not care about uppercases', (assert) => {
	var engine = modelExtractor.extractModel('my car is a TgDI', engines)
	assert.equal(engine, '1.0 tgdi 100', 'find the model even with uppercases')
	assert.end()
})