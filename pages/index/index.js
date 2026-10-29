var env = require('../../config/env.js')
var http = require('../../utils/request.js')

Page({
  data: {
    envName: '',
    baseUrl: '',
    running: false,
    allOk: false,
    hasRun: false,
    checks: [
      { key: 'ping', label: 'GET /ping', desc: '统一包络(code=0)', state: 'idle', detail: '' },
      { key: 'healthz', label: 'GET /healthz', desc: '存活探针(裸 JSON)', state: 'idle', detail: '' }
    ]
  },

  onLoad: function () {
    this.setData({
      envName: env.current,
      baseUrl: env.baseUrl
    })
  },

  onRun: function () {
    if (this.data.running) return

    this.setData({
      running: true,
      hasRun: true,
      allOk: false,
      checks: this.data.checks.map(function (c) {
        return Object.assign({}, c, { state: 'loading', detail: '' })
      })
    })

    var that = this

    this.checkPing()
      .then(function () { return that.checkHealthz() })
      .then(function () {
        that.setData({ running: false })
        that.refreshAllOk()
      })
      .catch(function () {
        // 单项失败已经在各自 setData 里标出来了,这里只收尾
        that.setData({ running: false })
        that.refreshAllOk()
      })
  },

  // ── 自检项 1:/ping —— 走统一包络,验证「前缀 → nginx → 后端」整条链 ──
  checkPing: function () {
    var that = this
    return http.get('/ping').then(
      function (data) {
        that.setCheck('ping', 'ok', data.service + ' · env=' + data.env + ' · v' + data.version)
      },
      function (err) {
        that.setCheck('ping', 'fail', err.code + ' ' + err.message + (err.hint ? '|' + err.hint : ''))
        throw err
      }
    )
  },

  // ── 自检项 2:/healthz —— 探针不走统一包络,这里直接发原生请求 ──
  checkHealthz: function () {
    var that = this
    return new Promise(function (resolve) {
      wx.request({
        url: env.baseUrl + '/healthz',
        method: 'GET',
        timeout: 10000,
        success: function (res) {
          var body = res.data
          if (res.statusCode === 200 && body && body.status === 'ok') {
            that.setCheck('healthz', 'ok', 'HTTP 200 · ' + body.service + ' · v' + body.version)
          } else {
            that.setCheck('healthz', 'fail', 'HTTP ' + res.statusCode + ' · ' + JSON.stringify(body))
          }
          resolve()
        },
        fail: function (err) {
          that.setCheck('healthz', 'fail', (err && err.errMsg) || '网络请求失败')
          resolve()
        }
      })
    })
  },

  setCheck: function (key, state, detail) {
    var idx = this.data.checks.findIndex(function (c) { return c.key === key })
    if (idx < 0) return
    var patch = {}
    patch['checks[' + idx + '].state'] = state
    patch['checks[' + idx + '].detail'] = detail || ''
    this.setData(patch)
  },

  refreshAllOk: function () {
    var ok = this.data.checks.every(function (c) { return c.state === 'ok' })
    this.setData({ allOk: ok })
  },

  onCopyBase: function () {
    wx.setClipboardData({ data: this.data.baseUrl })
  }
})
