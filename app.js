var env = require('./config/env.js')

App({
  globalData: {
    env: env.current,
    baseUrl: env.baseUrl
  },

  onLaunch: function () {
    var missing = env.validate()
    if (missing.length) {
      console.warn('[emrs-mini] 环境配置不可用:', missing.join('; '))
    } else {
      console.log('[emrs-mini] 环境=' + env.current + ',baseUrl=' + env.baseUrl)
    }
  }
})
