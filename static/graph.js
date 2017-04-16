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
	var marginLeft = 15
	var marginRight = 5
	var marginTop = 5
	var marginBottom = 5


	var maxMileage = d3.max(data, function(d) { return d.mileage })
	var maxPrice = d3.max(data, function(d) { return d.price })
	var xScale = d3.scaleLinear()
		.domain([0, maxMileage])
		.range([0 + marginLeft, width - marginRight])

	var yScale = d3.scaleLinear()
		.domain([0, maxPrice])
		.range([height - marginBottom, 0 + marginTop])


	svg.selectAll('circle')
	.data(data)
	.enter().append('circle')
	.attr('cy',function(d,i){ return yScale(d.price) })
	.attr('cx',function(d,i){ return xScale(d.mileage) })
	.attr('fill', function(d, i) {return colorFromSellTime(d) })
	.attr('r', 4 )
	.attr('opacity', 0.7 )
	.on('mouseover', function(d) {
		d3.select('#preview')
		.html(renderCarPreview(d))
		.transition()
		.style('opacity', 1)
	})
}

function renderGraph(){

}

function renderCarPreview(car){
	var html = ''
	html += '<img src="uploads/images/'+car.imgName+'" title="'+car.title+'" style="width:100%"/>'
	html += '<table class="u-full-width">'
    html += '<tbody>'
	html += '<tr><td>Model : </td><td>'+car.model+'</td></tr>'
	html += '<tr><td>Year : </td><td>'+car.year+'</td></tr>'
	html += '<tr><td>Mileage : </td><td>'+car.mileage+'km</td></tr>'
	html += '<tr><td>Price : </td><td>'+car.price+'€</td></tr>'
	html += '</tbody></table>'
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

var daysColorScale = d3.scaleLinear()
.domain([0,120])
.range(['pink','blue'])

function colorFromSellTime(car){
	var date1 = new Date(car.lastDateSeen)
	var date2 = new Date(car.dateAdded)
	var days = Math.floor((date1 - date2) / (1000*60*60*24))
	return daysColorScale(days)
}