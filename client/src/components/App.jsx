import React from 'react'
import Chart from './chart.jsx'

export default class App extends React.Component {
	render() {
		return (
			<div style={{textAlign: 'center'}}>
				<h1>Hello World</h1>
				<Chart/>
			</div>
		)
	}
}