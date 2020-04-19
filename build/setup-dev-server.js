const webpack = require('webpack');
const path = require('path');
const chokidar = require('chokidar')
const fs = require('fs')
const MFS = require('memory-fs')
const clinetCfg = require('./webpack.client.config')
const serverCfg = require('./webpack.server.config')

// // webpack热加载需要
const webpackDevMiddleware = require('./dev-plugin')
// // 配合热加载实现模块热替换
const webpackHotMiddleware = require('./hot-plugin')


const PassThrough = require('stream').PassThrough;

// 简单封装一下readfile
const readFile = (fs, file) => {
	try {
		return fs.readFileSync(path.join(path.resolve(__dirname, '../dist'), file), 'utf-8')
	} catch (e) { }
}


module.exports = function setupDevServer(koaApp, templatePath, cb) {
	let bundle
	let template
	let clientManifest

	const update = () => {
		if (bundle && clientManifest) {
			console.log('++++++++++++before update')
			cb(bundle, {
				template,
				clientManifest
			})
		}
	}

	// 读取模板文件
	template = fs.readFileSync(templatePath, 'utf-8')

	// 模版文件webpack不能watch 所以需要单独watch
	chokidar.watch(templatePath).on('change', () => {
		template = fs.readFileSync(templatePath, 'utf-8')
		console.warn('html template updated.')
		update()
	})

	// https://www.npmjs.com/package/webpack-hot-middleware
	// 将配置改成热更新的配置
	clinetCfg.entry.app = ['webpack-hot-middleware/client?reload=true', clinetCfg.entry.app]
	clinetCfg.output.filename = '[name].js'
	clinetCfg.plugins.push(
		new webpack.HotModuleReplacementPlugin(),
		new webpack.NoEmitOnErrorsPlugin()
	)

	// dev middleware
	const clientCompiler = webpack(clinetCfg);
	// webpack-dev-middleware 最直观简单的理解就是一个运行于内存中的文件系统
	// 用于处理静态文件
	// 使用 webpack-dev-middleware 的时候webpack会自动开启watch
	const devMiddleware = webpackDevMiddleware(clientCompiler, {
		publicPath: clinetCfg.output.publicPath,
		nnoInfo: true
	})
	// 官方给的示例是express的，这里改成koa 因为后台框架选用koa
	// 开发服务器保持和生产一致
	// 参考自 https://www.cnblogs.com/liuyt/p/7217024.html
	// todo：  koa 的不起作用
	const useDevMiddleware = () => {
		console.log('use dev middleware inside......')
		return async (ctx, next) => {
			await devMiddleware(ctx.req, {
				end: (content) => {
					ctx.body = content
				},
				setHeader: (name, value) => {
					ctx.set(name, value)
				}
			}, next)
		}
	}
	koaApp.use(devMiddleware);

	// exporess 写法
	// koaApp.use(devMiddleware)

	// https://cloud.tencent.com/developer/ask/151446
	// complier.plugin('done') 被废弃 第一个字符串随便写
	clientCompiler.hooks.done.tap('aaa', stats => {
		console.log('-------------------complier done')
		stats = stats.toJson()
		stats.errors.forEach(err => console.error(err))
		stats.warnings.forEach(err => console.warn(err))
		if (stats.errors.length) return

		// vue-ssr-client-manifest.json 是由 VueSSRClientPlugin 插件生成的
		// 配置在 webpack.client.config.js 里
		clientManifest = JSON.parse(readFile(
			devMiddleware.fileSystem,
			'vue-ssr-client-manifest.json'
		))
		update()
	})

	// hot middleware
	// webpack-hot-middleware 插件用于热更新
	// 同样改成koa的版本
	const useHmrMiddlewre = () => {
		const hmrPlugin = require('webpack-hot-middleware')(clientCompiler)
		return async (ctx, next) => {
			console.log('--------------in hmrPlugin')
			let stream = new PassThrough()
			ctx.body = stream
			await hmrPlugin(ctx.req, {
				write: stream.write.bind(stream),
				writeHead: (status, headers) => {
					ctx.status = status
					ctx.set(headers)
				}
			}, next)
		}
	}
	koaApp.use(webpackHotMiddleware(clientCompiler))

	// express 写法
	// 浏览器没有自动刷新 看是不是配置项的问题
	// koaApp.use(require('webpack-hot-middleware')(clientCompiler))

	// watch and update server renderer
	const serverCompiler = webpack(serverCfg)
	const mfs = new MFS()
	serverCompiler.outputFileSystem = mfs
	serverCompiler.watch({}, (err, stats) => {
		if (err) throw err
		stats = stats.toJson()
		if (stats.errors.length) return

		// vue-server-renderer/server-plugin 会生成 vue-ssr-server-bundle.json 文件
		bundle = JSON.parse(readFile(mfs, 'vue-ssr-server-bundle.json'))
		// console.log(bundle, 'bundle')
		update()
	})

}


