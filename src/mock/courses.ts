/**
 * 课程 mock 数据（新数据结构）
 *
 * 2 门课程
 *  - 课程 1：认识AI小伙伴（小学 1-2 年级）3 节
 *  - 课程 2：AI图像识别：机器怎么看图（小学 3-4 年级）4 节
 *
 * 每节课 4-6 个节点；至少包含一个 survey 节点 + 一个 assessment 节点
 *
 * 节点用 activityId 引用 Activity；Activity 与 Course 平铺存储
 */

import type { Activity, Course, Question } from '@/types'

/* ==================================================================
 * 工具：构造维度 / 选项的 id（保持稳定，便于跨提交关联）
 * ================================================================== */

/* ====== 维度（按课程归属） ====== */
const DIM = {
  // 课程 1
  c1_base: 'dim-c1-base',
  c1_app: 'dim-c1-app',
  c1_safety: 'dim-c1-safety',
  // 课程 2
  c2_base: 'dim-c2-base',
  c2_principle: 'dim-c2-principle',
  c2_app: 'dim-c2-app',
  c2_thinking: 'dim-c2-thinking',
} as const

/* ====================================================================
 * Activity 集合（业务上独立于 Lesson；通过 activityId 被节点引用）
 * ==================================================================== */

/* ---------- 课程 1 · 第 1 节的活动 ---------- */
const ACT_C1L1_SURVEY: Activity = {
  id: 'act-c1l1-sv',
  type: 'survey',
  title: '说说你眼里的 AI',
  description: '回答几个小问题，让老师了解你对 AI 的初步印象。',
  feedbackConfig: { showScore: false, showExplanation: false },
  questions: [
    {
      id: 'q-c1l1-sv-1',
      type: 'singleChoice',
      title: '你之前用过智能音箱（小爱、小度等）吗？',
      required: true,
      options: [
        { id: 'opt-c1l1-sv-1-a', label: 'A', content: '经常用' },
        { id: 'opt-c1l1-sv-1-b', label: 'B', content: '偶尔用过' },
        { id: 'opt-c1l1-sv-1-c', label: 'C', content: '听说过但没用过' },
        { id: 'opt-c1l1-sv-1-d', label: 'D', content: '完全不知道' },
      ],
    },
    {
      id: 'q-c1l1-sv-2',
      type: 'multipleChoice',
      title: '下面哪些是 AI 应用？（多选）',
      required: true,
      options: [
        { id: 'opt-c1l1-sv-2-a', label: 'A', content: '语音助手' },
        { id: 'opt-c1l1-sv-2-b', label: 'B', content: '普通计算器' },
        { id: 'opt-c1l1-sv-2-c', label: 'C', content: '人脸识别打卡' },
        { id: 'opt-c1l1-sv-2-d', label: 'D', content: '手电筒' },
      ],
    },
    {
      id: 'q-c1l1-sv-3',
      type: 'fillBlank',
      title: '请用一句话写出你对"AI"的印象。',
      blanks: 1,
    },
  ],
}

const ACT_C1L1_ASSESS: Activity = {
  id: 'act-c1l1-as',
  type: 'assessment',
  title: '认识 AI · 小测',
  description: '检验本节课的掌握情况，共 3 题。',
  scoringRule: { totalScore: 30, passScore: 18 },
  dimensions: [
    { id: DIM.c1_base, name: 'AI 基础概念' },
    { id: DIM.c1_app,  name: '生活应用' },
  ],
  feedbackConfig: { showScore: true, showExplanation: true, showDimensionRadar: true },
  questions: [
    {
      id: 'q-c1l1-as-1',
      type: 'singleChoice',
      title: 'AI 的全名叫什么？',
      score: 10,
      dimensions: [DIM.c1_base],
      options: [
        { id: 'opt-c1l1-as-1-a', label: 'A', content: '自动互联网' },
        { id: 'opt-c1l1-as-1-b', label: 'B', content: '人工智能' },
        { id: 'opt-c1l1-as-1-c', label: 'C', content: '高级电脑' },
      ],
      answer: 'opt-c1l1-as-1-b',
      explanation: 'AI 是 Artificial Intelligence 的缩写，中文叫"人工智能"。',
    },
    {
      id: 'q-c1l1-as-2',
      type: 'judge',
      title: '所有 AI 都是机器人。',
      score: 10,
      dimensions: [DIM.c1_base],
      answer: false,
      explanation: 'AI 不一定长得像机器人，比如手机里的语音助手、视频推荐都是 AI。',
    },
    {
      id: 'q-c1l1-as-3',
      type: 'fillBlank',
      title: '会从大量数据里"学规律"的程序，叫 ______。',
      score: 10,
      dimensions: [DIM.c1_base],
      blanks: 1,
      answer: [['机器学习', 'ML', 'Machine Learning']],
      explanation: '机器学习就是 AI 学习本领的方法。',
    },
  ],
}

/* ---------- 课程 1 · 第 2 节的活动（AI 的耳朵） ---------- */
const ACT_C1L2_SURVEY: Activity = {
  id: 'act-c1l2-sv',
  type: 'survey',
  title: '我和语音助手的故事',
  description: '聊一聊你最常对语音助手说什么。',
  feedbackConfig: { showScore: false },
  questions: [
    {
      id: 'q-c1l2-sv-1',
      type: 'singleChoice',
      title: '语音助手最常给你做什么？',
      options: [
        { id: 'opt-c1l2-sv-1-a', label: 'A', content: '播放音乐' },
        { id: 'opt-c1l2-sv-1-b', label: 'B', content: '查天气' },
        { id: 'opt-c1l2-sv-1-c', label: 'C', content: '设置闹钟' },
        { id: 'opt-c1l2-sv-1-d', label: 'D', content: '聊天解闷' },
      ],
    },
    {
      id: 'q-c1l2-sv-2',
      type: 'fillBlank',
      title: '写一句你最常对语音助手说的话。',
      blanks: 1,
    },
  ],
}

const ACT_C1L2_AIPRACTICE: Activity = {
  id: 'act-c1l2-ai',
  type: 'aiPractice',
  title: '试试和 AI 说话',
  description: '对着 AI 说一句话，看它能不能听懂。',
  practiceType: 'speechRecognition',
  examples: [
    '说一句"今天天气怎么样"',
    '说一句你的名字，看 AI 能不能听清',
  ],
}

const ACT_C1L2_ASSESS: Activity = {
  id: 'act-c1l2-as',
  type: 'assessment',
  title: 'AI 的耳朵 · 小测',
  scoringRule: { totalScore: 20, passScore: 12 },
  dimensions: [{ id: DIM.c1_base, name: 'AI 基础概念' }],
  feedbackConfig: { showScore: true, showExplanation: true },
  questions: [
    {
      id: 'q-c1l2-as-1',
      type: 'singleChoice',
      title: 'AI 听懂话的第一步是？',
      score: 10,
      dimensions: [DIM.c1_base],
      options: [
        { id: 'opt-c1l2-as-1-a', label: 'A', content: '把声音变成数字' },
        { id: 'opt-c1l2-as-1-b', label: 'B', content: '把声音放大' },
        { id: 'opt-c1l2-as-1-c', label: 'C', content: '把声音录下来' },
      ],
      answer: 'opt-c1l2-as-1-a',
      explanation: '声音对计算机来说是一串数字组成的波形。',
    },
    {
      id: 'q-c1l2-as-2',
      type: 'judge',
      title: '智能音箱里其实有一个真人在帮我们回答。',
      score: 10,
      dimensions: [DIM.c1_base],
      answer: false,
      explanation: '是 AI 在工作，不是真人，里面也没有人哦。',
    },
  ],
}

/* ---------- 课程 1 · 第 3 节的活动（AI 安全） ---------- */
const ACT_C1L3_SURVEY: Activity = {
  id: 'act-c1l3-sv',
  type: 'survey',
  title: '使用 AI 时你担心什么',
  feedbackConfig: { showScore: false },
  questions: [
    {
      id: 'q-c1l3-sv-1',
      type: 'multipleChoice',
      title: '你在用 AI 时担心过哪些问题？（多选）',
      options: [
        { id: 'opt-c1l3-sv-1-a', label: 'A', content: '回答不准确' },
        { id: 'opt-c1l3-sv-1-b', label: 'B', content: '泄露个人隐私' },
        { id: 'opt-c1l3-sv-1-c', label: 'C', content: '偷懒不思考' },
        { id: 'opt-c1l3-sv-1-d', label: 'D', content: '没担心过' },
      ],
    },
  ],
}

const ACT_C1L3_ASSESS: Activity = {
  id: 'act-c1l3-as',
  type: 'assessment',
  title: 'AI 安全 · 小测',
  scoringRule: { totalScore: 30, passScore: 18 },
  dimensions: [
    { id: DIM.c1_safety, name: 'AI 安全意识' },
    { id: DIM.c1_app,    name: '生活应用' },
  ],
  feedbackConfig: { showScore: true, showExplanation: true, showDimensionRadar: true },
  questions: [
    {
      id: 'q-c1l3-as-1',
      type: 'multipleChoice',
      title: '使用 AI 时哪些做法是对的？（多选）',
      score: 15,
      scoreMode: 'partial',
      dimensions: [DIM.c1_safety],
      options: [
        { id: 'opt-c1l3-as-1-a', label: 'A', content: '重要信息和老师、书本再核实' },
        { id: 'opt-c1l3-as-1-b', label: 'B', content: '把家里地址、电话告诉 AI' },
        { id: 'opt-c1l3-as-1-c', label: 'C', content: '让 AI 帮我写作业，我直接交' },
        { id: 'opt-c1l3-as-1-d', label: 'D', content: '把 AI 的答案当参考，自己再思考' },
      ],
      answer: ['opt-c1l3-as-1-a', 'opt-c1l3-as-1-d'],
      explanation: '不要泄露隐私，也不要全靠 AI 代替思考。AI 是助手，不是"答案机"。',
    },
    {
      id: 'q-c1l3-as-2',
      type: 'judge',
      title: 'AI 说"李白写过《静夜思 2》"，我应该立刻信。',
      score: 15,
      dimensions: [DIM.c1_safety],
      answer: false,
      explanation: 'AI 会一本正经地"胡说"，这种叫 AI 幻觉，需要核实。',
    },
  ],
}

/* ---------- 课程 2 · 第 1 节的活动（导入） ---------- */
const ACT_C2L1_SURVEY: Activity = {
  id: 'act-c2l1-sv',
  type: 'survey',
  title: '你身边的图像识别',
  feedbackConfig: { showScore: false },
  questions: [
    {
      id: 'q-c2l1-sv-1',
      type: 'multipleChoice',
      title: '你在哪些地方见过图像识别？（多选）',
      options: [
        { id: 'opt-c2l1-sv-1-a', label: 'A', content: '刷脸支付' },
        { id: 'opt-c2l1-sv-1-b', label: 'B', content: '相册自动分类' },
        { id: 'opt-c2l1-sv-1-c', label: 'C', content: '智能垃圾分类' },
        { id: 'opt-c2l1-sv-1-d', label: 'D', content: '都没见过' },
      ],
    },
  ],
}

/* ---------- 课程 2 · 第 2 节的活动（看图片的原理） ---------- */
const ACT_C2L2_ASSESS: Activity = {
  id: 'act-c2l2-as',
  type: 'assessment',
  title: '看图原理 · 小测',
  scoringRule: { totalScore: 40, passScore: 24 },
  dimensions: [
    { id: DIM.c2_base, name: '基础概念' },
    { id: DIM.c2_principle, name: '识别原理' },
  ],
  feedbackConfig: { showScore: true, showExplanation: true, showDimensionRadar: true },
  questions: [
    {
      id: 'q-c2l2-as-1',
      type: 'singleChoice',
      title: 'AI 看图的第一步是？',
      score: 10,
      dimensions: [DIM.c2_base],
      options: [
        { id: 'opt-c2l2-as-1-a', label: 'A', content: '把图片变成数字' },
        { id: 'opt-c2l2-as-1-b', label: 'B', content: '给图片涂色' },
        { id: 'opt-c2l2-as-1-c', label: 'C', content: '把图片裁剪' },
      ],
      answer: 'opt-c2l2-as-1-a',
      explanation: '图片对计算机来说就是一张超大的方格纸（像素阵列）。',
    },
    {
      id: 'q-c2l2-as-2',
      type: 'sort',
      title: '把"图像识别"的步骤排好顺序：',
      score: 15,
      dimensions: [DIM.c2_principle],
      items: [
        { id: 'sort-c2l2-1', content: '收集大量图片样本' },
        { id: 'sort-c2l2-2', content: '提取图像特征' },
        { id: 'sort-c2l2-3', content: '训练识别模型' },
        { id: 'sort-c2l2-4', content: '上线识别新图片' },
      ],
      answer: ['sort-c2l2-1', 'sort-c2l2-2', 'sort-c2l2-3', 'sort-c2l2-4'],
      explanation: '收集 → 提特征 → 训练 → 部署，是图像识别的常见流程。',
    },
    {
      id: 'q-c2l2-as-3',
      type: 'judge',
      title: '刷脸支付是用了图像识别。',
      score: 15,
      dimensions: [DIM.c2_principle],
      answer: true,
      explanation: '刷脸支付用的就是人脸识别（图像识别的一种）。',
    },
  ],
}

/* ---------- 课程 2 · 第 3 节的活动（应用） ---------- */
const ACT_C2L3_AIPRACTICE: Activity = {
  id: 'act-c2l3-ai',
  type: 'aiPractice',
  title: '试试让 AI 看图',
  description: '上传一张照片，看 AI 能不能认出来',
  practiceType: 'imageRecognition',
  examples: [
    '上传一张猫的照片，看 AI 怎么说',
    '上传一张水果照片，看 AI 能不能猜出来',
  ],
}

const ACT_C2L3_CLASSIFY: Activity = {
  id: 'act-c2l3-as',
  type: 'assessment',
  title: 'AI 应用 · 分类小测',
  scoringRule: { totalScore: 30 },
  dimensions: [{ id: DIM.c2_app, name: 'AI 应用' }],
  feedbackConfig: { showScore: true, showExplanation: true },
  questions: [
    {
      id: 'q-c2l3-as-1',
      type: 'classify',
      title: '把下面的应用按 AI 类型分类：',
      score: 30,
      dimensions: [DIM.c2_app],
      categories: [
        { id: 'cat-c2l3-cv',  name: '计算机视觉' },
        { id: 'cat-c2l3-nlp', name: '自然语言处理' },
        { id: 'cat-c2l3-rec', name: '推荐 / 决策' },
      ],
      items: [
        { id: 'item-c2l3-1', content: '人脸识别' },
        { id: 'item-c2l3-2', content: '机器翻译' },
        { id: 'item-c2l3-3', content: '短视频推荐' },
        { id: 'item-c2l3-4', content: 'OCR 文字识别' },
        { id: 'item-c2l3-5', content: '智能客服' },
      ],
      answer: {
        'item-c2l3-1': 'cat-c2l3-cv',
        'item-c2l3-2': 'cat-c2l3-nlp',
        'item-c2l3-3': 'cat-c2l3-rec',
        'item-c2l3-4': 'cat-c2l3-cv',
        'item-c2l3-5': 'cat-c2l3-nlp',
      },
      explanation: '人脸识别、OCR 属于计算机视觉；翻译、客服属于自然语言处理；推荐属于决策类。',
    },
  ],
}

/* ---------- 课程 2 · 第 4 节的活动（思辨与综合） ---------- */
const ACT_C2L4_FINAL: Activity = {
  id: 'act-c2l4-as',
  type: 'assessment',
  title: '综合测评',
  description: '综合考察图像识别相关知识，共 4 题。',
  scoringRule: { totalScore: 40, passScore: 24 },
  dimensions: [
    { id: DIM.c2_base, name: '基础概念' },
    { id: DIM.c2_principle, name: '识别原理' },
    { id: DIM.c2_app, name: 'AI 应用' },
    { id: DIM.c2_thinking, name: '批判思考' },
  ],
  feedbackConfig: { showScore: true, showExplanation: true, showDimensionRadar: true },
  questions: [
    {
      id: 'q-c2l4-as-1',
      type: 'wordCompose',
      title: '把 AI 概念和它的解释配对：',
      score: 15,
      dimensions: [DIM.c2_base],
      leftItems: [
        { id: 'wc-c2l4-L1', content: '机器学习' },
        { id: 'wc-c2l4-L2', content: '神经网络' },
        { id: 'wc-c2l4-L3', content: '过拟合' },
      ],
      rightItems: [
        { id: 'wc-c2l4-R1', content: '从数据中找规律的方法' },
        { id: 'wc-c2l4-R2', content: '模仿人脑结构的多层计算单元' },
        { id: 'wc-c2l4-R3', content: '模型死记训练数据导致泛化变差' },
      ],
      answer: [
        { leftId: 'wc-c2l4-L1', rightId: 'wc-c2l4-R1' },
        { leftId: 'wc-c2l4-L2', rightId: 'wc-c2l4-R2' },
        { leftId: 'wc-c2l4-L3', rightId: 'wc-c2l4-R3' },
      ],
      explanation: '机器学习 / 神经网络 / 过拟合是 AI 中最常见的三个基础概念。',
    },
    {
      id: 'q-c2l4-as-2',
      type: 'multipleChoice',
      title: '下列哪些情况可能让图像识别 AI 出错？（多选）',
      score: 10,
      scoreMode: 'partial',
      dimensions: [DIM.c2_thinking],
      options: [
        { id: 'opt-c2l4-as-2-a', label: 'A', content: '光线很差' },
        { id: 'opt-c2l4-as-2-b', label: 'B', content: '从来没见过的物体' },
        { id: 'opt-c2l4-as-2-c', label: 'C', content: '训练数据有偏差' },
        { id: 'opt-c2l4-as-2-d', label: 'D', content: '电脑屏幕亮一点' },
      ],
      answer: ['opt-c2l4-as-2-a', 'opt-c2l4-as-2-b', 'opt-c2l4-as-2-c'],
      explanation: '光照、新物体、训练数据偏差都会影响 AI 准确率。',
    },
    {
      id: 'q-c2l4-as-3',
      type: 'fillBlank',
      title: '让模型死记训练数据、看到新数据反而不会的现象，叫 ______。',
      score: 5,
      dimensions: [DIM.c2_principle],
      blanks: 1,
      answer: [['过拟合']],
    },
    {
      id: 'q-c2l4-as-4',
      type: 'shortAnswer',
      title: '请用 2-3 句话说说：你认为 AI 图像识别可以用来做什么有意义的事？',
      score: 10,
      dimensions: [DIM.c2_thinking],
      answer: '示例：盲人导航 App 借助 AI 视觉识别帮助视障人士识别物体与文字，提升生活独立性。',
      explanation: '简答题不计算自动得分，老师人工批改。',
    },
  ],
}

/* —— MOCK_ACTIVITIES 集合在文件末尾汇总（避免引用尚未声明的常量）—— */

/* ====================================================================
 * Course 1：认识AI小伙伴（小学 1-2 年级，3 节）
 * ==================================================================== */
const COURSE_AI_FRIEND: Course = {
  id: 'course-01',
  title: '认识 AI 小伙伴',
  description: '生活里到处都有 AI。我们先认识它，再和它做朋友。',
  stage: 'primary',
  gradeRange: '1-2年级',
  cover: 'course-01',
  status: 'published',
  createdAt: '2026-05-10T09:00:00.000Z',
  updatedAt: '2026-06-22T14:30:00.000Z',
  lessons: [
    {
      id: 'lesson-c1-01',
      courseId: 'course-01',
      title: '第一课：什么是 AI',
      description: '从生活常见的智能设备出发，建立对 AI 的初步认知。',
      duration: 25,
      status: 'published',
      order: 1,
      nodes: [
        {
          id: 'node-c1l1-01', lessonId: 'lesson-c1-01', type: 'content', order: 1,
          title: '课程导入',
          content: `# 嗨，认识一下你身边的"小伙伴" 🤖

你有没有对着智能音箱说过"播放音乐"？
有没有用手机刷脸解锁？

那些会听话、会看图、能帮你做事的程序，
就是我们今天要认识的好朋友—— **AI**！`,
        },
        {
          id: 'node-c1l1-02', lessonId: 'lesson-c1-01', type: 'content', order: 2,
          title: '知识讲解',
          content: `# AI 是什么

**AI** 全名叫"人工智能"，英文是 Artificial Intelligence。

简单说，AI 是一种能让机器**像人一样思考**的技术。

## AI 能做哪些事？

- 👂 **会听**：听懂你说话
- 👁️ **会看**：分得清照片里是猫还是狗
- 🧠 **会想**：给你推荐你喜欢的视频
- 💬 **会聊**：陪你说话、回答你的问题

## 找一找你身边的 AI

- 📱 手机里的语音助手
- 🚪 家里的扫地机器人
- 🎬 视频 App 的推荐
- 🔓 校门口的人脸识别打卡机

是不是发现，AI 已经悄悄进入我们的生活了？`,
        },
        {
          id: 'node-c1l1-03', lessonId: 'lesson-c1-01', type: 'survey', order: 3,
          title: '课堂小问卷',
          description: '说说你和 AI 的小故事～',
          activityId: ACT_C1L1_SURVEY.id,
          completionRequired: false,
        },
        {
          id: 'node-c1l1-04', lessonId: 'lesson-c1-01', type: 'assessment', order: 4,
          title: '知识小测',
          description: '看看你今天学得怎么样～',
          activityId: ACT_C1L1_ASSESS.id,
          completionRequired: true,
        },
        {
          id: 'node-c1l1-05', lessonId: 'lesson-c1-01', type: 'feedback', order: 5,
          title: '课后反馈',
          content: '本节课我们认识了 AI 的样子，下一课，我们一起去看看 AI 的"耳朵" 👂',
        },
      ],
    },

    {
      id: 'lesson-c1-02',
      courseId: 'course-01',
      title: '第二课：AI 的"耳朵"',
      description: 'AI 怎么听懂我们说话？',
      duration: 30,
      status: 'published',
      order: 2,
      nodes: [
        {
          id: 'node-c1l2-01', lessonId: 'lesson-c1-02', type: 'content', order: 1,
          title: '课程导入',
          content: `# 你说一句，AI 就懂 👂

"小爱同学，关灯！"
"灯已关闭。"

为什么 AI 能听懂你的话？这背后藏着什么秘密？`,
        },
        {
          id: 'node-c1l2-02', lessonId: 'lesson-c1-02', type: 'content', order: 2,
          title: '知识讲解',
          content: `# AI 是怎么听懂话的？

声音对计算机来说，本来是一团混乱的"波浪"。
AI 要做三件事，才能"听懂"你说什么：

## 第一步：把声音变成数字

声音是一串波浪。AI 把每个波浪变成数字。

## 第二步：找出文字的"形状"

不同的字、不同的词，声音波浪的形状不一样。
AI 听过几百万条录音，慢慢就认得每个字的"形状"。

## 第三步：理解你的意思

听到"开灯"，AI 知道你想打开灯。
听到"关灯"，AI 知道你想关掉灯。`,
        },
        {
          id: 'node-c1l2-03', lessonId: 'lesson-c1-02', type: 'survey', order: 3,
          title: '我和语音助手的故事',
          activityId: ACT_C1L2_SURVEY.id,
        },
        {
          id: 'node-c1l2-04', lessonId: 'lesson-c1-02', type: 'aiPractice', order: 4,
          title: '试试和 AI 说话',
          description: '对着 AI 说一句话，看它能不能听懂。',
          activityId: ACT_C1L2_AIPRACTICE.id,
        },
        {
          id: 'node-c1l2-05', lessonId: 'lesson-c1-02', type: 'assessment', order: 5,
          title: '知识小测',
          activityId: ACT_C1L2_ASSESS.id,
          completionRequired: true,
        },
      ],
    },

    {
      id: 'lesson-c1-03',
      courseId: 'course-01',
      title: '第三课：聪明地用 AI',
      description: 'AI 也会"翻车"，学会判断 AI 的回答',
      duration: 30,
      status: 'published',
      order: 3,
      nodes: [
        {
          id: 'node-c1l3-01', lessonId: 'lesson-c1-03', type: 'content', order: 1,
          title: '课程导入',
          content: `# AI 不是万能的 🛡️

AI 看起来很厉害，但它有时候会胡说八道。
学会**判断 AI 说得对不对**，是这节课的重点。`,
        },
        {
          id: 'node-c1l3-02', lessonId: 'lesson-c1-03', type: 'content', order: 2,
          title: '知识讲解',
          content: `# AI 三种常见"翻车"

## 1. 一本正经地胡说

AI 会很自信地编造一些**根本不存在**的事，
比如告诉你"李白写过《静夜思 2》"。

这叫 **AI 幻觉**。

## 2. 偏见

AI 是从历史数据中学的。
如果数据本身有偏见，AI 就会"传染"。

## 3. 过时

AI 的知识有"截止日期"。
最近发生的事，它可能根本不知道。

## 三个使用 AI 的好习惯

1. ✅ **多问几个 AI**：让它解释为什么
2. ✅ **重要信息要核实**：和老师、书本、官方网站对一下
3. ✅ **保护隐私**：不要把家里地址、密码告诉 AI`,
        },
        {
          id: 'node-c1l3-03', lessonId: 'lesson-c1-03', type: 'survey', order: 3,
          title: '使用 AI 时你担心什么',
          activityId: ACT_C1L3_SURVEY.id,
        },
        {
          id: 'node-c1l3-04', lessonId: 'lesson-c1-03', type: 'assessment', order: 4,
          title: 'AI 安全 · 小测',
          activityId: ACT_C1L3_ASSESS.id,
          completionRequired: true,
        },
        {
          id: 'node-c1l3-05', lessonId: 'lesson-c1-03', type: 'feedback', order: 5,
          title: '课程总结',
          content: '恭喜完成《认识 AI 小伙伴》整门课程！下一阶段可以挑战《AI 图像识别》。',
        },
      ],
    },
  ],
}

/* ====================================================================
 * Course 2：AI图像识别 — 机器怎么看图（4 节）
 * ==================================================================== */
const COURSE_IMAGE_REC: Course = {
  id: 'course-02',
  stage: 'primary',
  title: 'AI 图像识别：机器怎么看图',
  description: '探索计算机视觉的奥秘，了解 AI 如何识别图像。',
  gradeRange: '3-4年级',
  cover: 'course-02',
  status: 'published',
  createdAt: '2026-05-15T09:00:00.000Z',
  updatedAt: '2026-06-23T10:00:00.000Z',
  lessons: [
    {
      id: 'lesson-c2-01',
      courseId: 'course-02',
      title: '第一课：图像识别在身边',
      description: '从生活场景认识图像识别',
      duration: 20,
      status: 'published',
      order: 1,
      nodes: [
        {
          id: 'node-c2l1-01', lessonId: 'lesson-c2-01', type: 'content', order: 1,
          title: '课程导入',
          content: `# AI 也有"眼睛"吗？👁️

你拿手机刷脸，"咔"一下就解锁了。
为什么 AI 一眼就认出你是你？

今天我们看看 AI 是怎么"看"的。`,
        },
        {
          id: 'node-c2l1-02', lessonId: 'lesson-c2-01', type: 'content', order: 2,
          title: '生活中的图像识别',
          content: `# 你身边的图像识别

- 🔓 手机刷脸解锁 / 刷脸支付
- 🚪 校门口的智能识别打卡
- 🐱 帮你认猫认狗的 App
- 🚗 自动驾驶看红绿灯
- 🥬 智能垃圾桶辨识垃圾种类

这些场景，**全部用到了图像识别**。`,
        },
        {
          id: 'node-c2l1-03', lessonId: 'lesson-c2-01', type: 'survey', order: 3,
          title: '你身边的图像识别',
          activityId: ACT_C2L1_SURVEY.id,
        },
        {
          id: 'node-c2l1-04', lessonId: 'lesson-c2-01', type: 'feedback', order: 4,
          title: '小结',
          content: '原来图像识别已经悄悄出现在我们生活的方方面面 🎉',
        },
      ],
    },

    {
      id: 'lesson-c2-02',
      courseId: 'course-02',
      title: '第二课：AI 怎么"看"图片',
      description: '看图原理：像素 → 特征 → 判断',
      duration: 30,
      status: 'published',
      order: 2,
      nodes: [
        {
          id: 'node-c2l2-01', lessonId: 'lesson-c2-02', type: 'content', order: 1,
          title: '图片在 AI 眼里是什么',
          content: `# 图片 = 一张超大的方格纸

对计算机来说，图片是由很多很多小格子（像素）组成的。

每个像素都有一个数字，表示颜色的深浅。

AI 先把图片"读"成一大堆数字。`,
        },
        {
          id: 'node-c2l2-02', lessonId: 'lesson-c2-02', type: 'content', order: 2,
          title: '识别的三步',
          content: `# 识别一张图，AI 要做三步

1. **变数字**：图片 → 像素 → 数字
2. **找特征**：找眼睛、鼻子、轮廓……
3. **做判断**：和已知的"模板"比一比，得出结论

## 比如认猫

- AI 学习了几十万张猫的照片
- 总结出"两个三角形耳朵 + 圆圆的眼睛 + 长胡子"
- 下次看到一张新图，对着这个特征比一比，对得上 → "这是猫"`,
        },
        {
          id: 'node-c2l2-03', lessonId: 'lesson-c2-02', type: 'assessment', order: 3,
          title: '看图原理 · 小测',
          activityId: ACT_C2L2_ASSESS.id,
          completionRequired: true,
        },
        {
          id: 'node-c2l2-04', lessonId: 'lesson-c2-02', type: 'feedback', order: 4,
          title: '小结',
          content: '记住这三步：变数字 → 找特征 → 做判断。',
        },
      ],
    },

    {
      id: 'lesson-c2-03',
      courseId: 'course-02',
      title: '第三课：让 AI 帮我们做分类',
      description: 'AI 应用：分类是怎么来的',
      duration: 30,
      status: 'published',
      order: 3,
      nodes: [
        {
          id: 'node-c2l3-01', lessonId: 'lesson-c2-03', type: 'content', order: 1,
          title: '什么叫"分类"',
          content: `# AI 最擅长的活儿之一：分类

把东西按特征归到不同类别，是 AI 的强项。

- 这是"猫" or "狗"？
- 这是"可回收"还是"厨余"？
- 这条评论是"开心"还是"不开心"？`,
        },
        {
          id: 'node-c2l3-02', lessonId: 'lesson-c2-03', type: 'aiPractice', order: 2,
          title: '试试让 AI 看图',
          description: '上传一张照片，看 AI 能不能认出来',
          activityId: ACT_C2L3_AIPRACTICE.id,
        },
        {
          id: 'node-c2l3-03', lessonId: 'lesson-c2-03', type: 'assessment', order: 3,
          title: 'AI 应用 · 分类小测',
          activityId: ACT_C2L3_CLASSIFY.id,
          completionRequired: true,
        },
        {
          id: 'node-c2l3-04', lessonId: 'lesson-c2-03', type: 'content', order: 4,
          title: '动手前思考',
          content: `# 我们身边还有哪些"分类"任务可以交给 AI？

试着想想：
- 学校大门口要分辨"老师 / 学生 / 外来人员"，能不能用图像识别？
- 妈妈想自动整理相册里的猫照片，能不能用 AI 分类？

下一节是综合测评，加油 💪`,
        },
      ],
    },

    {
      id: 'lesson-c2-04',
      courseId: 'course-02',
      title: '第四课：综合挑战',
      description: '检查所学，建立批判性思考',
      duration: 35,
      status: 'published',
      order: 4,
      nodes: [
        {
          id: 'node-c2l4-01', lessonId: 'lesson-c2-04', type: 'content', order: 1,
          title: '回顾',
          content: `# 这门课我们学到了什么？

- ✅ 图像识别在生活中无处不在
- ✅ AI 看图分三步：变数字 / 找特征 / 做判断
- ✅ AI 也会犯错——光线、新物体、数据偏差都会影响

接下来的综合测评共 4 题，加油！`,
        },
        {
          id: 'node-c2l4-02', lessonId: 'lesson-c2-04', type: 'assessment', order: 2,
          title: '综合测评',
          description: '4 道题，覆盖本课程主要知识点',
          activityId: ACT_C2L4_FINAL.id,
          completionRequired: true,
        },
        {
          id: 'node-c2l4-03', lessonId: 'lesson-c2-04', type: 'feedback', order: 3,
          title: '课程结业',
          content: `🎉 恭喜你完成《AI 图像识别：机器怎么看图》全部 4 课。

你现在已经知道：AI 不是魔法，而是一套「数据 + 训练 + 判断」的方法。

下一步，去学习更进阶的 AI 课程吧！`,
        },
      ],
    },
  ],
}

/* ====================================================================
 * Course 3：AI 的耳朵 — 听话的秘密（1-2 年级，3 节）
 * ==================================================================== */

const ACT_C3L1_SURVEY: Activity = {
  id: 'act-c3l1-sv',
  type: 'survey',
  title: '聊聊语音助手',
  feedbackConfig: { showScore: false },
  questions: [
    {
      id: 'q-c3l1-sv-1',
      type: 'singleChoice',
      title: '你家里有没有语音助手（小爱、小度等）？',
      options: [
        { id: 'opt-c3l1-sv-1-a', label: 'A', content: '有，经常用' },
        { id: 'opt-c3l1-sv-1-b', label: 'B', content: '有，偶尔用' },
        { id: 'opt-c3l1-sv-1-c', label: 'C', content: '没有' },
      ],
    },
    {
      id: 'q-c3l1-sv-2',
      type: 'fillBlank',
      title: '说一句你最常对语音助手说的话：',
      blanks: 1,
    },
  ],
}

const ACT_C3L2_ASSESS: Activity = {
  id: 'act-c3l2-as',
  type: 'assessment',
  title: '听话原理 · 小测',
  scoringRule: { totalScore: 20, passScore: 12 },
  dimensions: [{ id: 'dim-c3-base', name: '听话原理' }],
  feedbackConfig: { showScore: true, showExplanation: true },
  questions: [
    {
      id: 'q-c3l2-as-1',
      type: 'singleChoice',
      title: '语音助手"听懂"话的关键是？',
      score: 10,
      dimensions: ['dim-c3-base'],
      options: [
        { id: 'opt-c3l2-as-1-a', label: 'A', content: '里面藏了一个真人' },
        { id: 'opt-c3l2-as-1-b', label: 'B', content: '语音识别 + 自然语言理解' },
        { id: 'opt-c3l2-as-1-c', label: 'C', content: '它有耳朵' },
      ],
      answer: 'opt-c3l2-as-1-b',
      explanation: '语音助手把你的声音转成文字（语音识别），再理解你的意思（自然语言理解）。',
    },
    {
      id: 'q-c3l2-as-2',
      type: 'judge',
      title: '语音助手听不清时是因为它"耳朵不好"。',
      score: 10,
      dimensions: ['dim-c3-base'],
      answer: false,
      explanation: '其实是声音变成数字后，AI 识别不出来。环境噪音、说话不清晰都会影响识别。',
    },
  ],
}

const ACT_C3L3_AIPRACTICE: Activity = {
  id: 'act-c3l3-ai',
  type: 'aiPractice',
  title: '挑战语音助手',
  description: '想几个有趣的问题问问语音助手，看它能答上来吗？',
  practiceType: 'speechRecognition',
  examples: [
    '问"明天会下雨吗"',
    '让它讲个笑话',
    '让它播放你最喜欢的儿歌',
  ],
}

const COURSE_AI_EAR: Course = {
  id: 'course-03',
  stage: 'primary',
  title: 'AI 的耳朵：听话的秘密',
  description: '语音助手是怎么听懂我们说话的？',
  gradeRange: '1-2年级',
  cover: 'course-03',
  status: 'published',
  createdAt: '2026-05-12T09:00:00.000Z',
  updatedAt: '2026-06-20T10:00:00.000Z',
  lessons: [
    {
      id: 'lesson-c3-01',
      courseId: 'course-03',
      title: '第一课：聊聊语音助手',
      duration: 20,
      status: 'published',
      order: 1,
      nodes: [
        {
          id: 'node-c3l1-01', lessonId: 'lesson-c3-01', type: 'content', order: 1,
          title: '课程导入',
          content: '# 你对它说话，它就回应你 🗣️\n\n"小爱同学，今天天气怎么样？"\n"今天阴有小雨。"\n\n它怎么知道你在问天气？',
        },
        {
          id: 'node-c3l1-02', lessonId: 'lesson-c3-01', type: 'survey', order: 2,
          title: '小问卷', activityId: ACT_C3L1_SURVEY.id,
        },
      ],
    },
    {
      id: 'lesson-c3-02',
      courseId: 'course-03',
      title: '第二课：听话的秘密',
      duration: 25,
      status: 'published',
      order: 2,
      nodes: [
        {
          id: 'node-c3l2-01', lessonId: 'lesson-c3-02', type: 'content', order: 1,
          title: '声音变数字',
          content: '# 声音 = 波浪 → 数字\n\n人说话的声音其实是一阵阵波浪。\n\nAI 把波浪变成密密麻麻的数字，再从数字里找规律，就能猜出你说了什么字。',
        },
        {
          id: 'node-c3l2-02', lessonId: 'lesson-c3-02', type: 'assessment', order: 2,
          title: '小测', activityId: ACT_C3L2_ASSESS.id, completionRequired: true,
        },
      ],
    },
    {
      id: 'lesson-c3-03',
      courseId: 'course-03',
      title: '第三课：和 AI 说话',
      duration: 25,
      status: 'published',
      order: 3,
      nodes: [
        {
          id: 'node-c3l3-01', lessonId: 'lesson-c3-03', type: 'content', order: 1,
          title: '怎么说，AI 才听得清',
          content: '# 三个小窍门 🎯\n\n- 🔇 找一个**安静**的环境\n- 🗣️ 说话**清晰**、不要太快\n- 📏 离麦克风**近一点**',
        },
        {
          id: 'node-c3l3-02', lessonId: 'lesson-c3-03', type: 'aiPractice', order: 2,
          title: '挑战语音助手', activityId: ACT_C3L3_AIPRACTICE.id,
        },
        {
          id: 'node-c3l3-03', lessonId: 'lesson-c3-03', type: 'feedback', order: 3,
          title: '小结',
          content: '原来语音助手"听话"靠的是 AI 把声音变数字 + 识别。下次再用它的时候，是不是觉得它更厉害了？',
        },
      ],
    },
  ],
}

/* ====================================================================
 * Course 4：和 AI 一起画画（3-4 年级，3 节）
 * ==================================================================== */

const ACT_C4L1_SURVEY: Activity = {
  id: 'act-c4l1-sv',
  type: 'survey',
  title: 'AI 画画初体验',
  feedbackConfig: { showScore: false },
  questions: [
    {
      id: 'q-c4l1-sv-1',
      type: 'multipleChoice',
      title: '你见过下面哪些 AI 画画作品？（多选）',
      options: [
        { id: 'opt-c4l1-sv-1-a', label: 'A', content: 'AI 把照片变成卡通' },
        { id: 'opt-c4l1-sv-1-b', label: 'B', content: 'AI 根据一句话画一幅画' },
        { id: 'opt-c4l1-sv-1-c', label: 'C', content: 'AI 把黑白照片上色' },
        { id: 'opt-c4l1-sv-1-d', label: 'D', content: '都没见过' },
      ],
    },
  ],
}

const ACT_C4L2_ASSESS: Activity = {
  id: 'act-c4l2-as',
  type: 'assessment',
  title: 'AI 画画 · 小测',
  scoringRule: { totalScore: 30, passScore: 18 },
  dimensions: [
    { id: 'dim-c4-base', name: 'AI 绘画原理' },
    { id: 'dim-c4-app',  name: '创意应用' },
  ],
  feedbackConfig: { showScore: true, showExplanation: true, showDimensionRadar: true },
  questions: [
    {
      id: 'q-c4l2-as-1',
      type: 'singleChoice',
      title: 'AI 画画的本领是怎么来的？',
      score: 10,
      dimensions: ['dim-c4-base'],
      options: [
        { id: 'opt-c4l2-as-1-a', label: 'A', content: '看了几亿张图，学会了画风' },
        { id: 'opt-c4l2-as-1-b', label: 'B', content: '它生下来就会画' },
        { id: 'opt-c4l2-as-1-c', label: 'C', content: '从书本上学的' },
      ],
      answer: 'opt-c4l2-as-1-a',
      explanation: 'AI 通过学习海量图片，掌握各种画风、物体的样子。',
    },
    {
      id: 'q-c4l2-as-2',
      type: 'judge',
      title: 'AI 画出的画和它"看过"的图片一定一模一样。',
      score: 10,
      dimensions: ['dim-c4-base'],
      answer: false,
      explanation: 'AI 是"学习风格 + 重新创作"，不是简单复制。',
    },
    {
      id: 'q-c4l2-as-3',
      type: 'multipleChoice',
      title: 'AI 画画可以用来做什么？（多选）',
      score: 10,
      scoreMode: 'partial',
      dimensions: ['dim-c4-app'],
      options: [
        { id: 'opt-c4l2-as-3-a', label: 'A', content: '给作文配插图' },
        { id: 'opt-c4l2-as-3-b', label: 'B', content: '设计游戏角色' },
        { id: 'opt-c4l2-as-3-c', label: 'C', content: '帮设计师找灵感' },
        { id: 'opt-c4l2-as-3-d', label: 'D', content: '替代所有人类画师' },
      ],
      answer: ['opt-c4l2-as-3-a', 'opt-c4l2-as-3-b', 'opt-c4l2-as-3-c'],
      explanation: 'AI 是好帮手，但不能完全替代人类的创意和情感。',
    },
  ],
}

const ACT_C4L3_AIPRACTICE: Activity = {
  id: 'act-c4l3-ai',
  type: 'aiPractice',
  title: '我和 AI 一起画',
  description: '用一句话让 AI 给你画一幅画',
  practiceType: 'imageGeneration',
  examples: [
    '一只穿宇航服的小猫',
    '彩虹瀑布从云朵上倾泻而下',
    '正在弹钢琴的小恐龙',
  ],
}

const COURSE_AI_DRAW: Course = {
  id: 'course-04',
  stage: 'primary',
  title: '和 AI 一起画画',
  description: '用一句话，让 AI 替你画出脑海里的画面。',
  gradeRange: '3-4年级',
  cover: 'course-04',
  status: 'published',
  createdAt: '2026-05-18T09:00:00.000Z',
  updatedAt: '2026-06-23T11:00:00.000Z',
  lessons: [
    {
      id: 'lesson-c4-01',
      courseId: 'course-04',
      title: '第一课：AI 也会画画？',
      duration: 25,
      status: 'published',
      order: 1,
      nodes: [
        {
          id: 'node-c4l1-01', lessonId: 'lesson-c4-01', type: 'content', order: 1,
          title: '导入',
          content: '# 一句话，一幅画 🎨\n\n输入"星空下的城堡"，AI 就能给你画出来。\n\n这种神奇的能力背后藏着什么秘密？',
        },
        {
          id: 'node-c4l1-02', lessonId: 'lesson-c4-01', type: 'survey', order: 2,
          title: '初体验调研', activityId: ACT_C4L1_SURVEY.id,
        },
      ],
    },
    {
      id: 'lesson-c4-02',
      courseId: 'course-04',
      title: '第二课：AI 画画的秘密',
      duration: 30,
      status: 'published',
      order: 2,
      nodes: [
        {
          id: 'node-c4l2-01', lessonId: 'lesson-c4-02', type: 'content', order: 1,
          title: 'AI 怎么学会画画',
          content: '# AI 画画两步走 🖌️\n\n## 第一步：学习\n\nAI 看了**几亿张图**，记住了各种风格、物体的样子。\n\n## 第二步：创作\n\n你给一句话，AI 把它理解成关键词，再"组合"它学过的元素，生成全新的画。\n\n## 它不是抄，是学完风格再创作\n\n就像你学会了画卡通，可以画出任何卡通形象，但每一幅都是独一无二的。',
        },
        {
          id: 'node-c4l2-02', lessonId: 'lesson-c4-02', type: 'assessment', order: 2,
          title: '小测', activityId: ACT_C4L2_ASSESS.id, completionRequired: true,
        },
      ],
    },
    {
      id: 'lesson-c4-03',
      courseId: 'course-04',
      title: '第三课：动手画一幅',
      duration: 30,
      status: 'published',
      order: 3,
      nodes: [
        {
          id: 'node-c4l3-01', lessonId: 'lesson-c4-03', type: 'content', order: 1,
          title: '怎么和 AI 说话',
          content: '# 描述越细，画得越好 ✨\n\n❌ 简单："一只猫"\n\n✅ 具体："一只橘色的小猫，戴着圣诞帽，坐在雪地里"\n\n## 三个小技巧\n\n- 🎨 **颜色**：橘色 / 粉色 / 复古色调\n- 🌆 **场景**：森林 / 太空 / 城堡里\n- 😊 **情绪**：开心地 / 安静地 / 神秘地',
        },
        {
          id: 'node-c4l3-02', lessonId: 'lesson-c4-03', type: 'aiPractice', order: 2,
          title: '画一幅你的作品', activityId: ACT_C4L3_AIPRACTICE.id,
        },
        {
          id: 'node-c4l3-03', lessonId: 'lesson-c4-03', type: 'feedback', order: 3,
          title: '小结',
          content: '🎨 你现在已经能让 AI 替你画画了！下一课，我们看看 AI 还能怎么帮你写故事。',
        },
      ],
    },
  ],
}

/* ====================================================================
 * Course 5：和 AI 聊天（3-4 年级，3 节）
 * ==================================================================== */

const ACT_C5L1_SURVEY: Activity = {
  id: 'act-c5l1-sv',
  type: 'survey',
  title: '你用 AI 聊天工具吗',
  feedbackConfig: { showScore: false },
  questions: [
    {
      id: 'q-c5l1-sv-1',
      type: 'singleChoice',
      title: '你用过 AI 聊天工具吗（如 ChatGPT、文心一言）？',
      options: [
        { id: 'opt-c5l1-sv-1-a', label: 'A', content: '经常用，已经离不开' },
        { id: 'opt-c5l1-sv-1-b', label: 'B', content: '用过几次' },
        { id: 'opt-c5l1-sv-1-c', label: 'C', content: '只听说过' },
        { id: 'opt-c5l1-sv-1-d', label: 'D', content: '完全没听过' },
      ],
    },
  ],
}

const ACT_C5L2_ASSESS: Activity = {
  id: 'act-c5l2-as',
  type: 'assessment',
  title: 'AI 聊天 · 小测',
  scoringRule: { totalScore: 20, passScore: 12 },
  dimensions: [{ id: 'dim-c5-base', name: '语言模型基础' }],
  feedbackConfig: { showScore: true, showExplanation: true },
  questions: [
    {
      id: 'q-c5l2-as-1',
      type: 'singleChoice',
      title: 'AI 聊天工具的本领是？',
      score: 10,
      dimensions: ['dim-c5-base'],
      options: [
        { id: 'opt-c5l2-as-1-a', label: 'A', content: '看过海量文字，会"接话"' },
        { id: 'opt-c5l2-as-1-b', label: 'B', content: '会瞬间搜索全网' },
        { id: 'opt-c5l2-as-1-c', label: 'C', content: '里面有一个真人' },
      ],
      answer: 'opt-c5l2-as-1-a',
      explanation: 'AI 聊天工具基于大语言模型，看过海量文字，学会了"该接什么话"的规律。',
    },
    {
      id: 'q-c5l2-as-2',
      type: 'judge',
      title: 'AI 聊天工具说的话都是真的。',
      score: 10,
      dimensions: ['dim-c5-base'],
      answer: false,
      explanation: 'AI 有时会"一本正经地胡说"（AI 幻觉），重要的信息要核实。',
    },
  ],
}

const ACT_C5L3_AIPRACTICE: Activity = {
  id: 'act-c5l3-ai',
  type: 'aiPractice',
  title: '和 AI 聊一聊',
  description: '试试用 AI 聊天工具完成一些任务',
  practiceType: 'chat',
  examples: [
    '让 AI 帮你写一封感谢老师的信',
    '问 AI 一个科学问题（比如"恐龙为什么灭绝"）',
    '让 AI 帮你想一个班级活动的创意',
  ],
}

const COURSE_AI_MOUTH: Course = {
  id: 'course-05',
  stage: 'primary',
  title: '和 AI 聊天：会说话的大模型',
  description: '它知道很多事，但你要会问。',
  gradeRange: '3-4年级',
  cover: 'course-05',
  status: 'published',
  createdAt: '2026-05-25T09:00:00.000Z',
  updatedAt: '2026-06-24T09:00:00.000Z',
  lessons: [
    {
      id: 'lesson-c5-01',
      courseId: 'course-05',
      title: '第一课：AI 也会"聊天"？',
      duration: 20,
      status: 'published',
      order: 1,
      nodes: [
        {
          id: 'node-c5l1-01', lessonId: 'lesson-c5-01', type: 'content', order: 1,
          title: '导入',
          content: '# 你问，它答 💬\n\n你问 AI："恐龙为什么灭绝？"\n它能给你一长串答案，听起来像个百事通。\n\n但它真的"懂"吗？',
        },
        {
          id: 'node-c5l1-02', lessonId: 'lesson-c5-01', type: 'survey', order: 2,
          title: '你用过吗', activityId: ACT_C5L1_SURVEY.id,
        },
      ],
    },
    {
      id: 'lesson-c5-02',
      courseId: 'course-05',
      title: '第二课：大模型的本领',
      duration: 25,
      status: 'published',
      order: 2,
      nodes: [
        {
          id: 'node-c5l2-01', lessonId: 'lesson-c5-02', type: 'content', order: 1,
          title: 'AI 不是百事通',
          content: '# 大语言模型的本质 📚\n\nAI 聊天工具的核心是**大语言模型**（LLM）。\n\n它就像一个**超级会接话**的朋友：\n\n- 读过几乎全网的文字\n- 学会了"什么话后面该接什么话"\n- 看起来什么都知道\n\n## 但它也有局限\n\n- ❌ 不一定准确（会"幻觉"）\n- ❌ 不会查最新新闻\n- ❌ 不能代替你思考',
        },
        {
          id: 'node-c5l2-02', lessonId: 'lesson-c5-02', type: 'assessment', order: 2,
          title: '小测', activityId: ACT_C5L2_ASSESS.id, completionRequired: true,
        },
      ],
    },
    {
      id: 'lesson-c5-03',
      courseId: 'course-05',
      title: '第三课：和 AI 对话',
      duration: 30,
      status: 'published',
      order: 3,
      nodes: [
        {
          id: 'node-c5l3-01', lessonId: 'lesson-c5-03', type: 'aiPractice', order: 1,
          title: '动手聊一聊', activityId: ACT_C5L3_AIPRACTICE.id,
        },
        {
          id: 'node-c5l3-02', lessonId: 'lesson-c5-03', type: 'feedback', order: 2,
          title: '小结',
          content: '记住：AI 是助手，不是答案。它的回答要再想一想、核对一下。',
        },
      ],
    },
  ],
}

/* ====================================================================
 * Course 6：和 AI 一起写故事（3-4 年级，3 节）
 * ==================================================================== */

const ACT_C6L1_SURVEY: Activity = {
  id: 'act-c6l1-sv',
  type: 'survey',
  title: '你喜欢哪种故事',
  feedbackConfig: { showScore: false },
  questions: [
    {
      id: 'q-c6l1-sv-1',
      type: 'multipleChoice',
      title: '你最喜欢哪种故事？（多选）',
      options: [
        { id: 'opt-c6l1-sv-1-a', label: 'A', content: '冒险类' },
        { id: 'opt-c6l1-sv-1-b', label: 'B', content: '童话类' },
        { id: 'opt-c6l1-sv-1-c', label: 'C', content: '科幻类' },
        { id: 'opt-c6l1-sv-1-d', label: 'D', content: '搞笑类' },
      ],
    },
  ],
}

const ACT_C6L2_ASSESS: Activity = {
  id: 'act-c6l2-as',
  type: 'assessment',
  title: '写故事 · 小测',
  scoringRule: { totalScore: 20 },
  dimensions: [{ id: 'dim-c6-base', name: '文本生成' }],
  feedbackConfig: { showScore: true, showExplanation: true },
  questions: [
    {
      id: 'q-c6l2-as-1',
      type: 'judge',
      title: 'AI 写出来的故事都是它自己原创的。',
      score: 10,
      dimensions: ['dim-c6-base'],
      answer: false,
      explanation: 'AI 是基于已学的海量文本"重新组合"，不是从零原创，更像"灵感拼装"。',
    },
    {
      id: 'q-c6l2-as-2',
      type: 'singleChoice',
      title: '让 AI 写出好故事的关键是？',
      score: 10,
      dimensions: ['dim-c6-base'],
      options: [
        { id: 'opt-c6l2-as-2-a', label: 'A', content: '给 AI 充电' },
        { id: 'opt-c6l2-as-2-b', label: 'B', content: '提供清晰具体的提示' },
        { id: 'opt-c6l2-as-2-c', label: 'C', content: '让它休息一会' },
      ],
      answer: 'opt-c6l2-as-2-b',
      explanation: '提示越具体，AI 写出来的内容越贴近你想要的。',
    },
  ],
}

const ACT_C6L3_AIPRACTICE: Activity = {
  id: 'act-c6l3-ai',
  type: 'aiPractice',
  title: '一起写一个故事',
  description: '给 AI 一个开头，让它帮你写下去',
  practiceType: 'textGeneration',
  examples: [
    '主角是一只会飞的小猫，发生在一座云朵城市',
    '一个孩子发现了会说话的旧台灯',
    '机器人去森林里学习人类的友谊',
  ],
}

const COURSE_AI_STORY: Course = {
  id: 'course-06',
  stage: 'primary',
  title: '和 AI 一起写故事',
  description: '让 AI 当你的写作小搭档。',
  gradeRange: '3-4年级',
  cover: 'course-06',
  status: 'published',
  createdAt: '2026-05-28T09:00:00.000Z',
  updatedAt: '2026-06-22T11:00:00.000Z',
  lessons: [
    {
      id: 'lesson-c6-01',
      courseId: 'course-06',
      title: '第一课：AI 会写故事吗',
      duration: 20,
      status: 'published',
      order: 1,
      nodes: [
        {
          id: 'node-c6l1-01', lessonId: 'lesson-c6-01', type: 'content', order: 1,
          title: '导入',
          content: '# 给 AI 一个开头 ✏️\n\n"从前，有一只爱吃糖的小狐狸……"\n\nAI 能接着写下去，而且写得还不错。\n\n它是怎么学会编故事的？',
        },
        {
          id: 'node-c6l1-02', lessonId: 'lesson-c6-01', type: 'survey', order: 2,
          title: '你的偏好', activityId: ACT_C6L1_SURVEY.id,
        },
      ],
    },
    {
      id: 'lesson-c6-02',
      courseId: 'course-06',
      title: '第二课：写作的本领',
      duration: 25,
      status: 'published',
      order: 2,
      nodes: [
        {
          id: 'node-c6l2-01', lessonId: 'lesson-c6-02', type: 'content', order: 1,
          title: 'AI 写作 = 拼装 + 想象',
          content: '# AI 怎么写故事 📖\n\nAI 读过几亿本书和文章。\n\n它学会了：\n\n- 📚 **句子怎么组**：主语、动词、形容词的搭配\n- 🎭 **故事怎么编**：开头 → 矛盾 → 高潮 → 结尾\n- 🎨 **风格怎么定**：童话风 / 科幻风 / 搞笑风\n\n你给一个开头，它就能根据"经验"接下去。',
        },
        {
          id: 'node-c6l2-02', lessonId: 'lesson-c6-02', type: 'assessment', order: 2,
          title: '小测', activityId: ACT_C6L2_ASSESS.id, completionRequired: true,
        },
      ],
    },
    {
      id: 'lesson-c6-03',
      courseId: 'course-06',
      title: '第三课：动手写一个',
      duration: 30,
      status: 'published',
      order: 3,
      nodes: [
        {
          id: 'node-c6l3-01', lessonId: 'lesson-c6-03', type: 'aiPractice', order: 1,
          title: '动手实战', activityId: ACT_C6L3_AIPRACTICE.id,
        },
        {
          id: 'node-c6l3-02', lessonId: 'lesson-c6-03', type: 'feedback', order: 2,
          title: '小结',
          content: 'AI 是好搭档，但故事里**你的想象**才是最重要的。',
        },
      ],
    },
  ],
}

/* ====================================================================
 * Course 7：Prompt 密码 — 和 AI 说清楚（5-6 年级，3 节）
 * ==================================================================== */

const ACT_C7L1_SURVEY: Activity = {
  id: 'act-c7l1-sv',
  type: 'survey',
  title: '你怎么和 AI 说话',
  feedbackConfig: { showScore: false },
  questions: [
    {
      id: 'q-c7l1-sv-1',
      type: 'singleChoice',
      title: '你向 AI 提问题时，通常会怎么说？',
      options: [
        { id: 'opt-c7l1-sv-1-a', label: 'A', content: '一句话简单问' },
        { id: 'opt-c7l1-sv-1-b', label: 'B', content: '尽量描述清楚要求' },
        { id: 'opt-c7l1-sv-1-c', label: 'C', content: '没什么固定方式' },
      ],
    },
  ],
}

const ACT_C7L2_ASSESS: Activity = {
  id: 'act-c7l2-as',
  type: 'assessment',
  title: 'Prompt 写作 · 综合测评',
  scoringRule: { totalScore: 40, passScore: 24 },
  dimensions: [
    { id: 'dim-c7-concept', name: 'Prompt 概念' },
    { id: 'dim-c7-skill',   name: 'Prompt 技巧' },
  ],
  feedbackConfig: { showScore: true, showExplanation: true, showDimensionRadar: true },
  questions: [
    {
      id: 'q-c7l2-as-1',
      type: 'singleChoice',
      title: 'Prompt 是什么意思？',
      score: 10,
      dimensions: ['dim-c7-concept'],
      options: [
        { id: 'opt-c7l2-as-1-a', label: 'A', content: '一种编程语言' },
        { id: 'opt-c7l2-as-1-b', label: 'B', content: '给 AI 的"任务说明书"' },
        { id: 'opt-c7l2-as-1-c', label: 'C', content: '一种 AI 工具' },
      ],
      answer: 'opt-c7l2-as-1-b',
      explanation: 'Prompt 就是你给 AI 的提示/指令，告诉它"我要你做什么"。',
    },
    {
      id: 'q-c7l2-as-2',
      type: 'multipleChoice',
      title: '一个好的 Prompt 应该包含哪些要素？（多选）',
      score: 15,
      scoreMode: 'partial',
      dimensions: ['dim-c7-skill'],
      options: [
        { id: 'opt-c7l2-as-2-a', label: 'A', content: '明确的任务目标' },
        { id: 'opt-c7l2-as-2-b', label: 'B', content: '具体的格式要求' },
        { id: 'opt-c7l2-as-2-c', label: 'C', content: '必要的背景信息' },
        { id: 'opt-c7l2-as-2-d', label: 'D', content: '让 AI 自由发挥的模糊词' },
      ],
      answer: ['opt-c7l2-as-2-a', 'opt-c7l2-as-2-b', 'opt-c7l2-as-2-c'],
      explanation: '清晰、具体、有背景的 Prompt 才能让 AI 给出靠谱的回答。',
    },
    {
      id: 'q-c7l2-as-3',
      type: 'sort',
      title: '按"Prompt 写作的步骤"排序：',
      score: 15,
      dimensions: ['dim-c7-skill'],
      items: [
        { id: 'sort-c7l2-1', content: '想清楚你想要 AI 做什么' },
        { id: 'sort-c7l2-2', content: '写出具体的任务和要求' },
        { id: 'sort-c7l2-3', content: '看 AI 的回答' },
        { id: 'sort-c7l2-4', content: '根据回答继续优化' },
      ],
      answer: ['sort-c7l2-1', 'sort-c7l2-2', 'sort-c7l2-3', 'sort-c7l2-4'],
      explanation: 'Prompt 是一个不断"试 → 看 → 改"的循环过程。',
    },
  ],
}

const ACT_C7L3_AIPRACTICE: Activity = {
  id: 'act-c7l3-ai',
  type: 'aiPractice',
  title: 'Prompt 实战',
  description: '把"模糊提问"改成"清晰 Prompt"',
  practiceType: 'promptWriting',
  examples: [
    '把"写作文"改成具体清晰的 Prompt',
    '把"帮我画一幅画"改成详细描述',
    '试着用 Prompt 让 AI 帮你做一份学习计划',
  ],
}

const COURSE_PROMPT: Course = {
  id: 'course-07',
  stage: 'primary',
  title: 'Prompt 密码：和 AI 说清楚',
  description: '说得越清楚，AI 帮你做的越准。',
  gradeRange: '5-6年级',
  cover: 'course-07',
  status: 'published',
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-25T10:00:00.000Z',
  lessons: [
    {
      id: 'lesson-c7-01',
      courseId: 'course-07',
      title: '第一课：什么是 Prompt',
      duration: 25,
      status: 'published',
      order: 1,
      nodes: [
        {
          id: 'node-c7l1-01', lessonId: 'lesson-c7-01', type: 'content', order: 1,
          title: '导入',
          content: '# 一样的 AI，不一样的答案 🔑\n\n你问"写一篇作文"，AI 给你乱七八糟的开头。\n你问"帮我写一篇 300 字的作文，主题是寒假趣事，用第一人称"，AI 给你工整的答案。\n\n区别就在 Prompt。',
        },
        {
          id: 'node-c7l1-02', lessonId: 'lesson-c7-01', type: 'survey', order: 2,
          title: '你的习惯', activityId: ACT_C7L1_SURVEY.id,
        },
      ],
    },
    {
      id: 'lesson-c7-02',
      courseId: 'course-07',
      title: '第二课：好 Prompt 的秘密',
      duration: 30,
      status: 'published',
      order: 2,
      nodes: [
        {
          id: 'node-c7l2-01', lessonId: 'lesson-c7-02', type: 'content', order: 1,
          title: '三个关键要素',
          content: '# 好 Prompt 公式 🧪\n\n```\nPrompt = 任务 + 要求 + 背景\n```\n\n## 1. 任务（要做什么）\n\n比如：写、画、解释、总结、翻译\n\n## 2. 要求（什么标准）\n\n字数、格式、风格、角色\n\n## 3. 背景（为什么/什么场景）\n\n面对的人、目的、上下文\n\n## 例子\n\n❌ "写一篇作文"\n\n✅ "写一篇 300 字作文，主题是寒假趣事，用第一人称，给五年级同学看，要有具体细节"',
        },
        {
          id: 'node-c7l2-02', lessonId: 'lesson-c7-02', type: 'assessment', order: 2,
          title: '综合测评', activityId: ACT_C7L2_ASSESS.id, completionRequired: true,
        },
      ],
    },
    {
      id: 'lesson-c7-03',
      courseId: 'course-07',
      title: '第三课：动手写 Prompt',
      duration: 35,
      status: 'published',
      order: 3,
      nodes: [
        {
          id: 'node-c7l3-01', lessonId: 'lesson-c7-03', type: 'aiPractice', order: 1,
          title: '改写实战', activityId: ACT_C7L3_AIPRACTICE.id,
        },
        {
          id: 'node-c7l3-02', lessonId: 'lesson-c7-03', type: 'feedback', order: 2,
          title: '结业',
          content: '🎉 完成本课！Prompt 是和 AI 协作的"通用语言"，多练习，越来越熟练。',
        },
      ],
    },
  ],
}

/* ====================================================================
 * Course 8：AI 安全小课堂（5-6 年级，3 节）
 * ==================================================================== */

const ACT_C8L1_SURVEY: Activity = {
  id: 'act-c8l1-sv',
  type: 'survey',
  title: 'AI 用得放心吗',
  feedbackConfig: { showScore: false },
  questions: [
    {
      id: 'q-c8l1-sv-1',
      type: 'multipleChoice',
      title: '在用 AI 的时候，你担心过哪些事？（多选）',
      options: [
        { id: 'opt-c8l1-sv-1-a', label: 'A', content: '答案不准确' },
        { id: 'opt-c8l1-sv-1-b', label: 'B', content: '泄露个人信息' },
        { id: 'opt-c8l1-sv-1-c', label: 'C', content: '太依赖它' },
        { id: 'opt-c8l1-sv-1-d', label: 'D', content: '没担心过' },
      ],
    },
  ],
}

const ACT_C8L2_ASSESS: Activity = {
  id: 'act-c8l2-as',
  type: 'assessment',
  title: 'AI 安全 · 综合测评',
  scoringRule: { totalScore: 40, passScore: 24 },
  dimensions: [
    { id: 'dim-c8-privacy', name: '隐私保护' },
    { id: 'dim-c8-ethics',  name: '伦理思辨' },
    { id: 'dim-c8-skill',   name: '使用技巧' },
  ],
  feedbackConfig: { showScore: true, showExplanation: true, showDimensionRadar: true },
  questions: [
    {
      id: 'q-c8l2-as-1',
      type: 'multipleChoice',
      title: '下面哪些信息**不应该**告诉 AI？（多选）',
      score: 15,
      scoreMode: 'partial',
      dimensions: ['dim-c8-privacy'],
      options: [
        { id: 'opt-c8l2-as-1-a', label: 'A', content: '家里地址' },
        { id: 'opt-c8l2-as-1-b', label: 'B', content: '银行密码' },
        { id: 'opt-c8l2-as-1-c', label: 'C', content: '今天数学题不会做' },
        { id: 'opt-c8l2-as-1-d', label: 'D', content: '身份证号码' },
      ],
      answer: ['opt-c8l2-as-1-a', 'opt-c8l2-as-1-b', 'opt-c8l2-as-1-d'],
      explanation: '个人隐私（地址、密码、证件号）不能告诉 AI 或在 AI 对话框输入。学习问题没问题。',
    },
    {
      id: 'q-c8l2-as-2',
      type: 'judge',
      title: 'AI 说"李白写过《静夜思 2》"，我应该立刻相信。',
      score: 10,
      dimensions: ['dim-c8-ethics'],
      answer: false,
      explanation: 'AI 会"一本正经地胡说"——这叫 AI 幻觉。重要的信息要核实。',
    },
    {
      id: 'q-c8l2-as-3',
      type: 'classify',
      title: '判断下面行为是"安全"还是"危险"：',
      score: 15,
      dimensions: ['dim-c8-skill'],
      categories: [
        { id: 'cat-c8-safe',   name: '安全行为' },
        { id: 'cat-c8-danger', name: '危险行为' },
      ],
      items: [
        { id: 'item-c8-1', content: '用 AI 帮我整理学习笔记' },
        { id: 'item-c8-2', content: '把家里的 Wi-Fi 密码发给 AI' },
        { id: 'item-c8-3', content: '让 AI 帮我写作文，但我自己再修改' },
        { id: 'item-c8-4', content: '直接抄 AI 的答案当作业交' },
      ],
      answer: {
        'item-c8-1': 'cat-c8-safe',
        'item-c8-2': 'cat-c8-danger',
        'item-c8-3': 'cat-c8-safe',
        'item-c8-4': 'cat-c8-danger',
      },
      explanation: '直接抄是不诚实，泄露隐私是危险，把 AI 当助手用是安全的。',
    },
  ],
}

const COURSE_AI_SAFETY: Course = {
  id: 'course-08',
  stage: 'primary',
  title: 'AI 安全小课堂',
  description: 'AI 很厉害，但也会"翻车"。学会聪明地用它。',
  gradeRange: '5-6年级',
  cover: 'course-08',
  status: 'published',
  createdAt: '2026-06-05T09:00:00.000Z',
  updatedAt: '2026-06-24T10:00:00.000Z',
  lessons: [
    {
      id: 'lesson-c8-01',
      courseId: 'course-08',
      title: '第一课：AI 也会犯错',
      duration: 25,
      status: 'published',
      order: 1,
      nodes: [
        {
          id: 'node-c8l1-01', lessonId: 'lesson-c8-01', type: 'content', order: 1,
          title: '导入',
          content: '# AI 也会"翻车" 🛡️\n\nAI 看起来无所不知，但它有时候会一本正经地胡说。\n\n更危险的是：你不知道它什么时候在胡说。\n\n这节课，学会**判断 AI**。',
        },
        {
          id: 'node-c8l1-02', lessonId: 'lesson-c8-01', type: 'survey', order: 2,
          title: '你的担心', activityId: ACT_C8L1_SURVEY.id,
        },
      ],
    },
    {
      id: 'lesson-c8-02',
      courseId: 'course-08',
      title: '第二课：三大风险',
      duration: 30,
      status: 'published',
      order: 2,
      nodes: [
        {
          id: 'node-c8l2-01', lessonId: 'lesson-c8-02', type: 'content', order: 1,
          title: 'AI 的三大风险',
          content: '# 安全使用 AI 的三道防线 🚨\n\n## 1. 准确性 — AI 会胡说\n\n**幻觉**：AI 会编造不存在的事实，听起来还很有道理。\n\n→ 对策：重要信息和老师、书本、官方网站对照。\n\n## 2. 隐私 — 别什么都说\n\nAI 对话框里输入的东西，可能被保存、训练。\n\n→ 对策：**绝不**输入家庭地址、密码、证件号。\n\n## 3. 思考力 — 别变成"复读机"\n\n如果什么都让 AI 做，自己的脑子就会"生锈"。\n\n→ 对策：AI 是助手，不是答案机。先自己想，再用 AI 辅助。',
        },
        {
          id: 'node-c8l2-02', lessonId: 'lesson-c8-02', type: 'assessment', order: 2,
          title: '综合测评', activityId: ACT_C8L2_ASSESS.id, completionRequired: true,
        },
      ],
    },
    {
      id: 'lesson-c8-03',
      courseId: 'course-08',
      title: '第三课：聪明地用 AI',
      duration: 20,
      status: 'published',
      order: 3,
      nodes: [
        {
          id: 'node-c8l3-01', lessonId: 'lesson-c8-03', type: 'content', order: 1,
          title: '我的 AI 守则',
          content: '# 聪明用 AI 的 5 个守则 ✋\n\n1. ✅ 先自己想，再问 AI\n2. ✅ 重要信息要核实\n3. ✅ 不输入个人隐私\n4. ✅ AI 给的答案要自己消化\n5. ✅ 用 AI 帮你**变厉害**，不是**变懒**',
        },
        {
          id: 'node-c8l3-02', lessonId: 'lesson-c8-03', type: 'feedback', order: 2,
          title: '结业',
          content: '🎉 完成本课！你已经是个聪明的 AI 用户了。下次用 AI 时，记得这 5 条守则。',
        },
      ],
    },
  ],
}

/* ====================================================================
 * Course 9：AI 的小脑袋（5-6 年级，3 节，进阶）
 * ==================================================================== */

const ACT_C9L1_ASSESS: Activity = {
  id: 'act-c9l1-as',
  type: 'assessment',
  title: '机器学习 · 入门测',
  scoringRule: { totalScore: 20, passScore: 12 },
  dimensions: [{ id: 'dim-c9-base', name: '机器学习概念' }],
  feedbackConfig: { showScore: true, showExplanation: true },
  questions: [
    {
      id: 'q-c9l1-as-1',
      type: 'singleChoice',
      title: '"机器学习"最核心的事情是？',
      score: 10,
      dimensions: ['dim-c9-base'],
      options: [
        { id: 'opt-c9l1-as-1-a', label: 'A', content: '从数据中找规律' },
        { id: 'opt-c9l1-as-1-b', label: 'B', content: '让机器思考人生' },
        { id: 'opt-c9l1-as-1-c', label: 'C', content: '把数据存起来' },
      ],
      answer: 'opt-c9l1-as-1-a',
      explanation: '机器学习 = 数据 + 算法 → 找出规律，做出预测。',
    },
    {
      id: 'q-c9l1-as-2',
      type: 'fillBlank',
      title: '想让 AI 区分猫狗，需要给它喂很多带"标签"的______。',
      score: 10,
      dimensions: ['dim-c9-base'],
      blanks: 1,
      answer: [['数据', '图片', '样本']],
      explanation: '机器学习离不开大量带标注的数据。',
    },
  ],
}

const ACT_C9L2_ASSESS: Activity = {
  id: 'act-c9l2-as',
  type: 'assessment',
  title: '神经网络 · 综合测',
  scoringRule: { totalScore: 35, passScore: 21 },
  dimensions: [
    { id: 'dim-c9-base',   name: '机器学习概念' },
    { id: 'dim-c9-neural', name: '神经网络' },
  ],
  feedbackConfig: { showScore: true, showExplanation: true, showDimensionRadar: true },
  questions: [
    {
      id: 'q-c9l2-as-1',
      type: 'wordCompose',
      title: '把 AI 概念和它的解释配对：',
      score: 20,
      dimensions: ['dim-c9-neural'],
      leftItems: [
        { id: 'wc-c9-L1', content: '机器学习' },
        { id: 'wc-c9-L2', content: '神经网络' },
        { id: 'wc-c9-L3', content: '过拟合' },
        { id: 'wc-c9-L4', content: '训练数据' },
      ],
      rightItems: [
        { id: 'wc-c9-R1', content: '模仿人脑结构的多层计算单元' },
        { id: 'wc-c9-R2', content: '从数据中找规律的方法' },
        { id: 'wc-c9-R3', content: '喂给模型学习的样本' },
        { id: 'wc-c9-R4', content: '模型死记数据，泛化变差' },
      ],
      answer: [
        { leftId: 'wc-c9-L1', rightId: 'wc-c9-R2' },
        { leftId: 'wc-c9-L2', rightId: 'wc-c9-R1' },
        { leftId: 'wc-c9-L3', rightId: 'wc-c9-R4' },
        { leftId: 'wc-c9-L4', rightId: 'wc-c9-R3' },
      ],
      explanation: '这四个是 AI 中最基础的概念组合。',
    },
    {
      id: 'q-c9l2-as-2',
      type: 'shortAnswer',
      title: '请用 2-3 句话讲讲：你觉得 AI 学习和人类学习最大的区别是什么？',
      score: 15,
      dimensions: ['dim-c9-base'],
      answer: '示例：AI 学习靠海量数据 + 算法找规律，人类学习靠少量经验 + 类比和理解。AI 更擅长记忆和模式识别，人类更擅长创造和情感。',
      explanation: '简答题没有标准答案，老师会人工批改。',
    },
  ],
}

const COURSE_AI_BRAIN: Course = {
  id: 'course-09',
  stage: 'primary',
  title: 'AI 的小脑袋：学习的秘密',
  description: '机器学习、神经网络……AI 到底怎么"学"？',
  gradeRange: '5-6年级',
  cover: 'course-09',
  status: 'published',
  createdAt: '2026-06-10T09:00:00.000Z',
  updatedAt: '2026-06-25T11:00:00.000Z',
  lessons: [
    {
      id: 'lesson-c9-01',
      courseId: 'course-09',
      title: '第一课：什么是机器学习',
      duration: 25,
      status: 'published',
      order: 1,
      nodes: [
        {
          id: 'node-c9l1-01', lessonId: 'lesson-c9-01', type: 'content', order: 1,
          title: '导入',
          content: '# AI 怎么"学习" 🧠\n\n你区分猫和狗，看几张图就会了。\nAI 要看几万张图才行。\n\n这种"看图学规律"的本事，就叫 **机器学习**。',
        },
        {
          id: 'node-c9l1-02', lessonId: 'lesson-c9-01', type: 'content', order: 2,
          title: '机器学习三要素',
          content: '# 机器学习 = 数据 + 算法 + 学习 📊\n\n## 数据\n\n大量带"标签"的样本（这是猫、这是狗）\n\n## 算法\n\n找规律的方法（线性回归、决策树、神经网络……）\n\n## 学习过程\n\n模型不断"猜 → 看对错 → 调整"，直到准确率达标。\n\n## 类比：教一只小狗\n\n你拿出一张猫的照片，告诉它"这是猫"。重复 1000 次，它就认识猫了。\n\nAI 也是这样，但要 100 万次。',
        },
        {
          id: 'node-c9l1-03', lessonId: 'lesson-c9-01', type: 'assessment', order: 3,
          title: '入门测', activityId: ACT_C9L1_ASSESS.id, completionRequired: true,
        },
      ],
    },
    {
      id: 'lesson-c9-02',
      courseId: 'course-09',
      title: '第二课：神经网络',
      duration: 30,
      status: 'published',
      order: 2,
      nodes: [
        {
          id: 'node-c9l2-01', lessonId: 'lesson-c9-02', type: 'content', order: 1,
          title: '人脑给我们的灵感',
          content: '# 神经网络 = 人造的"大脑" 🧬\n\n科学家观察人脑：\n\n- 大脑有几百亿个神经元\n- 神经元之间互相连接、传递信号\n- 通过反复练习，连接会变强或变弱\n\n于是有了**神经网络**：\n\n用计算机模拟这种"多层连接 + 信号传递"，让 AI 也能像人一样**层层加工信息**。',
        },
        {
          id: 'node-c9l2-02', lessonId: 'lesson-c9-02', type: 'assessment', order: 2,
          title: '综合测', activityId: ACT_C9L2_ASSESS.id, completionRequired: true,
        },
      ],
    },
    {
      id: 'lesson-c9-03',
      courseId: 'course-09',
      title: '第三课：人和 AI 的学习',
      duration: 20,
      status: 'published',
      order: 3,
      nodes: [
        {
          id: 'node-c9l3-01', lessonId: 'lesson-c9-03', type: 'content', order: 1,
          title: '人 vs AI',
          content: '# 学习方式对比 ⚖️\n\n| 维度 | 人类 | AI |\n|---|---|---|\n| 数据量 | 少量经验 | 海量数据 |\n| 速度 | 慢 | 快 |\n| 灵活性 | 高（举一反三）| 低（只在训练范围内） |\n| 创造力 | 强 | 模仿性强，原创弱 |\n| 情感理解 | 有 | 无（只是模拟）|\n\n**结论**：AI 不是要取代人类，而是要和人类**配合**。',
        },
        {
          id: 'node-c9l3-02', lessonId: 'lesson-c9-03', type: 'feedback', order: 2,
          title: '结业',
          content: '🎉 完成《AI 的小脑袋》全部 3 课！\n\n你已经掌握了 AI 学习的基础原理，可以更自信地理解和使用 AI。',
        },
      ],
    },
  ],
}

export const MOCK_ACTIVITIES: Activity[] = [
  // 课程 1 · 认识 AI 小伙伴
  ACT_C1L1_SURVEY, ACT_C1L1_ASSESS,
  ACT_C1L2_SURVEY, ACT_C1L2_AIPRACTICE, ACT_C1L2_ASSESS,
  ACT_C1L3_SURVEY, ACT_C1L3_ASSESS,
  // 课程 2 · AI 图像识别
  ACT_C2L1_SURVEY,
  ACT_C2L2_ASSESS,
  ACT_C2L3_AIPRACTICE, ACT_C2L3_CLASSIFY,
  ACT_C2L4_FINAL,
  // 课程 3 · AI 的耳朵
  ACT_C3L1_SURVEY, ACT_C3L2_ASSESS, ACT_C3L3_AIPRACTICE,
  // 课程 4 · 和 AI 一起画画
  ACT_C4L1_SURVEY, ACT_C4L2_ASSESS, ACT_C4L3_AIPRACTICE,
  // 课程 5 · 和 AI 聊天
  ACT_C5L1_SURVEY, ACT_C5L2_ASSESS, ACT_C5L3_AIPRACTICE,
  // 课程 6 · 写故事
  ACT_C6L1_SURVEY, ACT_C6L2_ASSESS, ACT_C6L3_AIPRACTICE,
  // 课程 7 · Prompt 密码
  ACT_C7L1_SURVEY, ACT_C7L2_ASSESS, ACT_C7L3_AIPRACTICE,
  // 课程 8 · AI 安全
  ACT_C8L1_SURVEY, ACT_C8L2_ASSESS,
  // 课程 9 · AI 的小脑袋
  ACT_C9L1_ASSESS, ACT_C9L2_ASSESS,
]

/* ====================================================================
 * Junior High Courses (初中课程)
 * ==================================================================== */
const COURSE_JUNIOR_IMAGE: Course = {
  id: 'course-j1',
  title: 'AI图像识别：机器如何看世界',
  description: '深入理解计算机视觉原理，学习图像分类、目标检测的基本概念。',
  stage: 'junior',
  gradeRange: '7-8年级',
  cover: 'course-j1',
  status: 'published',
  createdAt: '2026-05-15T09:00:00.000Z',
  updatedAt: '2026-06-20T14:30:00.000Z',
  lessons: [
    {
      id: 'lesson-j1-01', courseId: 'course-j1',
      title: '第一课：计算机视觉入门',
      description: '了解计算机如何"看见"图片，学习像素、RGB、图像矩阵等基础概念。',
      duration: 40, status: 'published', order: 1,
      nodes: [
        { id: 'node-j1l1-01', lessonId: 'lesson-j1-01', type: 'content', order: 1,
          title: '课程导入',
          content: '# 机器如何看世界\n\n人眼看到的是色彩斑斓的世界，而计算机看到的是一组组数字。让我们一起探索计算机视觉的奥秘。' },
      ],
    },
    {
      id: 'lesson-j1-02', courseId: 'course-j1',
      title: '第二课：图像分类原理',
      description: '学习卷积神经网络（CNN）的基本原理，理解特征提取过程。',
      duration: 45, status: 'published', order: 2,
      nodes: [
        { id: 'node-j1l2-01', lessonId: 'lesson-j1-02', type: 'content', order: 1,
          title: '知识讲解',
          content: '# 图像分类\n\n机器学习如何识别图片内容？通过大量样本训练，AI能提取图像特征并进行分类。' },
      ],
    },
  ],
}

const COURSE_JUNIOR_PROMPT: Course = {
  id: 'course-j2',
  title: 'Prompt表达：和AI高效沟通',
  description: '掌握提示词工程基础，学会编写清晰、有效的AI指令。',
  stage: 'junior',
  gradeRange: '8-9年级',
  cover: 'course-j2',
  status: 'published',
  createdAt: '2026-05-18T09:00:00.000Z',
  updatedAt: '2026-06-22T15:00:00.000Z',
  lessons: [
    {
      id: 'lesson-j2-01', courseId: 'course-j2',
      title: '第一课：什么是Prompt',
      description: '理解提示词的作用，学习基础的prompt编写方法。',
      duration: 40, status: 'published', order: 1,
      nodes: [
        { id: 'node-j2l1-01', lessonId: 'lesson-j2-01', type: 'content', order: 1,
          title: '核心概念',
          content: '# Prompt工程\n\n提示词（Prompt）是我们与AI沟通的桥梁。好的prompt能让AI更准确理解我们的需求。' },
      ],
    },
  ],
}

const COURSE_JUNIOR_ETHICS: Course = {
  id: 'course-j3',
  title: 'AI安全与伦理：可信使用AI',
  description: '学习AI技术的伦理边界，培养负责任的AI使用习惯。',
  stage: 'junior',
  gradeRange: '7-9年级',
  cover: 'course-j3',
  status: 'published',
  createdAt: '2026-05-20T09:00:00.000Z',
  updatedAt: '2026-06-23T10:00:00.000Z',
  lessons: [
    {
      id: 'lesson-j3-01', courseId: 'course-j3',
      title: '第一课：AI伦理基础',
      description: '了解AI可能带来的风险，学习安全使用AI的原则。',
      duration: 40, status: 'published', order: 1,
      nodes: [
        { id: 'node-j3l1-01', lessonId: 'lesson-j3-01', type: 'content', order: 1,
          title: '伦理框架',
          content: '# AI伦理准则\n\nAI技术强大，但也需要负责任地使用。我们要警惕偏见、保护隐私、尊重原创。' },
      ],
    },
  ],
}

/* ====================================================================
 * Senior High Courses (高中课程)
 * ==================================================================== */
const COURSE_SENIOR_GENAI: Course = {
  id: 'course-s1',
  title: '生成式AI应用基础',
  description: '深入理解GPT、Stable Diffusion等生成式AI模型，学习应用场景设计。',
  stage: 'senior',
  gradeRange: '10-11年级',
  cover: 'course-s1',
  status: 'published',
  createdAt: '2026-05-22T09:00:00.000Z',
  updatedAt: '2026-06-24T14:00:00.000Z',
  lessons: [
    {
      id: 'lesson-s1-01', courseId: 'course-s1',
      title: '第一课：生成式AI原理',
      description: '理解Transformer架构，学习大语言模型的工作机制。',
      duration: 50, status: 'published', order: 1,
      nodes: [
        { id: 'node-s1l1-01', lessonId: 'lesson-s1-01', type: 'content', order: 1,
          title: '模型架构',
          content: '# 生成式AI\n\n从GPT到DALL-E，生成式AI正在改变内容创作方式。理解其原理是应用的第一步。' },
      ],
    },
    {
      id: 'lesson-s1-02', courseId: 'course-s1',
      title: '第二课：应用场景设计',
      description: '探索生成式AI在不同领域的应用可能性。',
      duration: 50, status: 'published', order: 2,
      nodes: [
        { id: 'node-s1l2-01', lessonId: 'lesson-s1-02', type: 'content', order: 1,
          title: '应用实践',
          content: '# 应用场景\n\n内容创作、代码辅助、数据分析...生成式AI的应用场景正在快速扩展。' },
      ],
    },
  ],
}

const COURSE_SENIOR_PROJECT: Course = {
  id: 'course-s2',
  title: 'AI项目实践：从问题到方案',
  description: '通过实际项目学习AI产品设计流程，培养问题分析和方案设计能力。',
  stage: 'senior',
  gradeRange: '11-12年级',
  cover: 'course-s2',
  status: 'published',
  createdAt: '2026-05-25T09:00:00.000Z',
  updatedAt: '2026-06-25T15:30:00.000Z',
  lessons: [
    {
      id: 'lesson-s2-01', courseId: 'course-s2',
      title: '第一课：需求分析方法',
      description: '学习如何从真实场景中挖掘AI应用需求。',
      duration: 50, status: 'published', order: 1,
      nodes: [
        { id: 'node-s2l1-01', lessonId: 'lesson-s2-01', type: 'content', order: 1,
          title: '需求挖掘',
          content: '# 从问题到方案\n\n好的AI项目从深刻理解用户需求开始。学会提出正确的问题，比找到答案更重要。' },
      ],
    },
  ],
}

const COURSE_SENIOR_AGENT: Course = {
  id: 'course-s3',
  title: '智能体与自动化工作流入门',
  description: '学习AI Agent概念，掌握基于LLM的自动化工作流设计方法。',
  stage: 'senior',
  gradeRange: '11-12年级',
  cover: 'course-s3',
  status: 'published',
  createdAt: '2026-05-28T09:00:00.000Z',
  updatedAt: '2026-06-26T16:00:00.000Z',
  lessons: [
    {
      id: 'lesson-s3-01', courseId: 'course-s3',
      title: '第一课：智能体基础',
      description: '理解AI Agent的概念、架构和工作原理。',
      duration: 50, status: 'published', order: 1,
      nodes: [
        { id: 'node-s3l1-01', lessonId: 'lesson-s3-01', type: 'content', order: 1,
          title: 'Agent架构',
          content: '# AI智能体\n\nAgent不只是聊天机器人，它能理解任务、规划步骤、调用工具，完成复杂的自动化流程。' },
      ],
    },
  ],
}

/* ====================================================================
 * AI Tool Practice Courses (AI工具练习课程)
 * ==================================================================== */
const COURSE_TOOL_DRAW: Course = {
  id: 'course-t1',
  title: 'AI绘画工具入门',
  description: '实践操作Midjourney、Stable Diffusion等AI绘画工具，掌握提示词技巧。',
  stage: 'tool',
  gradeRange: '全学段',
  cover: 'course-t1',
  status: 'published',
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-27T10:00:00.000Z',
  lessons: [
    {
      id: 'lesson-t1-01', courseId: 'course-t1',
      title: '第一课：AI绘画基础',
      description: '了解主流AI绘画工具，学习基础操作。',
      duration: 30, status: 'published', order: 1,
      nodes: [
        { id: 'node-t1l1-01', lessonId: 'lesson-t1-01', type: 'content', order: 1,
          title: '工具介绍',
          content: '# AI绘画工具\n\n从文字到图像，AI绘画工具让创意表达更简单。让我们从第一张AI画作开始。' },
      ],
    },
  ],
}

const COURSE_TOOL_WRITE: Course = {
  id: 'course-t2',
  title: 'AI写作助手练习',
  description: '学习使用ChatGPT、Claude等工具辅助写作，提升内容创作效率。',
  stage: 'tool',
  gradeRange: '全学段',
  cover: 'course-t2',
  status: 'published',
  createdAt: '2026-06-03T09:00:00.000Z',
  updatedAt: '2026-06-28T11:00:00.000Z',
  lessons: [
    {
      id: 'lesson-t2-01', courseId: 'course-t2',
      title: '第一课：AI辅助写作',
      description: '探索AI在写作中的应用场景。',
      duration: 30, status: 'published', order: 1,
      nodes: [
        { id: 'node-t2l1-01', lessonId: 'lesson-t2-01', type: 'content', order: 1,
          title: '写作场景',
          content: '# AI写作助手\n\n头脑风暴、大纲构思、润色修改...AI能在写作的每个环节提供帮助。' },
      ],
    },
  ],
}

const COURSE_TOOL_AGENT: Course = {
  id: 'course-t3',
  title: 'AI智能体任务体验',
  description: '动手实践配置简单的AI智能体，完成自动化任务。',
  stage: 'tool',
  gradeRange: '全学段',
  cover: 'course-t3',
  status: 'published',
  createdAt: '2026-06-05T09:00:00.000Z',
  updatedAt: '2026-06-29T12:00:00.000Z',
  lessons: [
    {
      id: 'lesson-t3-01', courseId: 'course-t3',
      title: '第一课：配置你的第一个Agent',
      description: '从零开始构建一个简单的任务自动化流程。',
      duration: 40, status: 'published', order: 1,
      nodes: [
        { id: 'node-t3l1-01', lessonId: 'lesson-t3-01', type: 'content', order: 1,
          title: '实践操作',
          content: '# 动手实践\n\n理论结合实践，让我们配置第一个AI智能体，体验自动化工作流的魅力。' },
          ],
    },
  ],
}
export const MOCK_COURSES: Course[] = [
  // 小学课程
  COURSE_AI_FRIEND,
  COURSE_IMAGE_REC,
  COURSE_AI_EAR,
  COURSE_AI_DRAW,
  COURSE_AI_MOUTH,
  COURSE_AI_STORY,
  COURSE_PROMPT,
  COURSE_AI_SAFETY,
  COURSE_AI_BRAIN,
  // 初中课程
  COURSE_JUNIOR_IMAGE,
  COURSE_JUNIOR_PROMPT,
  COURSE_JUNIOR_ETHICS,
  // 高中课程
  COURSE_SENIOR_GENAI,
  COURSE_SENIOR_PROJECT,
  COURSE_SENIOR_AGENT,
  // AI工具练习
  COURSE_TOOL_DRAW,
  COURSE_TOOL_WRITE,
  COURSE_TOOL_AGENT,
]

/* ============================================================
 * 课程主题图标 + 渐变背景配置
 * 保留旧字段名，让 CourseCover 仍可用
 * ============================================================ */
export const COURSE_VISUAL: Record<
  string,
  { emoji: string; gradient: string; symbol: string }
> = {
  // 小学课程
  'course-01': { emoji: '🤖', gradient: 'from-orange-300 to-orange-500', symbol: 'AI' },
  'course-02': { emoji: '👁️', gradient: 'from-rose-300 to-rose-500',     symbol: '看' },
  'course-03': { emoji: '👂', gradient: 'from-amber-300 to-amber-500',   symbol: '听' },
  'course-04': { emoji: '🎨', gradient: 'from-pink-300 to-pink-500',     symbol: '画' },
  'course-05': { emoji: '💬', gradient: 'from-violet-300 to-violet-500', symbol: '说' },
  'course-06': { emoji: '📖', gradient: 'from-sky-300 to-sky-500',       symbol: '写' },
  'course-07': { emoji: '🔑', gradient: 'from-emerald-300 to-emerald-500', symbol: 'Pr' },
  'course-08': { emoji: '🛡️', gradient: 'from-red-300 to-red-500',       symbol: '安' },
  'course-09': { emoji: '🧠', gradient: 'from-indigo-300 to-indigo-500', symbol: '脑' },
  // 初中课程
  'course-j1': { emoji: '🔍', gradient: 'from-blue-400 to-blue-600',     symbol: '视' },
  'course-j2': { emoji: '✍️', gradient: 'from-purple-400 to-purple-600', symbol: 'P' },
  'course-j3': { emoji: '⚖️', gradient: 'from-green-400 to-green-600',   symbol: '伦' },
  // 高中课程
  'course-s1': { emoji: '🌟', gradient: 'from-cyan-500 to-cyan-700',     symbol: 'Gen' },
  'course-s2': { emoji: '🚀', gradient: 'from-teal-500 to-teal-700',     symbol: '项' },
  'course-s3': { emoji: '🤝', gradient: 'from-slate-500 to-slate-700',   symbol: 'Agt' },
  // AI工具练习
  'course-t1': { emoji: '🎨', gradient: 'from-pink-400 to-pink-600',     symbol: '绘' },
  'course-t2': { emoji: '📝', gradient: 'from-amber-400 to-amber-600',   symbol: '写' },
  'course-t3': { emoji: '⚙️', gradient: 'from-gray-400 to-gray-600',     symbol: '智' },
}

/**
 * 课程线性图标映射（courseId → Icon name）
 * 用于新版 CourseCover（线性插画风，替代 emoji）
 */
export const COURSE_ICON: Record<string, string> = {
  'course-01': 'robot',   // 认识 AI
  'course-02': 'vision',  // 看（图像识别）
  'course-03': 'chat',    // 听（语音）
  'course-04': 'palette', // 画（创作）
  'course-05': 'chat',    // 说（对话）
  'course-06': 'bulb',    // 写
  'course-07': 'wand',    // Prompt
  'course-08': 'shield',  // 安全
  'course-09': 'cpu',     // 大脑 / 原理
  'course-j1': 'vision',  // 视觉
  'course-j2': 'wand',    // Prompt
  'course-j3': 'shield',  // 伦理
  'course-s1': 'wand',    // 生成式
  'course-s2': 'cpu',     // 项目
  'course-s3': 'robot',   // Agent
  'course-t1': 'palette', // 绘画
  'course-t2': 'bulb',    // 写作
  'course-t3': 'cpu',     // 智能体
}

/** 内部使用：所有 question 的快速索引 */
export function getAllQuestions() {
  return MOCK_ACTIVITIES.flatMap((a) => a.questions ?? [])
}

