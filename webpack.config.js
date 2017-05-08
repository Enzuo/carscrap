const path = require('path')

const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackPluginConfig = new HtmlWebpackPlugin({
	template: './client/react.html',
	filename: 'index.html',
	inject: 'body'
})

module.exports = {
	entry: './client/src/index.js',
	devtool: 'source-map',
	output: {
		path: path.resolve('client/dist'),
		filename: 'index_bundle.js'
	},
	module: {
		loaders: [
		{ test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
		{ test: /\.jsx$/, loader: 'babel-loader', exclude: /node_modules/ }
		]
	},
	plugins: [HtmlWebpackPluginConfig]
}