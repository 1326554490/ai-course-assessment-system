import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, Tag, BrandLogo, Icon } from '@/components/ui'
import type { IconName } from '@/components/ui'
import { bootstrap, getActivities, getCourses, getNodeSubmissions, getStudents } from '@/store'

/**
 * 入口页：星芽 AI 通识课教学平台介绍 + 教师端/学生端入口
 */
export function Landing() {
  useEffect(() => {
    bootstrap()
  }, [])

  const courses = getCourses()
  const students = getStudents()
  const activities = getActivities()
  const subs = getNodeSubmissions()

  return (
    <div className="min-h-screen bg-ink-50">
      {/* 顶栏 */}
      <header className="h-14 bg-white border-b border-ink-200">
        <div className="h-full px-4 flex items-center justify-between">
          <BrandLogo />
          <div className="text-xs text-ink-500">
            AI 通识课教学平台
          </div>
        </div>
      </header>

      {/* 主体 */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* 顶部 Hero */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-brand mx-auto mb-4 flex items-center justify-center text-white">
            <Icon name="graduation" className="w-8 h-8" />
          </div>
          <h1 className="text-3xl text-ink-900 font-medium mb-2">
            星芽 · AI 通识课教学平台
          </h1>
          <p className="text-sm text-ink-500">
            把问卷与测评嵌入课程流程，让 AI 通识课变得可教、可学、可评估
          </p>
        </div>

        {/* 入口卡 */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <Link to="/teacher" className="block">
            <Card className="hover:border-brand hover:shadow-md transition !p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-brand-soft text-brand-text flex items-center justify-center shrink-0">
                  <Icon name="graduation" className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-base font-medium text-ink-900">教师端</div>
                    <Tag className="!text-[10px]">课程作者 / 班主任</Tag>
                  </div>
                  <div className="text-xs text-ink-500 leading-relaxed mb-3">
                    创建课程 → 添加课节 → 编辑图文 / 问卷 / 测评 / AI 互动 →
                    发布给学生 → 查看班级数据 / 学情画像 / 共性错题
                  </div>
                  <div className="text-xs text-brand-text">进入教师端 →</div>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/student" className="block">
            <Card className="hover:border-brand hover:shadow-md transition !p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Icon name="book" className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-base font-medium text-ink-900">学生端</div>
                    <Tag className="!text-[10px]">小学 / 初中 / 高中</Tag>
                  </div>
                  <div className="text-xs text-ink-500 leading-relaxed mb-3">
                    选择课程 → 按节点学习（图文 / 问卷 / 测评 / AI 互动）→
                    查看测评成绩 / 错题本 / 维度雷达 → 复习薄弱知识
                  </div>
                  <div className="text-xs text-brand-text">进入学生端 →</div>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* 平台概况 */}
        <Card title="平台概况" className="mb-6">
          <div className="grid grid-cols-4 gap-4">
            <DataStat label="开设课程" value={courses.length} unit="门" />
            <DataStat label="互动活动" value={activities.length} unit="个" />
            <DataStat label="在册学生" value={students.length} unit="名" />
            <DataStat label="作答记录" value={subs.length} unit="条" />
          </div>
        </Card>

        {/* 核心功能 */}
        <Card title="核心功能">
          <div className="grid grid-cols-3 gap-4">
            <Feature
              icon="book"
              title="课程化结构"
              desc="课程 — 课节 — 环节层层组织，问卷与测评作为课节环节自然嵌入"
            />
            <Feature
              icon="edit"
              title="丰富题型"
              desc="单选 / 多选 / 判断 / 填空 / 简答 / 排序 / 分类 / 知识回顾 / Prompt 练习"
            />
            <Feature
              icon="sparkles"
              title="AI 辅助"
              desc="上传课件自动配题，课堂 AI 互动：对话 / 图像识别 / Prompt / 绘画 / 语音"
            />
            <Feature
              icon="target"
              title="学情诊断"
              desc="错题本 / 维度掌握 / 学习建议 / 班级共性错题，精准定位薄弱点"
            />
            <Feature
              icon="check"
              title="灵活批改"
              desc="客观题自动判分，简答与作品支持教师人工评阅"
            />
            <Feature
              icon="chart"
              title="多视角报告"
              desc="课节 / 课程 / 学生 / 班级多维度数据，一屏掌握教学成效"
            />
          </div>
        </Card>

        {/* 底部 */}
        <div className="mt-8 text-center text-[11px] text-ink-400">
          星芽 · AI 通识课教学平台
        </div>
      </main>
    </div>
  )
}

function DataStat({
  label,
  value,
  unit,
}: {
  label: string
  value: number
  unit: string
}) {
  return (
    <div className="text-center">
      <div className="text-xs text-ink-500 mb-1">{label}</div>
      <div className="text-2xl font-medium text-ink-900">
        {value}
        <span className="text-sm text-ink-500 ml-1">{unit}</span>
      </div>
    </div>
  )
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: IconName
  title: string
  desc: string
}) {
  return (
    <div className="border border-ink-100 rounded-lg p-4 hover:border-brand hover:shadow-sm transition">
      <div className="w-9 h-9 rounded-lg bg-brand-soft text-brand-text flex items-center justify-center mb-3">
        <Icon name={icon} className="w-5 h-5" />
      </div>
      <div className="text-sm font-medium text-ink-900 mb-1">{title}</div>
      <div className="text-xs text-ink-500 leading-relaxed">{desc}</div>
    </div>
  )
}
