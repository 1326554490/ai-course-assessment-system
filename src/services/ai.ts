/**
 * AI 服务层（接口占位）
 *
 * 设计意图：把"AI 配题""课件解析"等能力收敛到一个服务层，
 * 对外暴露的函数签名 = 未来真实后端 API 的形状。
 * 现在函数体走本地逻辑 + 模拟网络延迟；将来只需把函数体换成
 * fetch('/api/...')，所有调用方（页面）无需改动。
 *
 * 真实后端约定（占位，便于将来对接）：
 *   POST /api/ai/generate-questions   body: GenerateRequest  → GenerateResult
 *   POST /api/ai/parse-courseware     multipart: file        → ParseResult
 */

import { uid } from '@/utils'
import type { Question, QuestionType } from '@/types'

/* ============================================================
 * 类型定义（对齐未来真实 API 的请求/响应形状）
 * ============================================================ */

export interface GenerateRequest {
  /** 课程主题 */
  topic: string
  /** 识别出的知识点 */
  knowledge: string[]
  /** 出题模式 */
  mode: 'survey' | 'assessment'
  /** 允许的题型范围（用户在向导里勾选） */
  allowedTypes: QuestionType[]
  /** 题目数量 */
  count: number
  /** 难度 */
  difficulty: 'basic' | 'normal' | 'challenge'
  /** 是否生成解析 */
  withExplanation: boolean
  /** 维度标签（可选，轮流挂到题目上） */
  dimensions?: string[]
}

export interface GenerateResult {
  questions: Question[]
  /** 生成元信息（真实 API 会返回 token 用量等，这里占位） */
  meta: {
    requestedCount: number
    generatedCount: number
    /** 每个知识点分到的题型，便于向导展示"为什么这么出" */
    plan: { knowledge: string; type: QuestionType }[]
  }
}

export interface ParseResult {
  topic: string
  grade: string
  knowledge: string[]
  /** 解析来源：text=粘贴文本(真实抽取)；filename=仅文件名(待后端) */
  source: 'text' | 'filename'
}

/* 模拟网络延迟 */
function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/* PLACEHOLDER_SMART_LOGIC */

/* ============================================================
 * 智能配题：按知识点性质分配题型 + 难度梯度
 * ============================================================ */

/**
 * 按知识点文本特征推断"最适合的题型优先级"。
 * 测评类：
 * - 复盘/回顾/总结/易错/小结 → 知识回顾
 * - Prompt/提示词/指令/AI 对话/生成式 → Prompt 练习
 * - 流程/步骤/过程/先…后 → 排序
 * - 区别/分类/类型/对应 → 分类、词组选配、多选
 * - 应用/举例/为什么/理解 → 简答
 * - 包含/要素/特征/哪些 → 多选
 * - 概念/定义/是什么（兜底）→ 单选、判断、填空
 * 问卷类：
 * - 作品/创作/设计/画/上传 → 作品上传
 * - 满意/感受/喜欢/评价/难易/兴趣 → 星级量表
 *
 * 注：最终会与「用户允许题型」取交集，所以这里大胆按语义推荐即可。
 */
function preferredTypes(kp: string): QuestionType[] {
  const t = kp
  // —— 测评特色题型优先匹配 ——
  if (/复盘|回顾|总结|小结|易错|要点梳理|知识点回顾/.test(t)) return ['knowledgeReview', 'shortAnswer', 'singleChoice']
  if (/prompt|提示词|指令|AI ?对话|生成式|大模型|提问/i.test(t)) return ['promptPractice', 'shortAnswer']
  // —— 问卷特色题型 ——
  if (/作品|创作|设计|绘画|画作|上传|提交.*作品/.test(t)) return ['workUpload', 'shortAnswer']
  if (/满意|感受|喜欢|喜爱|评价|难易|难度|兴趣|意愿|偏好/.test(t)) return ['ratingScale', 'singleChoice']
  // —— 通用测评题型 ——
  if (/步骤|流程|过程|顺序|先.*后|阶段/.test(t)) return ['sort', 'singleChoice', 'judge']
  if (/区别|分类|类型|归类|对应|配对|匹配/.test(t)) return ['classify', 'wordCompose', 'multipleChoice']
  if (/应用|举例|例子|为什么|影响|理解|意义|作用|看法/.test(t)) return ['shortAnswer', 'singleChoice']
  if (/包含|要素|组成|特征|哪些/.test(t)) return ['multipleChoice', 'singleChoice']
  // 概念/定义/是什么，或无明显特征
  return ['singleChoice', 'judge', 'fillBlank']
}

/** 难度 → 分值 */
function scoreOf(difficulty: GenerateRequest['difficulty']): number {
  return difficulty === 'basic' ? 5 : difficulty === 'challenge' ? 15 : 10
}

/**
 * 为每道题挑题型：在「该知识点偏好题型」与「用户允许题型」的交集里选，
 * 并尽量避免同一知识点连续重复同题型。
 */
function pickType(
  kp: string,
  allowed: QuestionType[],
  usedForKp: Set<string>,
): QuestionType {
  const prefs = preferredTypes(kp).filter((t) => allowed.includes(t))
  const pool = prefs.length > 0 ? prefs : allowed
  // 优先选该知识点还没用过的题型
  const fresh = pool.find((t) => !usedForKp.has(`${kp}::${t}`))
  return fresh ?? pool[0] ?? 'singleChoice'
}

function buildSmartQuestions(req: GenerateRequest): GenerateResult {
  const isAssess = req.mode === 'assessment'
  const score = scoreOf(req.difficulty)
  const kps = req.knowledge.length > 0 ? req.knowledge : [req.topic || '本节知识']
  const allowed = req.allowedTypes.length > 0 ? req.allowedTypes : (['singleChoice'] as QuestionType[])

  const questions: Question[] = []
  const plan: { knowledge: string; type: QuestionType }[] = []
  const usedForKp = new Set<string>()

  for (let i = 0; i < req.count; i++) {
    const kp = kps[i % kps.length]
    const type = pickType(kp, allowed, usedForKp)
    usedForKp.add(`${kp}::${type}`)
    plan.push({ knowledge: kp, type })

    const dim =
      req.dimensions && req.dimensions.length
        ? [req.dimensions[i % req.dimensions.length]]
        : undefined

    const base: any = {
      id: uid('q'),
      type,
      title: titleFor(type, kp),
      ...(isAssess ? { score } : {}),
      ...(dim ? { dimensions: dim } : {}),
      ...(isAssess && req.withExplanation
        ? { explanation: `本题考查「${kp}」。${explanationFor(type)}` }
        : {}),
    }
    questions.push(fillByType(type, base, isAssess))
  }

  return {
    questions,
    meta: { requestedCount: req.count, generatedCount: questions.length, plan },
  }
}

/* ---- 题干 / 解析 / 题体填充（从向导迁入，按知识点动态） ---- */
function titleFor(t: QuestionType, kp: string): string {
  switch (t) {
    case 'singleChoice':   return `关于「${kp}」，下列说法最准确的是？`
    case 'multipleChoice': return `关于「${kp}」，以下哪些说法正确？（多选）`
    case 'judge':          return `判断：${kp}。这一说法是否正确？`
    case 'fillBlank':      return `请填空：${kp}中，最关键的概念是 ______。`
    case 'shortAnswer':    return `请结合「${kp}」，用自己的话谈谈你的理解。`
    case 'sort':           return `请将与「${kp}」相关的步骤排成正确顺序：`
    case 'classify':       return `请将下列内容按「${kp}」涉及的类别分类：`
    case 'wordCompose':    return `请将「${kp}」相关的概念与解释配对：`
    case 'knowledgeReview': return `知识回顾：「${kp}」要点复盘`
    case 'promptPractice':  return `Prompt 练习：围绕「${kp}」写一段提示词`
    case 'ratingScale':     return `你对「${kp}」的掌握 / 满意程度如何？`
    case 'workUpload':      return `请上传与「${kp}」相关的作品`
    default:               return `关于「${kp}」的题目`
  }
}

function explanationFor(t: QuestionType): string {
  switch (t) {
    case 'sort':        return '注意各步骤之间的先后逻辑关系。'
    case 'classify':    return '按对象的本质特征归入对应类别。'
    case 'wordCompose': return '逐一对应概念与其解释。'
    case 'shortAnswer': return '关注关键概念与实际联系，言之有理即可。'
    case 'promptPractice': return '检查是否写清了角色、任务与要求。'
    default:            return '回顾本知识点的核心定义即可作答。'
  }
}

function fillByType(t: QuestionType, base: any, isAssess: boolean): Question {
  switch (t) {
    case 'singleChoice':
      return {
        ...base,
        options: [
          { id: uid('o'), label: 'A', content: '（请在配置中心补全为正确选项）' },
          { id: uid('o'), label: 'B', content: '干扰项 1' },
          { id: uid('o'), label: 'C', content: '干扰项 2' },
        ],
        answer: isAssess ? undefined : null,
      } as unknown as Question
    case 'multipleChoice':
      return {
        ...base,
        options: [
          { id: uid('o'), label: 'A', content: '正确要点 1' },
          { id: uid('o'), label: 'B', content: '正确要点 2' },
          { id: uid('o'), label: 'C', content: '干扰项' },
          { id: uid('o'), label: 'D', content: '正确要点 3' },
        ],
        answer: [],
        scoreMode: 'partial',
      } as unknown as Question
    case 'judge':
      return { ...base, answer: isAssess ? false : null } as unknown as Question
    case 'fillBlank':
      return {
        ...base,
        blanks: 1,
        fillStyle: 'single',
        answer: isAssess ? [['（待补全标准答案）']] : [[]],
      } as unknown as Question
    case 'shortAnswer':
      return {
        ...base,
        shortStyle: 'long',
        minLength: 30,
        maxLength: 200,
        ...(isAssess ? { answer: '（评分要点：待教师补全）', gradeMode: 'manual' } : {}),
      } as unknown as Question
    case 'sort':
      return {
        ...base,
        items: [
          { id: uid('s'), content: '步骤一' },
          { id: uid('s'), content: '步骤二' },
          { id: uid('s'), content: '步骤三' },
          { id: uid('s'), content: '步骤四' },
        ],
        answer: [],
      } as unknown as Question
    case 'classify':
      return {
        ...base,
        categories: [
          { id: uid('c'), name: '类别 A' },
          { id: uid('c'), name: '类别 B' },
        ],
        items: [
          { id: uid('it'), content: '待分类项 1' },
          { id: uid('it'), content: '待分类项 2' },
        ],
        answer: {},
      } as unknown as Question
    case 'wordCompose':
      return {
        ...base,
        leftItems: [
          { id: uid('l'), content: '概念 1' },
          { id: uid('l'), content: '概念 2' },
        ],
        rightItems: [
          { id: uid('r'), content: '解释 1' },
          { id: uid('r'), content: '解释 2' },
        ],
        answer: [],
      } as unknown as Question
    case 'knowledgeReview':
      return {
        ...base,
        score: undefined, // 知识回顾不计分
        reviewStyle: 'flip',
        cards: [
          { id: uid('rc'), front: '核心概念', back: '（请补全这一概念的解释）' },
          { id: uid('rc'), front: '常见易错点', back: '（请补全易错点说明）' },
        ],
      } as unknown as Question
    case 'promptPractice':
      return {
        ...base,
        goal: '围绕本知识点写一段提示词，让 AI 给出你想要的结果。',
        structure: ['角色', '任务', '要求'],
        example: '',
        answer: '评分要点：是否设定角色、说清任务、给出格式或字数要求。',
      } as unknown as Question
    case 'ratingScale':
      return {
        ...base,
        score: undefined,
        max: 5,
        style: 'star',
        labels: ['完全不了解', '完全掌握'],
      } as unknown as Question
    case 'workUpload':
      return {
        ...base,
        score: undefined,
        accept: '图片 / PDF',
        needNote: true,
        uploadHint: '上传你的作品，并简单说明你的思路。',
      } as unknown as Question
    default:
      return base as Question
  }
}

/* ============================================================
 * 对外 API（占位）
 * ============================================================ */

/**
 * 根据课程内容生成题目。
 * 现在：本地智能分配逻辑 + 模拟延迟。
 * 将来：
 *   const res = await fetch('/api/ai/generate-questions', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(req),
 *   })
 *   return res.json()
 */
export async function generateQuestions(req: GenerateRequest): Promise<GenerateResult> {
  await delay(1000)
  return buildSmartQuestions(req)
}
