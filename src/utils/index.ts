/**
 * 工具函数集合
 */

export * from './answer'
export * from './storage'

/**
 * 生成唯一 ID
 */
export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 百分比格式化
 */
export function pct(val: number, decimals = 1): string {
  return `${(val * 100).toFixed(decimals)}%`
}

/**
 * 格式化日期时间
 */
export function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  const Y = d.getFullYear()
  const M = String(d.getMonth() + 1).padStart(2, '0')
  const D = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${Y}-${M}-${D} ${h}:${m}`
}

/**
 * 格式化时长（秒 → 分秒）
 */
export function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m === 0) return `${s}秒`
  return `${m}分${s}秒`
}

/**
 * 相对时间格式化
 */
export function fmtRelative(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = now - then
  const sec = Math.floor(diff / 1000)
  const min = Math.floor(sec / 60)
  const hour = Math.floor(min / 60)
  const day = Math.floor(hour / 24)

  if (day > 0) return `${day}天前`
  if (hour > 0) return `${hour}小时前`
  if (min > 0) return `${min}分钟前`
  return '刚刚'
}

/**
 * 从节点解析完整信息（注入 activity 数据）
 */
export function resolveNode(node: any): any {
  // 简化实现：直接返回节点，实际项目中会注入 activity 数据
  return node
}

/**
 * 学生诊断（计算维度掌握度、错题分析等）
 */
export function diagnoseStudent(
  studentId: string,
  submissions: any[],
  courses: any[],
  activities: any[]
): any {
  const studentSubs = submissions.filter(s => s.studentId === studentId)

  // 计算总分、正确率
  let totalQuestions = 0
  let correctAnswers = 0
  studentSubs.forEach(sub => {
    sub.answers?.forEach((ans: any) => {
      totalQuestions++
      if (ans.correct) correctAnswers++
    })
  })

  // 收集错题
  const wrongList: any[] = []
  studentSubs.forEach(sub => {
    // 找到对应的课程和课节
    const course = courses.find(c => c.id === sub.courseId)
    const lesson = course?.lessons.find((l: any) => l.id === sub.lessonId)

    sub.answers?.forEach((ans: any) => {
      if (!ans.correct) {
        wrongList.push({
          submissionId: sub.id,
          question: ans,
          questionId: ans.questionId,
          questionTitle: ans.title || '未命名题目',
          questionType: ans.type || 'unknown',
          courseId: sub.courseId,
          lessonId: sub.lessonId,
          courseTitle: course?.title || '未知课程',
          lessonTitle: lesson?.title || '未知课节',
          submittedAt: sub.submittedAt || new Date().toISOString(),
          studentAnswer: ans.value,
          correctAnswer: ans.answer,
        })
      }
    })
  })

  return {
    totalSubmissions: studentSubs.length,
    assessmentCount: studentSubs.filter((s: any) => s.type === 'assessment').length,
    avgScore: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
    avgCorrectRate: totalQuestions > 0 ? correctAnswers / totalQuestions : 0,
    wrongCount: wrongList.length,
    wrongList: wrongList,
    dimensions: [],
    suggestions: [],
    advices: [], // 添加 advices 别名
  }
}

/**
 * 错题项类型
 */
export interface WrongQuestionItem {
  questionId: string
  questionTitle: string
  questionType: string
  courseTitle: string
  lessonTitle: string
  submittedAt: string
  studentAnswer: any
  correctAnswer: any
}

/**
 * 从文本提取题目
 */
export function extractFromText(text: string): any[] {
  // 简化实现：返回空数组
  return []
}

/**
 * 从文件名提取信息
 */
export function extractFromFileName(fileName: string): { title?: string; type?: string } {
  return { title: fileName }
}

/**
 * 学段视觉配置
 */
export const stageVisual = {
  primary: { label: '小学', color: '#3B82F6' },
  junior: { label: '初中', color: '#8B5CF6' },
  senior: { label: '高中', color: '#EC4899' },
  tool: { label: 'AI工具', color: '#10B981' },
}
