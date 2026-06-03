# 训练计划管理后台使用指南

## 登录后台

访问地址：`http://localhost:8000/admin/`

使用超级管理员账号登录（用户名：`admin`，密码：`admin123`）

## 管理训练计划

### 创建官方训练计划

1. 在后台首页点击「Training plans」
2. 点击「Add training plan」
3. 填写训练计划信息：
   - **ID**: 唯一标识符，如：`csp-j`
   - **Title**: 训练计划标题
   - **Target rating**: 目标难度分
   - **Tags**: 算法标签，多个标签用逗号分隔
   - **Description**: 描述
   - **User**: 留空（表示这是官方训练计划）
4. 点击「Save」保存

### 管理训练计划题目

有两种方式添加题目：

#### 方式一：在训练计划页面直接添加（推荐）

1. 进入任意训练计划的编辑页面
2. 在页面下方的「Training progresss」区域，点击「Add another Training progress」
3. 搜索并选择题目
4. 勾选「Completed」表示已完成
5. 点击「Save」保存

#### 方式二：从题目列表批量添加

1. 进入「Problems」列表
2. 勾选需要添加的题目
3. 在「Action」下拉框中选择操作（可以通过内联添加）
4. 在训练计划编辑页面内联添加

## 管理题目

### 查看和搜索题目

1. 进入「Problems」页面
2. 可以通过以下方式筛选：
   - 平台（Codeforces/AtCoder等）
   - 难度分
   - 搜索题目名称、编号、标签

### 题目信息显示

- 题目编号（Contest ID + Index）
- 题目名称
- 难度分
- 标签列表

## 按标签分类查看训练计划题目

1. 进入「Training progresses」页面
2. 可以通过「Training plan」筛选
3. 可以通过「Completed」筛选
4. 点击题目可以查看详情

## API端点

### 获取训练计划题目（按标签分类）

```
GET /api/training-plans/{plan_id}/problems_by_tag/
```

**响应格式：**
```json
{
  "plan_id": "csp-j",
  "plan_title": "CSP-J 入门级训练题单",
  "target_rating": 1400,
  "total_problems": 30,
  "completed_count": 5,
  "tags_order": ["全部", "greedy", "math", "dp"],
  "problems_by_tag": {
    "全部": [...],
    "greedy": [...],
    "math": [...]
  }
}
```

### 向训练计划添加题目

```
POST /api/training-plans/{plan_id}/add_problem/
Content-Type: application/json

{
  "problem_id": 123
}
```

### 从训练计划移除题目

```
POST /api/training-plans/{plan_id}/remove_problem/
Content-Type: application/json

{
  "problem_id": 123
}
```

## 官方训练计划列表

已预置的官方训练计划：

- `csp-j` - CSP-J 入门级训练题单（目标：1400分）
- `csp-s` - CSP-S 提高级训练题单（目标：1800分）
- `noip` - NOIP 全国联赛训练题单（目标：2100分）
- `domestic-training` - 国内赛事综合训练题单（目标：1600分）
- `stage-1` - Stage 1: 筑基起步 (Beginner)（目标：1000分）
- `stage-2` - Stage 2: 渐入佳境 (Novice)（目标：1200分）
- `stage-3` - Stage 3: 登堂入室 (Specialist)（目标：1400分）
- `stage-4` - Stage 4: 破壁跃迁 (Expert)（目标：1700分）
- `stage-5` - Stage 5: 登峰造极 (Master)（目标：2000分）

## 数据管理命令

### 上传训练计划数据

```bash
cd backend
source venv/bin/activate
python manage.py upload_training_data
```

### 上传题目数据

```bash
cd backend
source venv/bin/activate
python manage.py upload_problems
```
