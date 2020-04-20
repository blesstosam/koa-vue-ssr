const path = require('path')
const webpack = require('webpack')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const { VueLoaderPlugin } = require('vue-loader')
// css样式提取单独文件
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const isProd = process.env.NODE_ENV === 'production'
const isClient = process.env.VUE_ENV === 'client'  // 判断是打client包还是server的包

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  devtool: isProd
    ? false
    : '#cheap-module-source-map',
  output: {
    path: path.resolve(__dirname, '../dist'),
    publicPath: '/dist/',
    filename: '[name].[chunkhash].js'
  },
  module: {
    noParse: /es6-promise\.js$/, // avoid webpack shimming process
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          compilerOptions: {
            preserveWhitespace: false
          }
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: '[name].[ext]?[hash]'
        }
      },
      {
        test: /\.css?$/,
        // 在生产环境 利用mini-css-extract-plugin提取css, 开发环境用内联方式
        // use: [MiniCssExtractPlugin.loader, 'css-loader', 'stylus-loader']
        // 开发环境不需要提取css单独文件
        // 重要：因为 mini-css-extract-plugin 插件会使用document对象 所以server端的包不能使用该插件 所以用 isClient 来判断
        use: isProd && isClient
          ? [MiniCssExtractPlugin.loader, 'css-loader']
          : ['vue-style-loader', 'css-loader']
      },
      {
        test: /\.styl(us)?$/,
        use: isProd && isClient
          ? [MiniCssExtractPlugin.loader, 'css-loader', 'stylus-loader']
          : ['vue-style-loader', 'css-loader', 'stylus-loader']
      },
    ]
  },
  performance: {
    hints: false
  },
  plugins: isProd
    ? [
      new VueLoaderPlugin(),
      new webpack.optimize.ModuleConcatenationPlugin(),
      // webpack4.0版本以上采用MiniCssExtractPlugin 而不使用extract-text-webpack-plugin
      new MiniCssExtractPlugin({
        filename: 'static/css/[name].[contenthash].css',
        chunkFilename: 'static/css/[name].[contenthash].css'
      }),
    ]
    : [
      new VueLoaderPlugin(),
      new FriendlyErrorsPlugin()
    ]
}
