<script>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import LeftPanel from './components/LeftPanel.vue'
import ChatPanel from './components/ChatPanel.vue'
import FileViewer from './components/FileViewer.vue'
import TaskInput from './components/TaskInput.vue'
import * as api from './services/api.js'

export default {
  components: { LeftPanel, ChatPanel, FileViewer, TaskInput },
  setup() {
    // ── 状态 ──
    const tasks = ref([])
    const currentTaskId = ref('')
    const currentTask = ref(null)
    const traces = ref([])
    const fileTree = ref(null)
    const fileLoading = ref(false)
    const currentFile = ref(null)
    const fileViewerLoading = ref(false)
    const fileError = ref('')
    const viewMode = ref('chat') // 'chat' | 'file'
    const isRunning = ref(false)
    const submitting = ref(false)
    const activeFilePath = ref('')

    let pollTimer = null

    // ── 文件树构建 ──
    function buildTree(entries) {
      const root = { name: 'workspace', path: '.', type: 'directory', children: [] }
      const nodeMap = { '.': root }

      const sorted = [...entries].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
        return a.path.localeCompare(b.path)
      })

      for (const entry of sorted) {
        const parts = entry.path.split('/')
        const parentPath = parts.length > 1 ? parts.slice(0, -1).join('/') : '.'
        const node = entry.type === 'directory'
          ? { ...entry, children: [] }
          : { ...entry }
        nodeMap[entry.path] = node
        const parent = nodeMap[parentPath] || root
        parent.children.push(node)
      }
      return root
    }

    // ── 数据加载 ──
    async function loadTasks() {
      try {
        const data = await api.listTasks()
        tasks.value = data.tasks || []
      } catch (e) {
        console.error('加载任务列表失败:', e)
      }
    }

    async function loadFileTree() {
      fileLoading.value = true
      try {
        const data = await api.listWorkspace('.')
        fileTree.value = buildTree(data.entries || [])
      } catch (e) {
        console.error('加载文件树失败:', e)
      } finally {
        fileLoading.value = false
      }
    }

    // ── 任务选择 ──
    async function selectTask(taskId) {
      stopPolling()
      currentTaskId.value = taskId
      viewMode.value = 'chat'
      traces.value = []
      currentTask.value = null

      try {
        const [status, traceData] = await Promise.all([
          api.getTaskStatus(taskId),
          api.getTaskTrace(taskId),
        ])
        currentTask.value = status
        traces.value = traceData.traces || []

        if (status.status === 'running' || status.status === 'pending') {
          isRunning.value = true
          startPolling(taskId)
        } else {
          isRunning.value = false
        }
      } catch (e) {
        console.error('加载任务详情失败:', e)
      }
    }

    // ── 轮询 ──
    function startPolling(taskId) {
      stopPolling()
      pollTimer = setInterval(async () => {
        try {
          const [status, traceData] = await Promise.all([
            api.getTaskStatus(taskId),
            api.getTaskTrace(taskId),
          ])
          currentTask.value = status
          traces.value = traceData.traces || []

          if (status.status !== 'running' && status.status !== 'pending') {
            stopPolling()
            isRunning.value = false
            await loadTasks()
            await loadFileTree()
          }
        } catch (e) {
          console.error('轮询失败:', e)
        }
      }, 1500)
    }

    function stopPolling() {
      if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
    }

    // ── 提交任务 ──
    async function submitTask(instruction) {
      if (submitting.value || isRunning.value) return
      submitting.value = true
      stopPolling()

      // 立即切换到聊天模式
      viewMode.value = 'chat'
      currentFile.value = null
      fileError.value = ''

      try {
        const resp = await api.createTask(instruction)
        const newTask = {
          task_id: resp.task_id,
          task: instruction,
          status: resp.status,
          created_at: resp.created_at,
        }
        // 插入到任务列表头部
        tasks.value.unshift(newTask)

        // 选中新任务
        currentTaskId.value = resp.task_id
        currentTask.value = { ...newTask, result: null, error: null, steps: 0 }
        traces.value = []
        isRunning.value = true

        startPolling(resp.task_id)
      } catch (e) {
        console.error('提交任务失败:', e)
        alert('提交任务失败: ' + e.message)
      } finally {
        submitting.value = false
      }
    }

    // ── 文件选择 ──
    async function selectFile(filePath) {
      viewMode.value = 'file'
      activeFilePath.value = filePath
      currentFile.value = null
      fileError.value = ''
      fileViewerLoading.value = true

      try {
        const data = await api.readFile(filePath)
        currentFile.value = data
      } catch (e) {
        fileError.value = e.message
      } finally {
        fileViewerLoading.value = false
      }
    }

    // ── 返回聊天 ──
    function backToChat() {
      viewMode.value = 'chat'
    }

    // ── 新任务 ──
    function newTask() {
      stopPolling()
      currentTaskId.value = ''
      currentTask.value = null
      traces.value = []
      isRunning.value = false
      viewMode.value = 'chat'
    }

    // ── 重置工作区 ──
    async function resetWorkspace() {
      if (!confirm('确定要重置工作区到初始状态吗？所有修改的文件将被恢复。'))
        return
      try {
        await api.resetWorkspace()
        await loadFileTree()
        alert('工作区已重置')
      } catch (e) {
        alert('重置失败: ' + e.message)
      }
    }

    // ── 生命周期 ──
    onMounted(() => {
      loadTasks()
      loadFileTree()
    })

    onUnmounted(() => {
      stopPolling()
    })

    return {
      tasks, currentTaskId, currentTask, traces,
      fileTree, fileLoading, currentFile, fileViewerLoading, fileError,
      viewMode, isRunning, submitting, activeFilePath,
      selectTask, selectFile, submitTask, backToChat, newTask,
      loadFileTree, resetWorkspace,
    }
  },
}
</script>

<template>
  <div class="app-layout">
    <!-- 左侧面板 -->
    <LeftPanel
      :tasks="tasks"
      :current-task-id="currentTaskId"
      :file-tree="fileTree"
      :active-file-path="activeFilePath"
      :file-loading="fileLoading"
      @select-task="selectTask"
      @select-file="selectFile"
      @new-task="newTask"
      @refresh-files="loadFileTree"
      @reset-workspace="resetWorkspace"
    />

    <!-- 中央主区域 -->
    <main class="main-area">
      <!-- 顶部状态栏 -->
      <header class="main-header">
        <div class="header-left">
          <span v-if="currentTask" class="task-status-badge" :class="currentTask.status">
            {{ currentTask.status }}
          </span>
          <span v-if="currentTask" class="header-title">
            {{ currentTask.task }}
          </span>
          <span v-else class="header-title muted">新任务</span>
        </div>
        <div class="header-right">
          <span v-if="currentTask?.steps" class="header-info">
            Step: {{ currentTask.steps }}
          </span>
          <span v-if="currentTask?.token_usage" class="header-info">
            Tokens: {{ currentTask.token_usage.total_tokens }}
          </span>
        </div>
      </header>

      <!-- 内容区：聊天 or 文件查看器 -->
      <ChatPanel
        v-if="viewMode === 'chat'"
        :task-instruction="currentTask?.task || ''"
        :traces="traces"
        :status="currentTask?.status || ''"
      />
      <FileViewer
        v-else
        :file="currentFile"
        :loading="fileViewerLoading"
        :error="fileError"
        @back="backToChat"
      />

      <!-- 底部输入 -->
      <TaskInput
        :disabled="isRunning || submitting"
        @submit="submitTask"
      />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
}

.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  gap: 12px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}
.header-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.header-title.muted { color: var(--text-muted); font-weight: 400; }

.task-status-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
}
.task-status-badge.pending { background: #e4e6eb; color: #6b7280; }
.task-status-badge.running {
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent);
}
.task-status-badge.completed {
  background: rgba(34, 197, 94, 0.1);
  color: var(--success);
}
.task-status-badge.failed {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error);
}

.header-right {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}
.header-info {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}
</style>
