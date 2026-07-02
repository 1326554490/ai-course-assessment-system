/**
 * 应用级数据初始化 / 读取
 *
 * 数据模型已迁移到课程化结构（Course / Lesson / LessonNode / Activity / StudentSubmission）。
 * 旧的 Form / Submission（按 formId 索引）相关 API 仅作为空实现保留兼容性，新页面不要再用。
 */
import type {
  ClassInfo,
  Form,
  Student,
  StudentSubmission,
  Course,
  StudentProgress,
  Activity,
} from '@/types'
import {
  MOCK_CLASSES,
  MOCK_COURSES,
  MOCK_FORMS,
  MOCK_NODE_SUBMISSIONS,
  MOCK_PROGRESS,
  MOCK_STUDENTS,
} from '@/mock'
import { MOCK_ACTIVITIES } from '@/mock/courses'
import { LS_KEYS, SCHEMA_VERSION, readLS, writeLS } from '@/utils/storage'

export function bootstrap(): void {
  const ver = readLS<number | null>(LS_KEYS.schemaVersion, null)
  const stale = ver !== SCHEMA_VERSION

  if (stale || readLS<Form[] | null>(LS_KEYS.forms, null) == null) {
    writeLS(LS_KEYS.forms, MOCK_FORMS)
  }
  if (stale || readLS<Student[] | null>(LS_KEYS.students, null) == null) {
    writeLS(LS_KEYS.students, MOCK_STUDENTS)
  }
  if (stale || readLS<ClassInfo[] | null>(LS_KEYS.classes, null) == null) {
    writeLS(LS_KEYS.classes, MOCK_CLASSES)
  }
  if (stale || readLS<Course[] | null>(LS_KEYS.courses, null) == null) {
    writeLS(LS_KEYS.courses, MOCK_COURSES)
  }
  if (stale || readLS<Activity[] | null>(LS_KEYS.activities, null) == null) {
    writeLS(LS_KEYS.activities, MOCK_ACTIVITIES)
  }
  if (stale || readLS<StudentSubmission[] | null>(LS_KEYS.nodeSubmissions, null) == null) {
    writeLS<StudentSubmission[]>(LS_KEYS.nodeSubmissions, MOCK_NODE_SUBMISSIONS)
  }
  if (stale || readLS<StudentProgress[] | null>(LS_KEYS.progress, null) == null) {
    writeLS<StudentProgress[]>(LS_KEYS.progress, MOCK_PROGRESS)
  }
  writeLS(LS_KEYS.schemaVersion, SCHEMA_VERSION)
}

/* ============================================================
 * 旧 Form 相关（已废弃 - 仅保留空实现）
 * ============================================================ */
/** @deprecated 旧 Form 模型 → 改用 Activity */
export function getForms(): Form[] {
  return readLS<Form[]>(LS_KEYS.forms, MOCK_FORMS)
}
/** @deprecated */
export function saveForms(list: Form[]): void {
  writeLS(LS_KEYS.forms, list)
}

export function getStudents(): Student[] {
  return readLS<Student[]>(LS_KEYS.students, MOCK_STUDENTS)
}
export function getClasses(): ClassInfo[] {
  return readLS<ClassInfo[]>(LS_KEYS.classes, MOCK_CLASSES)
}

/* ============================================================
 * 课程
 * ============================================================ */

// 预置示例课程 id（用于区分"系统示例"与"教师新建"，不用于过滤）
const CORE_COURSE_IDS = [
  'course-01', // 认识 AI 小伙伴
  'course-02', // AI 图像识别
  'course-03', // AI 的耳朵
  'course-j1',  // 初中：图像识别
  'course-s1',  // 高中：生成式AI
  'course-t1',  // 工具：AI绘画
]

export function isCoreCourse(id: string): boolean {
  return CORE_COURSE_IDS.includes(id)
}

export function getCourses(): Course[] {
  // 返回全部课程：6 门系统示例 + 教师新建的课程
  // （新建课程 id 为随机 uid，曾因这里按 CORE_COURSE_IDS 过滤而"消失"，已修复）
  return readLS<Course[]>(LS_KEYS.courses, MOCK_COURSES)
}
export function getCourseById(id: string): Course | undefined {
  return getCourses().find((c) => c.id === id)
}
export function saveCourses(list: Course[]): void {
  writeLS(LS_KEYS.courses, list)
}
export function saveCourse(course: Course): void {
  const list = getCourses()
  const idx = list.findIndex((c) => c.id === course.id)
  const next = { ...course, updatedAt: new Date().toISOString() }
  if (idx === -1) list.push(next)
  else list[idx] = next
  saveCourses(list)
}

/* ============================================================
 * Activity（独立管理，被节点通过 activityId 引用）
 * ============================================================ */
export function getActivities(): Activity[] {
  return readLS<Activity[]>(LS_KEYS.activities, MOCK_ACTIVITIES)
}
export function getActivityById(id: string): Activity | undefined {
  return getActivities().find((a) => a.id === id)
}
export function saveActivities(list: Activity[]): void {
  writeLS(LS_KEYS.activities, list)
}
export function saveActivity(activity: Activity): void {
  const list = getActivities()
  const idx = list.findIndex((a) => a.id === activity.id)
  if (idx === -1) list.push(activity)
  else list[idx] = activity
  saveActivities(list)
}

/* ============================================================
 * 学习进度（每个学生 × 每节课一条记录）
 * ============================================================ */
function readAllProgress(): StudentProgress[] {
  return readLS<StudentProgress[]>(LS_KEYS.progress, [])
}
function writeAllProgress(list: StudentProgress[]) {
  writeLS(LS_KEYS.progress, list)
}

export function getProgress(
  studentId: string,
  courseId: string,
  lessonId: string,
): StudentProgress | undefined {
  return readAllProgress().find(
    (p) => p.studentId === studentId && p.courseId === courseId && p.lessonId === lessonId,
  )
}

export function markNodeCompleted(
  studentId: string,
  courseId: string,
  lessonId: string,
  nodeId: string,
): void {
  const list = readAllProgress()
  const idx = list.findIndex(
    (p) => p.studentId === studentId && p.courseId === courseId && p.lessonId === lessonId,
  )
  const now = new Date().toISOString()
  if (idx === -1) {
    list.push({
      studentId, courseId, lessonId,
      currentNodeId: nodeId,
      completedNodeIds: [nodeId],
      lastStudyAt: now,
    })
  } else {
    const p = list[idx]
    if (!p.completedNodeIds.includes(nodeId)) {
      p.completedNodeIds = [...p.completedNodeIds, nodeId]
    }
    p.currentNodeId = nodeId
    p.lastStudyAt = now
    list[idx] = p
  }
  writeAllProgress(list)
}

export function setCurrentNode(
  studentId: string,
  courseId: string,
  lessonId: string,
  nodeId: string,
): void {
  const list = readAllProgress()
  const idx = list.findIndex(
    (p) => p.studentId === studentId && p.courseId === courseId && p.lessonId === lessonId,
  )
  const now = new Date().toISOString()
  if (idx === -1) {
    list.push({
      studentId, courseId, lessonId,
      currentNodeId: nodeId,
      completedNodeIds: [],
      lastStudyAt: now,
    })
  } else {
    list[idx] = { ...list[idx], currentNodeId: nodeId, lastStudyAt: now }
  }
  writeAllProgress(list)
}

export function getCourseProgressRate(studentId: string, courseId: string): number {
  const course = getCourseById(courseId)
  if (!course || course.lessons.length === 0) return 0
  const allNodes = course.lessons.flatMap((l) => l.nodes)
  if (allNodes.length === 0) return 0
  const allProgress = readAllProgress().filter(
    (p) => p.studentId === studentId && p.courseId === courseId,
  )
  const completedSet = new Set<string>()
  allProgress.forEach((p) => p.completedNodeIds.forEach((id) => completedSet.add(id)))
  return completedSet.size / allNodes.length
}

export function getLastStudyInCourse(
  studentId: string,
  courseId: string,
): { lessonId: string; nodeId: string; lastStudyAt: string } | undefined {
  const ps = readAllProgress()
    .filter((p) => p.studentId === studentId && p.courseId === courseId)
    .sort((a, b) => +new Date(b.lastStudyAt) - +new Date(a.lastStudyAt))
  if (ps.length === 0) return undefined
  const p = ps[0]
  return { lessonId: p.lessonId, nodeId: p.currentNodeId, lastStudyAt: p.lastStudyAt }
}

export function getRecentStudyByStudent(studentId: string): StudentProgress[] {
  return readAllProgress()
    .filter((p) => p.studentId === studentId)
    .sort((a, b) => +new Date(b.lastStudyAt) - +new Date(a.lastStudyAt))
}

/* ============================================================
 * 学生提交（StudentSubmission）
 *
 * 主键为 (studentId, lessonNodeId)：每个学生在每个节点最多一条；
 * 重新提交会覆盖旧记录。
 *
 * 旧导出名 NodeSubmission/getNodeSubmission/saveNodeSubmission 保留兼容。
 * ============================================================ */
export function getNodeSubmissions(): StudentSubmission[] {
  return readLS<StudentSubmission[]>(LS_KEYS.nodeSubmissions, [])
}
export function saveNodeSubmission(sub: StudentSubmission): void {
  const list = getNodeSubmissions()
  const next = list.filter(
    (s) => !(s.studentId === sub.studentId && s.lessonNodeId === sub.lessonNodeId),
  )
  next.push(sub)
  writeLS(LS_KEYS.nodeSubmissions, next)
}
/** 通过 (studentId, lessonNodeId) 查询提交 */
export function getNodeSubmission(
  studentId: string,
  lessonNodeId: string,
): StudentSubmission | undefined {
  return getNodeSubmissions().find(
    (s) => s.studentId === studentId && s.lessonNodeId === lessonNodeId,
  )
}

/** 清除某学生在某节点的提交（用于"重新作答"） */
export function clearNodeSubmission(
  studentId: string,
  lessonNodeId: string,
): void {
  const list = getNodeSubmissions().filter(
    (s) => !(s.studentId === studentId && s.lessonNodeId === lessonNodeId),
  )
  writeLS(LS_KEYS.nodeSubmissions, list)
}

/** 从某学生的某节课进度里"撤销"完成（用于"重新作答"后状态同步） */
export function uncompleteNode(
  studentId: string,
  courseId: string,
  lessonId: string,
  nodeId: string,
): void {
  const list = readAllProgress()
  const idx = list.findIndex(
    (p) => p.studentId === studentId && p.courseId === courseId && p.lessonId === lessonId,
  )
  if (idx < 0) return
  const p = { ...list[idx] }
  p.completedNodeIds = p.completedNodeIds.filter((id) => id !== nodeId)
  list[idx] = p
  writeAllProgress(list)
}

/**
 * 人工批改一道简答题：
 * 找到学生的提交 → 找到对应题目答案 → 更新 score / correct → 重算汇总
 */
export function gradeQuestionAnswer(
  submissionId: string,
  questionId: string,
  patch: { score?: number; correct?: boolean },
): void {
  const list = getNodeSubmissions()
  const idx = list.findIndex((s) => s.id === submissionId)
  if (idx < 0) return
  const sub = { ...list[idx], answers: [...list[idx].answers] }
  const aIdx = sub.answers.findIndex((a) => a.questionId === questionId)
  if (aIdx < 0) return
  sub.answers[aIdx] = { ...sub.answers[aIdx], ...patch }
  list[idx] = sub
  saveNodeSubmission(sub)
}
