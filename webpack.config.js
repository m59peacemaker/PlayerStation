const webpack = require('@nativescript/webpack')
const { resolve } = require('node:path')

module.exports = env => {
	env.appComponents = [
		'@nativescript/core/ui/frame',
		'@nativescript/core/ui/frame/activity',
		resolve(__dirname, 'app/activity.android')
	]

	webpack.init(env)

	// Learn how to customize:
	// https://docs.nativescript.org/webpack

	const config = webpack.resolveConfig()

	config.entry = {
		...config.entry,
		application: resolve(__dirname, 'app/application.android')
	}

	return config
}
