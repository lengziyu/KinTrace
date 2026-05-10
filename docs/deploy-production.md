# KinTrace 生产部署说明

## 1. 域名规划

- H5：`https://kintrace.lengziyu.cn`
- 管理后台：`https://kintrace-admin.lengziyu.cn`
- API：建议直接挂在 `https://kintrace.lengziyu.cn/api/v1`
- Swagger：`https://kintrace.lengziyu.cn/api/docs`

这样 H5 和 API 可以共用一个主域名，后台只需要跨域访问 `kintrace.lengziyu.cn` 的 API。

## 2. 服务端环境变量

在 `KinTrace/apps/server/.env` 中至少配置：

```env
DATABASE_URL=postgresql://postgres:your-password@127.0.0.1:5432/kintrace
JWT_SECRET=replace-with-a-strong-secret
PORT=3000
CORS_ORIGINS=https://kintrace.lengziyu.cn,https://kintrace-admin.lengziyu.cn
```

## 3. 前端环境变量

### H5

在 `KinTrace/apps/h5/.env.production` 中：

```env
VITE_API_BASE_URL=https://kintrace.lengziyu.cn/api/v1
```

### 管理后台

在 `KinTrace-admin/.env.production` 中：

```env
VITE_API_BASE_URL=https://kintrace.lengziyu.cn/api/v1
VITE_H5_BASE_URL=https://kintrace.lengziyu.cn
```

## 4. 构建命令

### KinTrace

```bash
cd /data/www/KinTrace
pnpm install
pnpm --filter @kintrace/server prisma:migrate
pnpm --filter @kintrace/server prisma:seed
pnpm --filter @kintrace/h5 build
pnpm --filter @kintrace/server build
```

### KinTrace-admin

```bash
cd /data/www/KinTrace-admin
pnpm install
pnpm build
```

## 5. 启动服务端

建议用 `pm2`：

```bash
cd /data/www/KinTrace/apps/server
pm2 start dist/main.js --name kintrace-server
pm2 save
pm2 startup
```

## 6. Nginx 参考配置

```nginx
server {
    listen 80;
    server_name kintrace.lengziyu.cn;

    root /data/www/KinTrace/apps/h5/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name kintrace-admin.lengziyu.cn;

    root /data/www/KinTrace-admin/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

如果已经有 HTTPS，给这两个 `server_name` 挂证书即可，静态目录和反向代理逻辑不需要改。

## 7. 上线检查清单

- 访问 `https://kintrace.lengziyu.cn`
- 访问 `https://kintrace-admin.lengziyu.cn`
- 访问 `https://kintrace.lengziyu.cn/api/docs`
- 后台登录后创建家族，复制 H5 登录链接和邀请链接
- H5 打开 `/login?familyCode=xxx` 和 `/join?inviteCode=xxx` 验证入口识别
- 上传图片验证 `uploads/images` 是否可用

## 8. 如果你想再稳一点

- 给 PostgreSQL 开自动备份
- 给 `pm2` 配日志轮转
- Nginx 开 gzip 和静态缓存
- 服务端前面加 HTTPS 证书自动续期
