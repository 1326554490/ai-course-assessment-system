/**
 * 题型元数据（单一数据源）
 *
 * 蒸馏自 Figma 原型「AI课程题型模板设计」各题型的"适配规则"，
 * 给教师端配置面板提供：分组、一句话定位、适用提示、交叉引导。
 *
 * 不在题目 schema 里，纯展示用，避免污染数据结构。
 */
import type { QuestionType } from '@/types'

/** 题型分组（用于选择器 optgroup / 添加菜单分组） */
export type QuestionGroup = 'choice' | 'text' | 'interactive' | 'express'

export const QUESTION_GROUP_LABEL: Record<QuestionGroup, string> = {
  choice: '选择判断类',
  text: '填空文本类',
  interactive: '拖拽操作类',
  express: '互动表达类',
}

export interface QuestionMeta {
  /** 所属分组 */
  group: QuestionGroup
  /** 小图标（emoji，低保真够用） */
  icon: string
  /** 一句话定位 */
  tagline: string
  /** 适用场景提示（正面） */
  fit: string
  /** 交叉引导：什么时候应该改用别的题型 */
  redirect?: string
}

export const QUESTION_META: Record<QuestionType, QuestionMeta> = {
  singleChoice: {
    group: 'choice',
    icon: '◉',
    tagline: '从多个选项中选一个正确答案',
    fit: '考查基础概念、事实、原理的准确记忆与识别。推荐 2–4 个选项。',
    redirect: '需要选多个 → 多选题；只需判断对错 → 判断题。',
  },
  multipleChoice: {
    group: 'choice',
    icon: '◎',
    tagline: '从多个选项中选出全部正确项',
    fit: '考查对一组特征/要素的完整掌握。可设全对得分或部分得分。',
    redirect: '只有一个正确答案 → 单选题。',
  },
  judge: {
    group: 'choice',
    icon: '✓',
    tagline: '判断一句陈述是否正确',
    fit: '快速核查概念、辨析常见误区。适合课堂即时反馈。',
    redirect: '有多个候选 → 单选/多选题。',
  },
  fillBlank: {
    group: 'text',
    icon: '▁',
    tagline: '填写固定的关键词、术语、短语',
    fit: '答案相对固定、可机器评分。单空答案建议 ≤ 30 字。',
    redirect: '需要大段解释 → 简答题；下拉选词 → 单选题。',
  },
  shortAnswer: {
    group: 'text',
    icon: '¶',
    tagline: '开放性作答，需教师或 AI 评分',
    fit: '考查理解、分析、反思与表达。支持长短文、结构化字段、AI 辅助。',
    redirect: '答案是固定关键词 → 填空题。',
  },
  sort: {
    group: 'interactive',
    icon: '↕',
    tagline: '把若干项拖拽成正确顺序',
    fit: '考查步骤、流程、时间线、大小等顺序关系。逐位比对给部分分。',
    redirect: '只是归类不讲顺序 → 分类题。',
  },
  classify: {
    group: 'interactive',
    icon: '▦',
    tagline: '把多个项目归入对应类别',
    fit: '考查概念归属、特征辨析。推荐 2–4 类、4–10 个待分类项。',
    redirect: '讲先后顺序 → 排序题；一对一对应 → 词组选配题。',
  },
  wordCompose: {
    group: 'interactive',
    icon: '⇄',
    tagline: '把左右两列正确配对',
    fit: '考查一对一对应关系，如术语↔释义、概念↔示例。',
    redirect: '一个对象归入某一类 → 分类题。',
  },
  ratingScale: {
    group: 'express',
    icon: '★',
    tagline: '星级 / 量表打分，表达程度',
    fit: '问卷用：收集满意度、喜好、难易感受等程度类反馈。不计分。',
    redirect: '需要选具体选项 → 单选/多选题。',
  },
  workUpload: {
    group: 'express',
    icon: '⤒',
    tagline: '上传作品文件 + 文字说明',
    fit: '问卷用：收集学生作品、截图、文档等。不计分。',
    redirect: '只需文字回答 → 简答题。',
  },
  knowledgeReview: {
    group: 'express',
    icon: '❑',
    tagline: '课后知识复盘卡片（不计分）',
    fit: '测评用：翻转卡片 / 点击揭示 / 列表，帮学生回顾要点。只记录已查看。',
    redirect: '需要作答检测 → 单选/判断/填空题。',
  },
  promptPractice: {
    group: 'express',
    icon: '⌨',
    tagline: '按结构提示编写 Prompt',
    fit: '测评用：训练写提示词，给任务目标+结构提示+示例。需教师/AI 评。',
    redirect: '只是开放问答 → 简答题。',
  },
  materialGroup: {
    group: 'choice',
    icon: '▤',
    tagline: '一段材料 + 多个单选子题',
    fit: '阅读材料/案例后连答几道单选。逐子题判分、按占比给分。',
    redirect: '只有一道小题 → 直接用单选题。',
  },
}

/** 按分组返回题型列表（保持稳定顺序） */
export function groupedTypes(allowed: QuestionType[]): {
  group: QuestionGroup
  label: string
  types: QuestionType[]
}[] {
  const order: QuestionGroup[] = ['choice', 'text', 'interactive', 'express']
  return order
    .map((g) => ({
      group: g,
      label: QUESTION_GROUP_LABEL[g],
      types: allowed.filter((t) => QUESTION_META[t].group === g),
    }))
    .filter((x) => x.types.length > 0)
}
