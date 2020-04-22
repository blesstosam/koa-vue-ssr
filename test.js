const connect = require('connect');
const http = require('http');
const webpack = require('webpack')

const app = connect();


const Koa  = require('koa')
const Router = require('koa-router')

const expressMiddleware = require('webpack-dev-middleware');
const expressHotMiddleware = require('webpack-hot-middleware');

const clinetCfg = require('./build/webpack.client.config')
const serverCfg = require('./build/webpack.server.config')


// const koaApp = new Koa()
// const router = new Router()

// const devMiddleware = expressMiddleware(webpack(clinetCfg), {
//   publicPath: clinetCfg.output.publicPath,
//   nnoInfo: true
// })

// app.use(devMiddleware)
// app.use(expressHotMiddleware(webpack(clinetCfg)))

// koaApp.use(async (ctx, next) => {
  // 只有respond=true 才能使用res.end等原生方法
  // ctx.respond=false;
  // await next();
// })

// koaApp.use((ctx) => {
//   ctx.res.statusCode = 200
//   ctx.res.end('l;l')
// })


// koaApp.use(router.routes()).use(router.allowedMethods());
// router.get('*', (ctx) => {
//   ctx.body = '222'
// })

// 解决问题的关键
// 不需要ctx.response=false
// 你也可以使用此回调函数将 koa 应用程序挂载到 Connect/Express 应用程序中
// 是这样使用的
// http.createServer(koaApp.callback()).listen(4000, () => { console.log('listening on 4000') })


function test() {
  return new Promise(r => {
    r(1)
  })
}

async function bb() {
  return await test()
}

function cc() {
  return test().then(res => {
    return res
  })
}

// const a = await bb()
(async () => console.log(cc()))()
