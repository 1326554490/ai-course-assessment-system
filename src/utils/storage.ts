/**
 * LocalStorage 工具函数
 */

export const SCHEMA_VERSION = 7

export const LS_KEYS = {
  schemaVersion: 'ai-course:schema-version',
  forms: 'ai-course:forms',
  students: 'ai-course:students',
  classes: 'ai-course:classes',
  courses: 'ai-course:courses',
  activities: 'ai-course:activities',
  nodeSubmissions: 'ai-course:node-submissions',
  progress: 'ai-course:progress',
} as const

export function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeLS<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('Failed to write to localStorage:', e)
  }
}

export function clearAllLS(): void {
  Object.values(LS_KEYS).forEach((key) => localStorage.removeItem(key))
}
