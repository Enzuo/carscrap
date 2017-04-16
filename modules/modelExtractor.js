const models = [
	['hyundai i20', ['hyundai','i20'],['hyundai','20'],'i20'],
]

const engines = [
	['1.4 crdi 90',  ['1.4','90'],  ['1.4', 'crdi'], '90'],
	['1.1 crdi 75',  ['1.1','75'],  ['1.1', 'crdi'], 'crdi'],
	['1.2 75',       ['1.2','75'],  '75',            'clim'],
	['1.2 84',       ['1.2','84'],  '1.2',           'ea',     'uefa', ['edition','#1'], 'blackline'],
	['1.4 100',      ['1.4','100'], '1.4'],
	['1.4 120',      ['1.4','120']],
	['1.0 tgdi 100', ['1.0','100'], '1.0',           'active', 't-gdi', 'tgdi', '1l'],
	['1.0 tgdi 120', ['1.0','120']],
]

const finitions = [
	['initia',         'initia',             'clim'],
	['intuitive plus', ['intuitive','plus'], 'plus', ['edition','#','1'], ['edition','84'], 'navi'],
	['intuitive',      'intuitive',          'uefa', 'ea'               , 'sports',         'go', 'euro'],
	['creative',       'creative' ],
	['active',         'active' ],
	['pop pack',       'pop',                'pack', 'blackline' ],
]

function extractModel(title, matchTable){
	var simpleTitle = title.toLowerCase().replace(',','.')
	var defDepth=1
	var maxDefDepth = 0
	for(var j=0; j < matchTable.length; j++){
		maxDefDepth = Math.max(maxDefDepth, matchTable[j].length)
	}
	for(var i=0; defDepth < maxDefDepth; i++){
		if(i < matchTable.length === false){
			i=0
			defDepth++
		}
		var model = matchTable[i]
		if(defDepth >= model.length){
			continue
		}
		var definition = model[defDepth]
		if(Array.isArray(definition)){
			var matchingTerms = 0
			for(var k=0; k < definition.length; k++){
				if(simpleTitle.indexOf(definition[k]) >= 0){
					matchingTerms += 1
				}
			}
			if(matchingTerms >= definition.length){
				return model[0]
			}
		}
		else {
			if(simpleTitle.indexOf(definition) >= 0){
				return model[0]
			}
		}
	}
	return ''
}

module.exports = {models, engines, finitions, extractModel}