import type { ClassInfo, Student } from '@/types'

/**
 * Mock 学生：30 名（cls-01 16 名 + cls-02 14 名）
 * - 名字虚构、与真实人物无关
 */
export const MOCK_STUDENTS: Student[] = [
  // —— 六(1) 班 ——
  { id: 'stu-01', name: '陈一鸣', classId: 'cls-01', studentNo: '01' },
  { id: 'stu-02', name: '王思雨', classId: 'cls-01', studentNo: '02' },
  { id: 'stu-03', name: '李子轩', classId: 'cls-01', studentNo: '03' },
  { id: 'stu-04', name: '张梓涵', classId: 'cls-01', studentNo: '04' },
  { id: 'stu-05', name: '刘浩然', classId: 'cls-01', studentNo: '05' },
  { id: 'stu-06', name: '黄欣怡', classId: 'cls-01', studentNo: '06' },
  { id: 'stu-07', name: '周子墨', classId: 'cls-01', studentNo: '07' },
  { id: 'stu-08', name: '吴俊熙', classId: 'cls-01', studentNo: '08' },
  { id: 'stu-09', name: '徐若兮', classId: 'cls-01', studentNo: '09' },
  { id: 'stu-10', name: '孙瑾萱', classId: 'cls-01', studentNo: '10' },
  { id: 'stu-11', name: '马俊豪', classId: 'cls-01', studentNo: '11' },
  { id: 'stu-12', name: '朱可儿', classId: 'cls-01', studentNo: '12' },
  { id: 'stu-13', name: '高彦祖', classId: 'cls-01', studentNo: '13' },
  { id: 'stu-14', name: '冯沐汐', classId: 'cls-01', studentNo: '14' },
  { id: 'stu-15', name: '钱皓宇', classId: 'cls-01', studentNo: '15' },
  { id: 'stu-16', name: '郑乐瑶', classId: 'cls-01', studentNo: '16' },

  // —— 六(2) 班 ——
  { id: 'stu-21', name: '苏明朗', classId: 'cls-02', studentNo: '01' },
  { id: 'stu-22', name: '林雨轩', classId: 'cls-02', studentNo: '02' },
  { id: 'stu-23', name: '何沐辰', classId: 'cls-02', studentNo: '03' },
  { id: 'stu-24', name: '叶诗音', classId: 'cls-02', studentNo: '04' },
  { id: 'stu-25', name: '罗清扬', classId: 'cls-02', studentNo: '05' },
  { id: 'stu-26', name: '韩亦舒', classId: 'cls-02', studentNo: '06' },
  { id: 'stu-27', name: '夏知行', classId: 'cls-02', studentNo: '07' },
  { id: 'stu-28', name: '蒋星禾', classId: 'cls-02', studentNo: '08' },
  { id: 'stu-29', name: '邓予安', classId: 'cls-02', studentNo: '09' },
  { id: 'stu-30', name: '许书宁', classId: 'cls-02', studentNo: '10' },
  { id: 'stu-31', name: '彭浩南', classId: 'cls-02', studentNo: '11' },
  { id: 'stu-32', name: '邵若汐', classId: 'cls-02', studentNo: '12' },
  { id: 'stu-33', name: '蔡博文', classId: 'cls-02', studentNo: '13' },
  { id: 'stu-34', name: '潘思齐', classId: 'cls-02', studentNo: '14' },
]

export const MOCK_CLASSES: ClassInfo[] = [
  {
    id: 'cls-01',
    name: '六年级 1 班',
    studentIds: MOCK_STUDENTS.filter((s) => s.classId === 'cls-01').map((s) => s.id),
  },
  {
    id: 'cls-02',
    name: '六年级 2 班',
    studentIds: MOCK_STUDENTS.filter((s) => s.classId === 'cls-02').map((s) => s.id),
  },
]

export const CURRENT_STUDENT_ID = 'stu-01'

export const CURRENT_TEACHER = {
  name: '林老师',
  subject: 'AI 启蒙',
}

export const CURRENT_SEMESTER = '2025 - 2026 春季学期'
