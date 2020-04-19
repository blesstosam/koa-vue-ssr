// server.js
const { createBundleRenderer } = require('vue-server-renderer')
const setupDevServer = require('./build/setup-dev-server')
const path = require('path')
const fs = require('fs')
const LRU = require('lru-cache')

const Koa = require('koa')
const Router = require('koa-router')
const send = require('koa-send')

const express = require('express')
const server = express()

// connect 作为开发环境的服务器
// const connect = require('connect');
// const http = require('http');
// const app = connect();

const isProd = process.env.NODE_ENV === 'production'

// const server = new Koa();
// const router = new Router()
// server.use(router.routes()).use(router.allowedMethods());


const microCache = new LRU({
	max: 100,
	maxAge: 1000 * 60 // 重要提示：条目在 60 秒后过期。
})

const isCacheable = req => {
	// dev 模式下不要缓存
	if (!isProd) return false;
	// 实现逻辑为，检查请求是否是用户特定(user-specific)。
	// 只有非用户特定 (non-user-specific) 页面才会缓存
	if (req.url.includes('/home')) {
		// 首页加缓存
		return true;
	}
	return false;
}

// 创建渲染器
function createRenderer(bundle, options) {
	// https://github.com/vuejs/vue/blob/dev/packages/vue-server-renderer/README.md#why-use-bundlerenderer
	return createBundleRenderer(bundle, Object.assign(options, {
		// this is only needed when vue-server-renderer is npm-linked
		// basedir: resolve('./dist'),
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

async function render(ctx, isKoa) {
	const { req, res } = ctx;
	const cacheable = isCacheable(req)
	if (cacheable) {
		const hit = microCache.get(req.url)
		if (hit) {
			console.log(`${req.url} - 命中缓存...`)
			return res.send(hit);
		}
	}

	try {
		const context = { url: req.url, title: 'blesstosam', ...ctx }
		ctx.set('Content-Type', 'text/html')
		const html = await renderer.renderToString(context);
		// console.log(html, 'html')
		ctx.status = 200;
		ctx.body = html

		// 设置页面缓存
		if (cacheable) {
			console.log('设置缓存: ', req.url)
			microCache.set(req.url, html)
		}
	} catch (err) {
		console.log(err, 'err')
		if (err.code === 404) {
			ctx.status = 404;
			return ctx.body = '<h1>Page Not Found!</h1>'
		}
		ctx.status = 500;
		ctx.body = 'internal server error'
	}
}

// router.get('*', render)


//************************* express 写法 *********************************
server.get('*', async (req, res) => {
	const cacheable = isCacheable(req)
	if (cacheable) {
		const hit = microCache.get(req.url)
		if (hit) {
			console.log(`${req.url} - 命中缓存...`)
			return res.end(hit)
		}
	}

	try {
		// 该context就是entry-server.js里接收到的context	
		const context = { url: req.url, title: 'blesstosam' }
		res.setHeader('Content-Type', 'text/html')
		const html = await renderer.renderToString(context)
		console.log(html)
		res.end(html);

		// 设置页面缓存
		if (cacheable) {
			console.log('设置缓存: ', req.url)
			microCache.set(req.url, html)
		}

		// 测试 vue-meta
		// const { title } = context.meta.inject()
		// console.log('title in server side', title.text())

	} catch (err) {
		console.log(err, 'error')
		if (err.code === 404) {
			res.statusCode = 404;
			return res.end('<h1>Page Not Found!</h1>')
		}
		res.statusCode = 500;
		res.end('internal server error')
	}
})
//************************** express 写法 ********************************
server.listen(5000, () => { console.log('server listening in port 5000') })


//************************** connect 写法 ********************************
// app.use('/foo', function (req, res, next) {
  // req is the Node.js http request object
  // res is the Node.js http response object
  // next is a function to call to invoke the next middleware
// })
//create node.js http server and listen on port
// http.createServer(app).listen(5000, () => { console.log('server is listening on port 4000') });
//************************** connect 写法 ********************************