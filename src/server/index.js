// src/server/index.js
const { createBundleRenderer } = require('vue-server-renderer')
const setupDevServer = require('../../build/setup-dev-server')
const path = require('path')
const fs = require('fs')
const LRU = require('lru-cache')

const Koa = require('koa')
const Router = require('koa-router')
const send = require('koa-send')

const connect = require('connect');
const http = require('http');

const isProd = process.env.NODE_ENV === 'production'

// connect 作为开发环境的服务器
const connectApp = connect();

// koa 作为生产环境的服务器
const koaApp = new Koa();
const router = new Router()
koaApp.use(router.routes()).use(router.allowedMethods());

// page component cache
const microCache = new LRU({
  max: 100,
  maxAge: 1000 * 60 // 重要提示：条目在 60 秒后过期。
})
const isCacheable = req => {
  // dev 模式下不要缓存
  if (!isProd) return false;
  // 自定义缓存规则
  if (req.url.includes('/home')) {
    // 首页加缓存
    return true;
  }
  return false;
}

function createRenderer(bundle, options) {
  // https://github.com/vuejs/vue/blob/dev/packages/vue-server-renderer/README.md#why-use-bundlerenderer
  return createBundleRenderer(bundle, Object.assign(options, {
    // this is only needed when vue-server-renderer is npm-linked
    // basedir: resolve('./dist'),
    runInNewContext: false
  }))
}

let renderer
const templatePath = path.resolve(__dirname, '../../temp.html')

if (isProd) {
  const template = fs.readFileSync(templatePath, 'utf-8')
  const bundle = require('../../dist/vue-ssr-server-bundle.json')
  // The client manifests are optional, but it allows the renderer
  // to automatically infer preload/prefetch links and directly add <script>
  // tags for any async chunks used during render, avoiding waterfall requests.
  const clientManifest = require('../../dist/vue-ssr-client-manifest.json')
  renderer = createRenderer(bundle, {
    template,
    clientManifest
  })
  // handle static files
  router.get('/dist/*', async (ctx) => {
    await send(ctx, ctx.path, { root: path.resolve(__dirname + '../../../') });
  });
} else {
  // 将 connect 的 app 传递过去 启动开发服务器
  setupDevServer(connectApp, templatePath, (bundle, opts) => {
    renderer = createRenderer(bundle, opts)
  })
}

async function render(ctx) {
  const { req } = ctx;
  const cacheable = isCacheable(req)
  if (cacheable) {
    const hit = microCache.get(req.url)
    if (hit) {
      console.log(`${req.url} - 命中缓存...`)
      return ctx.body = hit;
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

    // 测试 vue-meta
    // const { title } = context.meta.inject()
    // console.log('title in server side', title.text())
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

router.get('*', render)

module.exports = function (port, host) {
  port = port || 5000
  host = host || 'localhost'
  // 在开发环境使用connect开启服务器 同时将 koa 的 app 挂载到 connect 的 app 上 
  // 这样路由和请求都走 koa 但是又可以用 connect 来使用 webpack-dev-middleware 中间件
  // https://www.stacknoob.com/s/Dt667M98zKbd73rFR2PSAn
  if (isProd) {
    // 在生产环境直接使用 koa 启动服务器
    koaApp.listen(port, host, () => { console.log(`Server is listening on port ${port}`) })
  } else {
    connectApp.use(koaApp.callback())
    http.createServer(connectApp).listen(port, host, () => { console.log(`Dev server is listening on port ${port}`) });
  }
}