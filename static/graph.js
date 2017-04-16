var svg = d3.select('#graph').append('svg')
svg.attr('height','100%')
.attr('width','100%')

fetch('/cars')
.then(function(response){
	if(response.ok){
		var contentType = response.headers.get("content-type");
		if(contentType && contentType.indexOf("application/json") !== -1) {
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


function buildGraph(data) {

	// var bbox = svg.node().getBBox()
	var bbox = svg.node().getBoundingClientRect()
	var width = bbox.width
	var height = bbox.height


	var maxMileage = d3.max(data, function(d) { return d.mileage })
	var maxPrice = d3.max(data, function(d) { return d.price })
	var xScale = d3.scaleLinear()
		.domain([0, maxMileage])
		.range([0, width])

	var yScale = d3.scaleLinear()
		.domain([0, maxPrice])
		.range([height, 0])


	svg.selectAll('circle')
	.data(data)
	.enter().append('circle')
	.attr('cy',function(d,i){ return yScale(d.price) })
	.attr('cx',function(d,i){ return xScale(d.mileage) })
	.attr('fill', function(d, i) {return colorFromModel(d) })
	.attr('r', function(d) { return '3' })
	.on('mouseover', function(d) {
		d3.select('#preview')
		.html(renderCarPreview(d))
		.transition()
		.style('opacity', 1)
	})
}

function renderCarPreview(car){
	var html = ''
	html += '<img src="uploads/images/'+car.imgName+'" title="'+car.title+'" style="width:250px; max-height:250px"/>'
	html += '<div class="row"><div class="one-third column">Model : </div><div class="two-thirds column">'+car.model+'</div></div>'
	html += '<div class="row"><div class="one-third column">Year : </div><div class="two-thirds column">'+car.year+'</div></div>'
	html += '<div class="row"><div class="one-third column">Mileage : </div><div class="two-thirds column">'+car.mileage+'km</div></div>'
	html += '<div class="row"><div class="one-third column">Price : </div><div class="two-thirds column">'+car.price+'€</div></div>'
	return html
}

function colorFromModel(car){
	switch (car.model.trim()) {
	case '': 
		return '#AAA'
	case '1.2 84 intuitive' : 
		return '#F00'
	default:
		return '#000'
	}
}