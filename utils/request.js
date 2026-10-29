/**
 * wx.request 的薄封装 —— 统一处理 §13.2 响应包络。
 *
 * 后端一律回:
 *   { code, message, data, requestId, serverTime, errors? }
 *   code === 0 才算成功。
 *
 * ⚠️ 网关自己造的 502 也是同一个形状(code=50200),所以不需要单独分支 ——
 *    「后端没起来」在页面上和「业务报错」走同一条展示逻辑。
 */

var env = require('../config/env.js')

/**
 * @param {object}  opts
 * @param {string}  opts.url      以 / 开头的路径,如 '/ping'(会被拼到 baseUrl 后面)
 * @param {string} [opts.method]  GET / POST ...
 * @param {object} [opts.data]
 * @param {object} [opts.header]
 * @param {number} [opts.timeout]
 * @returns {Promise<any>}  resolve(data) / reject({code, message, requestId})
 */
function request (opts) {
  var method = opts.method || 'GET'

  return new Promise(function (resolve, reject) {
    wx.request({
      url: env.baseUrl + opts.url,
      method: method,
      data: opts.data,
      timeout: opts.timeout || 10000,
      header: Object.assign(
        { 'content-type': 'application/json' },
        opts.header || {}
      ),

      success: function (res) {
        var body = res.data

        // 不是 JSON(比如网关直接回了一段 HTML 错误页)
        if (!body || typeof body !== 'object') {
          reject({
            code: -1,
            message: '返回的不是 JSON(HTTP ' + res.statusCode + ')',
            raw: body
          })
          return
        }

        if (body.code === 0) {
          resolve(body.data)
          return
        }

        reject({
          code: body.code,
          message: body.message || '请求失败',
          requestId: body.requestId,
          errors: body.errors,
          statusCode: res.statusCode
        })
      },

      fail: function (err) {
        // 真正连不上(network / 域名校验被拦 / 后端进程没起)
        reject({
          code: -2,
          message: (err && err.errMsg) || '网络请求失败',
          hint:
            '检查 ① 开发者工具是否勾了「不校验合法域名」 ' +
            '② 后端是否在跑:make compose-mp'
        })
      }
    })
  })
}

module.exports = {
  request: request,
  get: function (url, data) {
    return request({ url: url, method: 'GET', data: data })
  },
  post: function (url, data) {
    return request({ url: url, method: 'POST', data: data })
  }
}
