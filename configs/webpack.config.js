var paths = require('./paths');
var nodeExternals = require('webpack-node-externals');

module.exports = {
	target: 'node',
	externals: [nodeExternals()],
    entry: paths.root + '/src/servers/index.ts',
    output: {
        path: paths.root + '/dist',
        filename: 'server.js'
    },  
    resolve: {
        extensions: [ '.js', '.ts' ]
    },  
    module: {
        rules: [
            {
                test: /.js$/,
                loader: 'babel-loader',
                exclude: paths.root + '/node_modules/',
                query: Object.assign({ cacheDirectory: true }, paths.babel_config)
            },
            {
                test: /.ts$/,
                exclude: paths.root + '/node_modules/',
                use: [
                    {
                        loader: 'babel-loader',
                        query: Object.assign({ cacheDirectory: true }, paths.babel_config)
                    },
                    {
                        loader: 'awesome-typescript-loader',
                        query: {
                            configFileName: paths.root + '/configs/tsconfig.json'
                        }
                    }
                ]
            }
        ]
    }
}