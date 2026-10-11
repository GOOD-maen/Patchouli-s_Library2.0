# Patchouli's Library

个人网站项目，包含前端（React + Vite）和后端（Spring Boot + MySQL）。

## 功能

- 用户注册 / 登录
- 文章编辑 / 发布 / 浏览
- 点赞
- 评论与回复
- Live2D 角色展示
- AI 对话（DeepSeek API + TTS）

## 技术栈

### 前端

- React 19 + TypeScript
- Vite
- Zustand（状态管理）
- React Router
- Framer Motion（动画）
- Tailwind CSS

### 后端

- Spring Boot 3.1
- Spring Security + JWT
- Spring Data JPA
- MySQL
- Maven

## 项目结构

```
personal-website/
├── frontend/                    # 前端项目
│   └── src/
│       ├── assets/              # 静态资源（字体、图片、视频）
│       ├── hooks/               # 自定义 Hook
│       ├── pages/               # 页面
│       │   ├── auth/            # 登录/注册/找回密码
│       │   ├── components/      # 全局公共组件
│       │   ├── managePages/     # 创作页
│       │   ├── essayPages/      # 文章详情页
│       │   ├── homePages/       # 首页
│       │   ├── modelPages/      # AI 对话页（含 Live2D）
│       │   └── userPages/       # 用户中心
│       ├── services/            # API 封装
│       ├── stores/              # 状态管理
│       └── utils/               # 工具函数
│
├── backend/                     # 后端项目
│   └── src/main/java/com/mmc/collection/
│       ├── common/              # 公共模块（缓存、邮件、天气、工具）
│       ├── config/              # 配置类
│       ├── modules/             # 业务模块
│       │   ├── admin/           # 后台管理
│       │   ├── comment/         # 评论
│       │   ├── essay/           # 文章
│       │   ├── general/         # 通用上传
│       │   ├── resource/        # 资源
│       │   ├── tts/             # 文字转语音
│       │   └── user/            # 用户
│       ├── security/            # 安全（JWT 过滤器）
│       └── util/                # 工具类
│
├── CHANGELOG.md                 # 更新日志
└── README.md
```

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/你的用户名/personal-website.git
cd personal-website
```

### 2. 后端配置

```bash
cd backend/src/main/resources
cp application.yml.example application.yml
```

然后编辑 `application.yml`，填入你自己的：
- 数据库账号密码
- 邮箱授权码
- JWT 密钥
- 天气 API Key

### 3. 启动后端

```bash
cd backend
mvn spring-boot:run
```

后端运行在 `http://localhost:8080`

### 4. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端运行在 `http://localhost:5173`

## 环境要求

- Node.js 18+
- JDK 17+
- MySQL 8.0+
- Maven 3.8+

## 更新日志

见 [CHANGELOG.md](./CHANGELOG.md)

## 许可证

个人项目，仅供学习参考。