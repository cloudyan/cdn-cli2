# cdn-cli 工具

## 使用

```bash
npx pnpm add --global
cdn deploy [source] [target]

# 示例
npx cdn-cli deploy ./examples/dist ./cdn/dist
```

## 功能列表

配置从环境变量里取

- `update` 升级 cli 版本
- `deploy [--site] [source] [target]` 将选中目录中的文件按当前项目结构上传到目标文件夹
  - 限制上传文件到根目录（但不限制上传目录到根目录）
  - `--site` 为部署站点模式
  - `--preview` 仅做上传预览
  - `--force` 强制覆盖上传(功能关闭)
  - [ ] `--headers` 设置响应头(需要规则校验, 错误的格式不应该被提交)
    - `cache-control: max-age=<seconds>` max-age=31536000
    - `cache-control: no-cache`
- 配置应用用 STS, 未支持时, 先使用 ~/.cdn.config.js 或环境变量支持
  - `init` 初始化配置文件 (本地使用)
- 误传检测
  - 不能再 package.json 文件夹下直接默认操作
- [ ] `refresh <target_path>` 刷新 cdn
  - 可刷新 dir 或 file 路径, 支持多个
- 安全管控
  - 从安全方面考虑, 不应该使用 Ak/Sk 配置, 而应该使用 STS(Security Token Service，临时授权访问) 来操作
  - https://help.aliyun.com/document_detail/28801.html
  - 这里可以尝试通过 serverless 来提供 STS 服务
  - `--token <token_url>` 通过 token 上传 oss
- 接入发布系统
  - 可使用环境变量配置 Ak/Sk 等
- 关于浏览
  - 可以使用 [oss-browser](https://github.com/aliyun/oss-browser/blob/develop/README-CN.md)

配置

- 可配置多个上传空间
- 可控制同时上传多个空间

访问域名和空间无强绑定关系

## 常见问题

如果你想禁用 pnpm 管理包, 可以添加以下 script

```json
"scripts": {
  "preinstall": "npx only-allow pnpm",
}
```

如果 node 版本比较低(node@version < 14), 则不能使用 `@deepjs/cdn-cli@2`

此时需要使用 commonjs 版本 `@deepjs/cdn-cli@1`

参考:

- [前端CLI脚手架思路解析](https://juejin.cn/post/6879265583205089287)
- https://www.npmjs.com/package/cdn-cli
  - https://github.com/chooin/cdn-cli
- https://www.npmjs.com/package/webpack-alioss-plugin
- https://github.com/aikefang/qiniu-tool
