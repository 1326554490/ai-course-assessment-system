import { createHashRouter, Navigate } from 'react-router-dom'
import { TeacherLayout, StudentLayout } from '@/layouts'

/* —— 教师端页面 —— */
import { TeacherHome } from '@/pages/teacher/Home'
import { TeacherStudents } from '@/pages/teacher/Students'
import { TeacherStudentDetail } from '@/pages/teacher/StudentDetail'
import { TeacherCourses } from '@/pages/teacher/Courses'
import { TeacherCourseEditor } from '@/pages/teacher/CourseEditor'
import { TeacherCourseReport } from '@/pages/teacher/CourseReport'
import { TeacherActivities } from '@/pages/teacher/Activities'
import { TeacherActivityConfig } from '@/pages/teacher/ActivityConfig'
import { TeacherActivityGenerate } from '@/pages/teacher/ActivityGenerate'
import { TeacherTeach } from '@/pages/teacher/Teach'
import { TeacherData } from '@/pages/teacher/Data'

/* —— 学生端页面 —— */
import { StudentHome } from '@/pages/student/Home'
import { StudentCourses } from '@/pages/student/Courses'
import { StudentCourseDetail } from '@/pages/student/CourseDetail'
import { StudentLesson } from '@/pages/student/Lesson'
import { StudentMe } from '@/pages/student/Me'

/* —— 入口选择 —— */
import { Landing } from '@/pages/Landing'

/**
 * 路由
 *
 * 已废弃：/teacher/surveys/* 与 /teacher/assessments/*
 *         /student/surveys/* 与 /student/assessments/*
 * 这些独立"问卷 / 测评"入口在新数据模型下不再存在，问卷与测评作为
 * Activity 嵌入在课程节点中。访问到这些路径会重定向到新入口。
 */
export const router = createHashRouter([
  { path: '/', element: <Landing /> },

  /* —— 教师端 —— */
  {
    path: '/teacher',
    element: <TeacherLayout />,
    children: [
      { index: true, element: <TeacherHome /> },

      // 课程管理 & 课节编辑器 & 上课 & 课程报告
      { path: 'courses',                    element: <TeacherCourses /> },
      { path: 'course/:courseId/editor',    element: <TeacherCourseEditor /> },
      { path: 'course/:courseId/teach',     element: <TeacherTeach /> },
      { path: 'course/:courseId/report',    element: <TeacherCourseReport /> },

      // 学生与班级
      { path: 'students',             element: <TeacherStudents /> },
      { path: 'student/:studentId',   element: <TeacherStudentDetail /> },

      // 学情数据（合并 活动数据 + 班级分析）
      { path: 'data',       element: <TeacherData /> },
      { path: 'activities', element: <TeacherActivities /> },
      { path: 'activity/:activityId/config', element: <TeacherActivityConfig /> },
      { path: 'activity/:activityId/generate', element: <TeacherActivityGenerate /> },

      // —— 兼容性重定向 ——
      { path: 'reports',       element: <Navigate to="/teacher/data" replace /> },
      { path: 'analytics',     element: <Navigate to="/teacher/data" replace /> },
      { path: 'surveys/*',     element: <Navigate to="/teacher/courses" replace /> },
      { path: 'assessments/*', element: <Navigate to="/teacher/courses" replace /> },
    ],
  },

  /* —— 学生端 —— */
  {
    path: '/student',
    element: <StudentLayout />,
    children: [
      { index: true, element: <StudentHome /> },

      // 课程学习
      { path: 'courses',                              element: <StudentCourses /> },
      { path: 'course/:courseId',                     element: <StudentCourseDetail /> },
      { path: 'course/:courseId/lesson/:lessonId',    element: <StudentLesson /> },

      // 我的收获（合并 错题本 + 学习记录）
      { path: 'me',       element: <StudentMe /> },

      // —— 兼容性重定向 ——
      { path: 'tasks',         element: <Navigate to="/student/me" replace /> },
      { path: 'records',       element: <Navigate to="/student/me" replace /> },
      { path: 'mistakes',      element: <Navigate to="/student/me" replace /> },
      { path: 'surveys/*',     element: <Navigate to="/student/courses" replace /> },
      { path: 'assessments/*', element: <Navigate to="/student/courses" replace /> },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
])
