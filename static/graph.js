var models = []

var svg = d3.select('#graph').append('svg')
svg.attr('height','100%')
.attr('width','100%')


fetch('/cars')
.then(function(response){
	if(response.ok){
		var contentType = response.headers.get('content-type');
		if(contentType && contentType.indexOf('application/json') !== -1) {
			return response.json()
		}
		throw 'error return type'
	}
	else{
		throw 'error'
	}
})
.then(function(response){
	buildGraph(response.data)
})

var renderColorFunc = colorFromModel

function buildGraph(data) {

	// var bbox = svg.node().getBBox()
	var bbox = svg.node().getBoundingClientRect()
	var width = bbox.width
	var height = bbox.height
	var marginLeft = 15
	var marginRight = 5
	var marginTop = 5
	var marginBottom = 5

	models = listCarModels(data)
	models = models.sort(function(a, b) {
		return b.nb - a.nb 
	})

	document.getElementById('legend').appendChild(renderLegend(models))


	var maxMileage = d3.max(data, function(d) { return d.mileage })
	var maxPrice = d3.max(data, function(d) { return d.price })
	var minPrice = d3.min(data, function(d) { return d.price })
	var xScale = d3.scaleLinear()
		.domain([0, maxMileage])
		.range([0 + marginLeft, width - marginRight])

	var yScale = d3.scaleLinear()
		.domain([minPrice, maxPrice])
		.range([height - marginBottom, 0 + marginTop])


	svg.selectAll('circle')
	.data(data)
	.enter().append('circle')
	.attr('cy',function(d){ return yScale(d.price) })
	.attr('cx',function(d){ return xScale(d.mileage) })
	// .attr('fill', function(d, i) {return colorFromSellTime(d) })
	.attr('fill', function(d) {return renderColorFunc(d, models) })
	.attr('r', 4 )
	.attr('opacity', 0.7 )
	.on('mouseover', function(d) {
		d3.select('#preview')
		.html(renderCarPreview(d))
		.transition()
		.style('opacity', 1)
	})

	document.getElementById('button-models').addEventListener('click', function(){
		renderColorFunc = colorFromModel
		updateGraphColors()
	})

	document.getElementById('button-market-time').addEventListener('click', function(){
		renderColorFunc = colorFromMarketTime
		updateGraphColors()

		// svg.selectAll('circle').attr('fill', function(d) {return colorFromSellTime(d) })
	})
}


function listCarModels(data){
	var models = []
	for(var i=0; i < data.length; i++){
		var car = data[i]
		models = addCarModel(car, models)
	}
	return models
}

function selectCarModel(index){
	for(var i=0; i<models.length; i++){
		models[i].active = false
	}
	models[index].active = true
}

function addCarModel(car, models) {
	for (var j=0; j < models.length; j++) {
		if(models[j].label === car.spec.trim() ){
			models[j].nb += 1
			models[j].minPrice = Math.min(models[j].minPrice, car.price)
			models[j].maxPrice = Math.max(models[j].maxPrice, car.price)
			models[j].avgPrice = models[j].avgPrice + ((car.price - models[j].avgPrice) / models[j].nb)
			return models
		}
	}
	models.push({ label : car.spec.trim(), nb : 1, minPrice : car.price, maxPrice : car.price, avgPrice : car.price, color : pickRandomColor(car.spec) })
	return models
}

var colorsPool = ['#6ffbb0', '#8e30fb', '#124fb8', '#ab8762', '#008adc', '#55ca19', '#e59fe8', '#2e7011', '#fa5004', '#25e8d5', '#fcec33', '#058a88', '#e60b7d', '#f99823']
function pickRandomColor(modelName){
	if(modelName.trim() === ''){
		return '#999'
	}
	if(colorsPool.length <= 0){
		return '#000'
	}
	var index = Math.floor(Math.random()*colorsPool.length)
	var color = colorsPool[index]
	colorsPool.splice(index, 1)
	return color
}

function renderLegend(models){
	var table = document.createElement('table')
	table.className = 'u-full-width'
	var tbody = document.createElement('tbody')
	table.appendChild(tbody)
	for(var i=0; i<models.length; i++){
		var tr = document.createElement('tr')
		tr.className = 'car-model'
		tr.setAttribute('value', i)
		tr.addEventListener('click',clickLegendModel)
		tr.innerHTML = '<td><div class="legend-color" style="background-color:'+models[i].color+';"></div>'+models[i].label+'</td><td>'+Math.floor(models[i].avgPrice)+'</td><td>'+models[i].nb+'</td>'
		tbody.appendChild(tr)
	}
	return table
}

function clickLegendModel (event, target) {
	console.log('clickLegendModel', event, target, this.getAttribute('value'))
	selectCarModel(this.getAttribute('value'))
	updateGraphColors()
}

function updateGraphColors (){
	var svga = svg.transition()
	svga.selectAll('circle')
	.duration(750)
	.attr('fill', function(d) {return renderColorFunc(d) })
}

function renderCarPreview(car){
	var html = ''
	html += '<img class="car-image" align="middle" src="uploads/images/'+car.imgName+'" title="'+car.title+'" style="width:100%"/>'
	html += '<table class="u-full-width">'
	html += '<tbody>'
	html += '<tr><td>Model : </td><td>'+car.model+' - '+car.spec+'</td></tr>'
	html += '<tr><td>Year : </td><td>'+car.year+'</td></tr>'
	html += '<tr><td>Mileage : </td><td>'+car.mileage+'km</td></tr>'
	html += '<tr><td>Price : </td><td>'+car.price+'€</td></tr>'
	html += '</tbody></table>'
	return html
}

function colorFromModel(car){
	var model = models.find((model) => {
		return model.label === car.spec.trim()
	})
	if(model.active !== false){
		return model.color
	}
	return '#DDD'
}

var daysColorScale = d3.scaleLinear()
.domain([0,120])
.range(['pink','blue'])

function colorFromMarketTime(car){
	var date1 = new Date(car.lastDateSeen)
	var date2 = new Date(car.dateAdded)
	var days = Math.floor((date1 - date2) / (1000*60*60*24))
	var model = models.find((model) => {
		return model.label === car.spec.trim()
	})
	if(model.active !== false){
		return daysColorScale(days)
	}
	return '#DDD'
}