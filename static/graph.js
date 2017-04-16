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

	var xScale = d3.scaleLinear()
		.domain([0, 60000])
		.range([0, 400])

	var yScale = d3.scaleLinear()
		.domain([0, 20000])
		.range([400, 0])


	svg.selectAll('circle')
	.data(data)
	.enter().append('circle')
	.attr('cy',function(d,i){ return yScale(d.price) })
	.attr('cx',function(d,i){ return xScale(d.mileage) })
	.attr('fill', function(d, i) {return '#000'})
	.attr('r', function(d) { return '3' })
	.on('mouseover', function(d) {
		d3.select('#preview')
		.html(renderCarPreview(d))
		.transition()
		.style('opacity', 1)
	})
}

function renderCarPreview(car){
	var html = '<span>Model : </span>'
	html += '<img src="uploads/images/'+car.imgName+'" title="'+car.title+'" style="width:250px; max-height:250px"/>'
	return html
}