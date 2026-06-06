# 只给我们

情侣双人秘密基地产品原型。

## 打开方式

可以直接在浏览器打开 `index.html`。

如果希望用本地服务访问，双击 `start.bat`，然后打开：

```text
http://127.0.0.1:4173
```

## 已实现的 V1 原型功能

- 首页：在一起天数、生日倒计时、今日动态流
- 记录：Moments、心语心愿、重要时间、随记随想、蛐蛐
- 基地：绑定状态、邀请码、基础设置
- 发布弹窗：支持选择记录类型、文字、图片占位、语音占位
- 浏览记录：等待查看、已看、已听完、已拆开
- 模拟互动：点击“模拟 TA 查看”可更新已读/已听/已拆开状态
- 关键词花园：根据记录内容自动生成词条图谱，可保留或删除词条
- 聊天存档：支持粘贴微信聊天记录文字并纳入关键词图谱

## 产品方向

第一版主线是：两个人通过邀请绑定进入同一个私密空间，把心动、心愿、纪念日、碎片和悄悄话放进去，并知道对方有没有看见。

## 部署到 GitHub Pages

当前版本是纯静态前端，可以直接部署到 GitHub Pages 做线上预览。

1. 在 GitHub 新建一个仓库，例如 `only-us-app`。
2. 在本地项目目录执行：

```bash
git init
git add .
git commit -m "Initial prototype"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/only-us-app.git
git push -u origin main
```

3. 打开 GitHub 仓库的 `Settings`。
4. 进入 `Pages`。
5. `Source` 选择 `Deploy from a branch`。
6. Branch 选择 `main`，Folder 选择 `/root`。
7. 保存后等待部署完成。

部署地址通常是：

```text
https://YOUR_NAME.github.io/only-us-app/
```

## 正式使用还需要补的能力

GitHub Pages 只能托管前端页面，不能保存真实用户数据。要正式使用，至少还需要：

- 用户登录：微信登录或邮箱登录
- 数据库：保存记录、词条、已读状态、绑定关系
- 文件存储：保存图片、语音、聊天截图
- OCR 服务：识别用户主动上传的聊天截图文字
- 隐私权限：只允许绑定的两个人访问同一个基地

推荐路线：

- 小程序正式版：微信小程序 + 微信云开发
- Web 正式版：GitHub Pages / Vercel 前端 + Supabase / Firebase 后端
