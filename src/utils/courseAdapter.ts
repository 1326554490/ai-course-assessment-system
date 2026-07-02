/**
 * Course/Activity 适配层
 *
 * 旧的页面层（StudentLesson / TeacherCourseEditor / TeacherCourseReport 等）
 * 期望从 LessonNode 上直接拿到 questions / dimensions / totalScore / examples 等字段。
 *
 * 新结构里这些字段都搬到了 Activity，节点只持有 activityId。
 * 这一层负责：
 * - resolveNode(node)  → 把 activity 注水到节点上，得到 ResolvedNode（自动从 store 读 activities）
 * - resolveCourse(course) → 整门课程递归注水
 * - findResolvedNode(...)
 */

import type {
  Activity,
  Course,
  Lesson,
  LessonNode,
  ResolvedNode,
} from '@/types'
import { getActivities } from '@/store'

/** 把 activity 字段平摊到节点上，返回页面层易用的 ResolvedNode */
export function resolveNode(
  node: LessonNode,
  activities?: Activity[],
): ResolvedNode {
  const acts = activities ?? getActivities()
  const activity = node.activityId
    ? acts.find((a) => a.id === node.activityId)
    : undefined

  const base: ResolvedNode = {
    ...node,
    activity,
    required: node.completionRequired,
  }

  if (!activity) return base

  base.questions = activity.questions
  base.dimensions = activity.dimensions
  base.practiceType = activity.practiceType
  base.examples = activity.examples

  // 测评类：扁平化分数字段
  if (activity.type === 'assessment' && activity.scoringRule) {
    base.totalScore = activity.scoringRule.totalScore
    base.passScore = activity.scoringRule.passScore
  }
  if (activity.feedbackConfig) {
    base.showResultToStudent = activity.feedbackConfig.showScore !== false
    base.showExplanation = activity.feedbackConfig.showExplanation !== false
    base.showDimensionRadar = activity.feedbackConfig.showDimensionRadar === true
  }

  return base
}

/** 整门课程递归注水 */
export function resolveCourse(course: Course): Course {
  const activities = getActivities()
  return {
    ...course,
    lessons: course.lessons.map((l) => ({
      ...l,
      nodes: l.nodes.map((n) => resolveNode(n, activities) as LessonNode),
    })),
  }
}

/** 一组课程递归注水 */
export function resolveCourses(
  courses: Course[],
): Course[] {
  return courses.map((c) => resolveCourse(c))
}

/** 通过 activityId 找节点 + 课程上下文 */
export function findNodeByActivityId(
  courses: Course[],
  activityId: string,
): { course: Course; lesson: Lesson; node: LessonNode } | undefined {
  for (const c of courses) {
    for (const l of c.lessons) {
      const n = l.nodes.find((x) => x.activityId === activityId)
      if (n) return { course: c, lesson: l, node: n }
    }
  }
  return undefined
}

/** 通过节点 id 找节点 + 课程上下文 */
export function findNodeContext(
  courses: Course[],
  nodeId: string,
): { course: Course; lesson: Lesson; node: LessonNode } | undefined {
  for (const c of courses) {
    for (const l of c.lessons) {
      const n = l.nodes.find((x) => x.id === nodeId)
      if (n) return { course: c, lesson: l, node: n }
    }
  }
  return undefined
}
