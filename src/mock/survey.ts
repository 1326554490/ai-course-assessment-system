/**
 * @deprecated 已废弃。问卷不再作为独立 Form 存在，
 * 所有问卷逻辑都通过 Activity (type: 'survey') 嵌入到课程节点。
 * 文件保留是为避免外部 import 路径报错。
 */
import type { Form } from '@/types'

export const MOCK_SURVEY: Form | null = null
export const MOCK_SURVEY_2: Form | null = null
export const MOCK_SURVEY_DRAFT: Form | null = null
