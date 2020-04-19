// server.js
const { createBundleRenderer } = require('vue-server-renderer')
const setupDevServer = require('./build/setup-dev-server')
const path = require('path')
const fs = require('fs')

const Koa = require('koa')
const Router = require('koa-router')
const send = require('koa-send')

// const express = require('express')
// const server = express()

const isProd = process.env.NODE_ENV === 'production'

const server = new Koa();
const router = new Router()
server.use(router.routes()).use(router.allowedMethods());


// 创建渲染器
function createRenderer(bundle, options) {
	// https://github.com/vuejs/vue/blob/dev/packages/vue-server-renderer/README.md#why-use-bundlerenderer
	return createBundleRenderer(bundle, Object.assign(options, {
		// for component caching
		// cache: LRU({
		//   max: 1000,
		//   maxAge: 1000 * 60 * 15
		// }),
		// this is only needed when vue-server-renderer is npm-linked
		// basedir: resolve('./dist'),
		// recommended for performance
		runInNewContext: false
	}))
}

let renderer
const templatePath = path.resolve(__dirname, './temp.html')

if (isProd) {
	const template = fs.readFileSync(templatePath, 'utf-8')
	const bundle = require('./dist/vue-ssr-server-bundle.json')
	// The client manifests are optional, but it allows the renderer
	// to automatically infer preload/prefetch links and directly add <script>
	// tags for any async chunks used during render, avoiding waterfall requests.
	const clientManifest = require('./dist/vue-ssr-client-manifest.json')
	renderer = createRenderer(bundle, {
		template,
		clientManifest
	})
	// 处理静态文件
	router.get('/dist/*', async (ctx) => {
		await send(ctx, ctx.path, { root: __dirname + '/' });
	});
} else {
	setupDevServer(server, templatePath, (bundle, opts) => {
		renderer = createRenderer(bundle, opts)
	})
}

async function render(ctx, next) {
	const context = { url: ctx.req.url, title: 'blesstosam' }
	ctx.set('Content-Type', 'text/html')
	try {
		const html = await renderer.renderToString(context);
		// console.log(html, 'html')
		ctx.status = 200;
		ctx.body = html
	} catch (err) {
		console.log(err)
		if (err.code === 404) {
			ctx.status = 404;
			ctx.body = '<h1>Page Not Found!</h1>'
			return;
		}
		ctx.status = 500;
		ctx.body = 'internal server error'
	}
}

router.get('*', render)


//************************* express 写法 *********************************
// server.get('*', async (req, res) => {
// 	const context = { url: req.url, title: 'blesstosam' }

// 	try {			
// 		// 该context就是entry-server.js里接收到的context
// 		const html = await renderer.renderToString(context)
// 		console.log(html)
// 		res.send(html);
// 	} catch(err) {
// 		console.log(err, 'error')
// 		res.send('internal server error')
// 		return;
// 	}
// })
//************************** express 写法 ********************************
server.listen(5000, () => { console.log('server listening in port 5000') })



