# Codeforces Companion Backend

基于 Django 和 Django REST Framework 的后端服务，支持 Codeforces Companion 应用。

## 功能特性

- 用户信息管理（支持 Codeforces、AtCoder、洛谷、牛客等平台）
- 题目数据库和推荐系统
- 题目收藏和状态管理
- 训练计划功能
- 自定义题目管理
- Codeforces API 代理
- CORS 支持（前后端分离）

## 安装

### 前置要求

- Python 3.8+
- pip

### 步骤

1. 进入后端目录：
```bash
cd backend
```

2. 创建并激活虚拟环境（推荐）：
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

3. 安装依赖：
```bash
pip install -r requirements.txt
```

4. 运行数据库迁移：
```bash
python manage.py migrate
```

5. 创建超级用户（可选，用于访问 admin）：
```bash
python manage.py createsuperuser
```

6. 启动开发服务器：
```bash
python manage.py runserver
```

服务器将在 `http://localhost:8000` 上运行。

## API 端点

### 通用

- `GET /api/health/` - 健康检查

### 用户 (`/api/users/`)

- `GET /api/users/` - 获取所有用户
- `POST /api/users/` - 创建用户
- `GET /api/users/{handle}/` - 获取用户详情
- `GET /api/users/by_platform/?platform=codeforces` - 按平台获取用户

### 题目 (`/api/problems/`)

- `GET /api/problems/` - 获取所有题目（支持过滤）
- `POST /api/problems/` - 添加题目
- `GET /api/problems/recommended/?rating=1500` - 获取推荐题目
- 支持按 `platform`、`rating_min`、`rating_max`、`tags` 过滤

### 保存的题目 (`/api/saved-problems/`)

- `GET /api/saved-problems/` - 获取保存的题目
- `POST /api/saved-problems/` - 保存题目
- `PATCH /api/saved-problems/{id}/update_status/` - 更新题目状态

### 训练计划 (`/api/training-plans/`)

- `GET /api/training-plans/` - 获取所有训练计划
- `GET /api/training-plans/active/` - 获取未完成的训练计划
- `POST /api/training-plans/` - 创建训练计划
- `POST /api/training-plans/{id}/add_problem/` - 向训练计划添加题目
- `POST /api/training-plans/{id}/mark_complete/` - 标记训练计划为完成

### 自定义题目 (`/api/custom-problems/`)

- `GET /api/custom-problems/` - 获取自定义题目
- `POST /api/custom-problems/` - 创建自定义题目

### Codeforces API 代理

- `GET /api/codeforces/{endpoint}/` - 代理 Codeforces API

### Admin

- `GET /admin/` - Django Admin 界面

## 开发

### 运行测试

```bash
python manage.py test api
```

### 数据库修改

```bash
# 1. 修改 models.py
# 2. 创建迁移文件
python manage.py makemigrations
# 3. 应用迁移
python manage.py migrate
```

## 环境变量

可以在 `backend/.env` 文件中配置：

```
DEBUG=True
DJANGO_SECRET_KEY=your-secret-key-here
```

## 数据模型

- **UserProfile** - 用户配置
- **Problem** - 题目
- **SavedProblem** - 保存的题目
- **TrainingPlan** - 训练计划
- **TrainingProgress** - 训练进度
- **CustomProblem** - 自定义题目

## 前端集成

前端通过以下方式与后端交互：

1. 更新环境变量或 API 基础 URL
2. 使用 `/api/` 前缀的接口
3. 后端已配置 CORS，允许来自任意源的请求（开发模式）

## 许可证

MIT License
