/**
 * FilePilot Agent 后端 API 封装。
 *
 * 所有方法返回 Promise，出错时抛出 Error（含 message）。
 */

const BASE = import.meta.env.VITE_API_BASE_URL || '/api'

/* ──────────────────── 内部工具 ──────────────────── */

async function request(path, options = {}) {
  const url = `${BASE}${path}`
  const resp = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!resp.ok) {
    let detail = `${resp.status} ${resp.statusText}`
    try {
      const body = await resp.json()
      if (body.detail) detail = body.detail
    } catch { /* ignore */ }
    throw new Error(detail)
  }
  // 204 或空 body
  const text = await resp.text()
  return text ? JSON.parse(text) : null
}

/* ──────────────────── 任务相关 ──────────────────── */

/**
 * 提交新任务。
 * @param {string} task - 自然语言指令
 * @returns {Promise<{task_id: string, status: string, created_at: string}>}
 */
export function createTask(task) {
  return request('/tasks', {
    method: 'POST',
    body: JSON.stringify({ task }),
  })
}

/**
 * 获取任务列表。
 * @returns {Promise<{tasks: Array, total: number}>}
 */
export function listTasks() {
  return request('/tasks')
}

/**
 * 获取任务状态详情。
 * @param {string} taskId
 * @returns {Promise<Object>}
 */
export function getTaskStatus(taskId) {
  return request(`/tasks/${taskId}`)
}

/**
 * 获取任务 Trace 记录。
 * @param {string} taskId
 * @returns {Promise<{task_id: string, traces: Array}>}
 */
export function getTaskTrace(taskId) {
  return request(`/tasks/${taskId}/trace`)
}

/* ──────────────────── Workspace 相关 ──────────────────── */

/**
 * 列出 workspace 目录树（递归）。
 * @param {string} [path='.'] - 相对路径
 * @returns {Promise<{workspace_path: string, entries: Array}>}
 */
export function listWorkspace(path = '.') {
  const q = new URLSearchParams({ path, recursive: 'true' })
  return request(`/workspace?${q}`)
}

/**
 * 读取 workspace 文件内容。
 * @param {string} filePath - 相对路径
 * @returns {Promise<{path, name, size, content, truncated, max_chars}>}
 */
export function readFile(filePath) {
  return request(`/workspace/files/${filePath}`)
}

/**
 * 重置 workspace 到初始状态。
 * @returns {Promise<Object>}
 */
export function resetWorkspace() {
  return request('/workspace/reset', { method: 'POST' })
}
