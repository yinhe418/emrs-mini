# emrs-mini · 智病历患者端小程序

微信小程序(原生,无构建步骤)。**不是**后台 PC 端 —— 后台前端在 `../frontend/`。

---

## 一分钟跑起来

```bash
# 1) 后端:起小程序 API(profile: mp,监听 8081)+ 网关
cd ../backend && make compose-mp

# 2) 冒烟(应回 200 且 code=0)
curl -s http://dev.emrs.local/api/mini/ping
```

**3) 用微信开发者工具「导入项目」,目录选 `emrs/mini/`**

- AppID 选「测试号」即可(`project.config.json` 里写的是 `touristappid`)
- 打开后:**详情 → 本地设置 → 勾选「不校验合法域名、web-view(业务域名)、TLS 版本以及 HTTPS 证书」**
- 首页点「开始自检」,两项都绿 = 链路通

> 没有开发者工具也能验后端:`curl http://dev.emrs.local/api/mini/ping`

---

## 路由口径(2026-10-29 用户拍板)

| 客户端 | 请求路径 | nginx 剥前缀后转发给 |
|---|---|---|
| 后台 PC 端 | `/api/adm/v1/...` | admin-api:8080 → `/api/v1/...` |
| **小程序** | **`/api/mini/v1/...`** | **patient-api:8081 → `/api/v1/...`** |

前缀**只在 nginx 剥掉**,后端 Go 两边都还认 `/api/v1/...`。

小程序里要写的地址只有一段:`config/env.js` 的 `baseUrl`
```
http://dev.emrs.local/api/mini
```
换环境**只改 `config/env.js` 里 `current` 这一行**,别在页面里写死地址。

---

## 目录结构

```
mini/
├── app.js / app.json / app.wxss   小程序入口
├── project.config.json            开发者工具项目配置(urlCheck 已关)
├── sitemap.json
├── config/env.js                  ★ 环境配置(baseUrl 唯一出处)
├── utils/request.js               ★ wx.request 封装(统一包络 + 错误兜底)
└── pages/
    └── index/                     连通性自检页
```

---

## 本期边界(2026-10-29)

后端 `patient-api` **只做到「能起来、能连上」**,不实现业务:

| 端点 | 返回 |
|---|---|
| `GET /api/mini/healthz` | 200,裸 JSON 探针 |
| `GET /api/mini/ping` | 200,统一包络 `code=0` |
| 其余 `/api/mini/*` | 404,包络 `40401`「小程序端接口未实现」 |

⚠️ **没有编造 5010x 之类的错误码** —— §13.3 错误码表里没有的码不许自己加,
「接口还没实现」在语义上就是「资源不存在」,用既有的 `40401`。

→ 等 PM/AR 定下小程序的接口契约后,再在 `cmd/patientapi/` 里接业务。

---

## 提交前

`.gitignore` 已排除开发者工具产生的 `project.private.config.json`(含 appid)、
`miniprogram_npm/`(构建产物)、`node_modules/`、`.DS_Store`。

首次提交建议:
```bash
cd mini
git add -A
git commit -m "feat: 小程序骨架 + 连通性自检页"
```
