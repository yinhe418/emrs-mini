/**
 * 环境配置 —— 唯一决定「小程序打哪个后端」的地方。
 *
 * ⚠️ 换环境**只改 current 这一行**,别去页面里写死地址。
 *
 * ⚠️ baseUrl 的口径(2026-10-29 用户拍板):
 *    后台 PC 端走 /api/adm/,小程序走 /api/mini/ —— 前缀只在 nginx 剥掉,
 *    后端 Go 两边都还是 /api/v1/...。所以这里只写 /api/mini 这一段。
 */

var PROFILES = {
  dev: {
    name: 'dev',
    // 本机 Docker 网关(宿主机 /etc/hosts: dev.emrs.local → 127.0.0.1)
    // ⚠️ 开发者工具必须勾「不校验合法域名」,否则 http + 自定义域名会被拦。
    baseUrl: 'http://dev.emrs.local/api/mini'
  },
  staging: {
    name: 'staging',
    // TODO: 待部署 staging 后填真实域名(必须是 https 且已在公众平台备案)
    baseUrl: ''
  },
  prod: {
    name: 'prod',
    // TODO: 待上线后填真实域名(必须是 https 且已在公众平台备案)
    baseUrl: ''
  }
}

// ★ 当前使用的环境
var current = 'dev'

/**
 * 校验当前环境的配置是否可用。
 * @returns {string[]} 缺项说明;空数组表示可用
 */
function validate () {
  var p = PROFILES[current]
  if (!p) return ['未知环境:' + current]
  var missing = []
  if (!p.baseUrl) missing.push('环境 ' + current + ' 的 baseUrl 为空')
  if (p.baseUrl && p.baseUrl.indexOf('http') !== 0) {
    missing.push('baseUrl 必须以 http 开头:' + p.baseUrl)
  }
  return missing
}

module.exports = {
  current: current,
  profile: PROFILES[current],
  baseUrl: PROFILES[current] ? PROFILES[current].baseUrl : '',
  validate: validate
}
