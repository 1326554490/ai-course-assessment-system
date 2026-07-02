# 星芽 · AI通识课教学平台

面向中小学 AI 通识课程的完整教学平台，包含课程管理、互动活动、学情分析等核心功能。

> **项目状态**: ✅ 已完成开发和全面修复，所有核心功能正常运行  
> **最后更新**: 2026-07-02

## ✨ 功能特性

### 教师端
- **课程管理**：创建课程、章节、配置课程封面和描述
- **活动配置**：12种题型支持问卷调查、知识测评、AI互动练习
- **学情分析**：班级整体表现、维度掌握热力图、共性错题分析、学生分布
- **数据报告**：按活动类型聚合（问卷/测评/互动），课程级详细报告
- **学生管理**：学生名单、个体学情详情、学习轨迹

### 学生端
- **课程学习**：浏览课程列表、章节导航、进度追踪
- **互动作答**：流畅的答题体验，支持12种题型
- **即时反馈**：测评自动判分、错题解析、维度报告
- **学习记录**：继续上次学习、历史记录查询

## 题型支持（12种）

### 选择判断类
1. **单选题**：4种展示方式（列表式/卡片式/图片宫格/组合式材料题）
2. **多选题**：3种展示方式（列表式/卡片式/图片宫格），支持半对半错模式
3. **判断题**：3种展示方式（滑动判断/按钮式/卡片式）

### 填空作答类
4. **填空题**：4种展示方式（单空/句中填空/多空/材料辅助），支持模糊匹配
5. **简答题**：5种展示方式（短文/长文/材料/结构化/AI引导），字数限制

### 排序分类类
6. **排序题**：拖拽排序，自动判分
7. **分类题**：多分类拖拽归类
8. **词语组合**：左右项配对选择

### 互动实践类
9. **星级量表**：1-N星评分，支持自定义标签
10. **作品上传**：文件上传（模拟），可附文字说明
11. **知识回顾**：翻卡片复习（正反面）
12. **Prompt实践**：AI提示词练习，结构化引导

## 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite
- **路由**：React Router v6
- **样式**：Tailwind CSS（自定义 wireframe 风格）
- **图标**：Lucide React
- **状态管理**：LocalStorage + Context（无需 Redux）
- **数据持久化**：LocalStorage 模拟后端

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

打开 http://localhost:5173，选择"教师端"或"学生端"进入。

### 构建生产版本

```bash
npm run build
```

## 目录结构

```
src/
├── components/
│   ├── ui/                    # 基础UI组件（Card/Button/Input/Tag等）
│   ├── question/              # 12种题型的渲染器和编辑器
│   ├── CourseCover.tsx        # 课程封面组件
│   └── Icon.tsx               # 图标封装
├── layouts/
│   ├── TeacherLayout.tsx      # 教师端布局（侧边栏+顶栏）
│   └── StudentLayout.tsx      # 学生端布局（顶栏+内容区）
├── pages/
│   ├── teacher/
│   │   ├── Courses.tsx        # 课程列表
│   │   ├── CourseEditor.tsx   # 课程编辑
│   │   ├── ActivityConfig.tsx # 活动配置（12种题型）
│   │   ├── Analytics.tsx      # 班级学习分析
│   │   ├── Reports.tsx        # 活动数据报告
│   │   ├── Students.tsx       # 学生管理
│   │   ├── StudentDetail.tsx  # 学生详情
│   │   └── CourseReport.tsx   # 课程报告
│   ├── student/
│   │   ├── Home.tsx           # 学生首页
│   │   ├── Courses.tsx        # 课程列表
│   │   └── Lesson.tsx         # 课程学习页
│   └── Landing.tsx            # 入口选择页
├── store/
│   └── index.ts               # 数据存储层（课程/活动/学生/提交/班级）
├── types/
│   └── index.ts               # TypeScript 类型定义
├── utils/
│   ├── answer.ts              # 判分逻辑
│   ├── format.ts              # 格式化工具
│   └── storage.ts             # LocalStorage 封装
├── mock/                      # Mock数据
├── router/                    # 路由配置
└── styles/                    # 全局样式

```

## 核心路由

### 教师端

```
/teacher                              工作台
/teacher/courses                      课程列表
/teacher/course/new                   新建课程
/teacher/course/:courseId/edit        编辑课程
/teacher/course/:courseId/activity    配置活动
/teacher/analytics                    班级学习分析
/teacher/reports                      活动数据报告
/teacher/course/:courseId/report      课程报告
/teacher/students                     学生管理
/teacher/student/:studentId           学生详情
```

### 学生端

```
/student                              我的课程
/student/courses                      课程列表
/student/course/:courseId/lesson/:lessonId  课程学习
```

## 设计规范

### 配色方案
- **主色**：`#2563EB` (blue-600)，用于按钮、链接、选中状态
- **灰阶**：自定义 `ink` 系列（ink-50 ~ ink-900）
- **辅助色**：green（正确）、red（错误）、amber（警告）

### 视觉风格
- 低保真 wireframe 风格，黑白灰为主
- 卡片：白底、浅灰边框、轻投影、8px圆角
- 字体：PingFang SC / 系统无衬线字体
- 极简图标（Lucide）

### 响应式
- 桌面优先（最小宽度 1024px）
- 关键页面支持 iPad 横屏

## 数据模型

### 课程 (Course)
```typescript
{
  id: string
  title: string
  cover?: string
  description?: string
  lessons: Lesson[]        // 章节列表
  createdAt: string
}
```

### 活动 (Activity)
```typescript
{
  id: string
  type: 'survey' | 'assessment' | 'aiPractice'
  title: string
  questions: Question[]    // 12种题型联合类型
  dimensions?: string[]    // 知识维度
  createdAt: string
}
```

### 学生提交 (StudentSubmission)
```typescript
{
  id: string
  studentId: string
  nodeId: string           // 关联到课程节点
  activityId: string
  answers: AnswerValue[]
  score?: number
  submittedAt: string
}
```

## 判分逻辑

- **单选/判断**：全对得分，错误0分
- **多选**：
  - 全对全错模式：完全正确得分，否则0分
  - 半对半错模式：答对的按比例给分，答错项扣光所有分
- **填空**：每空独立判分，支持多个正确答案和模糊匹配（错别字容错）
- **排序/分类/配对**：完全正确得分
- **简答/作品上传**：教师或AI评分

## Mock 数据说明

项目内置 Mock 数据，自动写入 LocalStorage：
- 3门示例课程（AI基础、机器学习入门、AI伦理）
- 10+个互动活动（涵盖12种题型）
- 30名虚拟学生，分布在3个班级
- 100+条提交记录

首次运行时自动初始化，可在浏览器开发者工具中清空 LocalStorage 重置数据。

## 开发注意事项

### 题型扩展
所有题型渲染器在 `src/components/question/`，新增题型需要：
1. 在 `types/index.ts` 定义 Question 类型
2. 在 `question/` 下创建 Renderer 和 Editor
3. 在 `utils/answer.ts` 添加判分逻辑
4. 在 `ActivityConfig.tsx` 和 `CourseEditor.tsx` 注册题型

### 样式定制
全局样式在 `src/styles/`，主要变量：
- `--color-brand`: 主色
- `--color-ink-xxx`: 灰阶
- `.lf-card`、`.lf-table`、`.lf-tag` 等基础类

## 许可证

MIT License

## 作者

AI 通识课教学平台开发团队
