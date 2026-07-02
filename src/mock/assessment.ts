/**
 * @deprecated 已废弃。测评不再作为独立 Form 存在，
 * 所有测评逻辑都通过 Activity (type: 'assessment') 嵌入到课程节点。
 * 文件保留是为避免外部 import 路径报错。
 */
import type { Form } from '@/types'

export const MOCK_ASSESSMENT: Form | null = null
export const MOCK_ASSESSMENT_2: Form | null = null
export const MOCK_ASSESSMENT_ENDED: Form | null = null
