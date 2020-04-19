// const connect = require('connect');
const http = require('http');

// const app = connect();

// gzip/deflate outgoing responses
// const compression = require('compression');
// app.use(compression());

// store session state in browser cookie
// var cookieSession = require('cookie-session');
// app.use(cookieSession({
//     keys: ['secret1', 'secret2']
// }));

// parse urlencoded request bodies into req.body
// var bodyParser = require('body-parser');
// app.use(bodyParser.urlencoded({extended: false}));

// respond to all requests
// req res 为 http 原生的对象
// app.use(function (req, res) {
//   res.end('Hello from Connect!\n');
// });

//create node.js http server and listen on port
// http.createServer(app).listen(4000, () => { console.log('ok') });

const Koa  = require('koa')
const Router = require('koa-router')

const app = new Koa()
const router = new Router()

// app.use(async (ctx, next) => {
  // 只有respond=true 才能使用res.end等原生方法
  // ctx.respond=false;
  // await next();
// })

// app.use((ctx) => {
//   ctx.res.statusCode = 200
//   ctx.res.end('l;l')
// })

app.listen(4000, () => {console.log('okkk')})

app.use(router.routes()).use(router.allowedMethods());


// router.get('*', (ctx) => {
//   console.log(ctx, 'ctx')
//   ctx.res.statusCode = 404
//   ctx.res.end('111')
// })

// const fn = app.callback()
// const server = http.createServer(app.callback());

// 解决问题的关键
// 不需要ctx.response=false
// 你也可以使用此回调函数将 koa 应用程序挂载到 Connect/Express 应用程序中

// server.listen(4000, () => {console.log('okkk')})
