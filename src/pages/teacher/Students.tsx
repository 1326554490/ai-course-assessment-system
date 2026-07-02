import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Tag } from '@/components/ui'
import { getClasses, getStudents } from '@/store'

/**
 * 教师端 - 班级学生管理
 *
 * 定位:学生名单 + 管理入口(分班/导入/编辑)
 * 学情数据请看"学情数据 → 班级分析"
 */
export function TeacherStudents() {
  const classes = getClasses()
  const students = getStudents()

  const [classId, setClassId] = useState<string>(classes[0]?.id ?? '')

  const currentClass = classes.find((c) => c.id === classId)
  const filteredStudents = currentClass
    ? students.filter((s) => currentClass.studentIds.includes(s.id))
    : students

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-ink-900">班级学生</h2>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="h-8 border border-ink-200 rounded px-2 text-sm bg-white"
          >
            <option value="">全部学生</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-xs text-ink-500 py-8 text-center">暂无学生</div>
        ) : (
          <table className="lf-table">
            <thead>
              <tr>
                <th className="w-[20%]">学号</th>
                <th className="w-[20%]">姓名</th>
                <th className="w-[30%]">所在班级</th>
                <th className="w-[30%] text-right"></th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => {
                const classNames = classes
                  .filter((c) => c.studentIds.includes(s.id))
                  .map((c) => c.name)
                return (
                  <tr key={s.id}>
                    <td className="text-xs text-ink-700">{s.studentNo ?? '—'}</td>
                    <td className="text-sm text-ink-900 font-medium">{s.name}</td>
                    <td>
                      <div className="flex items-center gap-1 flex-wrap">
                        {classNames.length === 0 ? (
                          <span className="text-xs text-ink-500">未分班</span>
                        ) : (
                          classNames.map((cn, i) => (
                            <Tag key={i} variant="default" className="!text-[10px]">
                              {cn}
                            </Tag>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="text-right">
                      <Link
                        to={`/teacher/student/${s.id}`}
                        className="text-xs text-brand-text hover:underline"
                      >
                        查看详情
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      <div className="text-[11px] text-ink-500 px-3">
        💡 批量导入、分班管理等功能开发中。学生学情数据请查看「学情数据 → 班级分析」。
      </div>
    </div>
  )
}
