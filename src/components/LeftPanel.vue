<script setup>
import { ref } from 'vue'
import FileTreeNode from './FileTreeNode.vue'

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  currentTaskId: { type: String, default: '' },
  fileTree: { type: Object, default: null },
  activeFilePath: { type: String, default: '' },
  fileLoading: { type: Boolean, default: false },
})

const emit = defineEmits([
  'select-task',
  'select-file',
  'new-task',
  'refresh-files',
  'reset-workspace',
])

const resetting = ref(false)
const resetDone = ref('')

function statusBadge(status) {
  const map = {
    pending: { text: '等待', cls: 'pending' },
    running: { text: '运行中', cls: 'running' },
    completed: { text: '完成', cls: 'completed' },
    failed: { text: '失败', cls: 'failed' },
  }
  return map[status] || { text: status, cls: 'pending' }
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前'
  if (diff < 86400) return Math.floor(diff / 3600) + '小时前'
  return d.toLocaleDateString('zh-CN')
}

async function handleReset() {
  resetting.value = true
  resetDone.value = ''
  try {
    emit('reset-workspace')
  } finally {
    resetting.value = false
  }
}
</script>

<template>
  <aside class="sidebar">
    <!-- 顶部标题 -->
    <div class="sidebar-header">
      <div class="logo">
        <span class="logo-icon">🤖</span>
        <span class="logo-text">FilePilot</span>
      </div>
      <button class="btn-new" @click="emit('new-task')">
        + 新任务
      </button>
    </div>

    <!-- 历史任务列表 -->
    <div class="section tasks-section">
      <div class="section-header">
        <span class="section-title">历史任务</span>
        <span class="section-count">{{ tasks.length }}</span>
      </div>
      <div class="section-body">
        <div v-if="tasks.length === 0" class="empty-hint">
          暂无任务，输入指令开始吧
        </div>
        <div
          v-for="task in tasks"
          :key="task.task_id"
          class="task-item"
          :class="{ active: task.task_id === currentTaskId }"
          @click="emit('select-task', task.task_id)"
        >
          <div class="task-text">{{ task.task }}</div>
          <div class="task-meta">
            <span class="badge" :class="statusBadge(task.status).cls">
              {{ statusBadge(task.status).text }}
            </span>
            <span class="task-time">{{ formatTime(task.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 文件树 -->
    <div class="section files-section">
      <div class="section-header">
        <span class="section-title">工作区文件</span>
        <div class="section-actions">
          <button
            class="btn-icon"
            title="重置工作区"
            :disabled="resetting"
            @click="handleReset"
          >
            ↻
          </button>
          <button
            class="btn-icon"
            title="刷新文件树"
            :disabled="fileLoading"
            @click="emit('refresh-files')"
          >
            ⟳
          </button>
        </div>
      </div>
      <div class="section-body">
        <div v-if="fileLoading" class="empty-hint">加载中...</div>
        <div v-else-if="!fileTree || !fileTree.children?.length" class="empty-hint">
          工作区为空
        </div>
        <div v-else class="file-tree">
          <FileTreeNode
            v-for="node in fileTree.children"
            :key="node.path"
            :node="node"
            :depth="0"
            :active-path="activeFilePath"
            @select-file="emit('select-file', $event)"
          />
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 280px;
  min-width: 280px;
  height: 100%;
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--sidebar-border);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--sidebar-border);
  flex-shrink: 0;
}
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}
.logo-icon { font-size: 20px; }
.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.5px;
}
.btn-new {
  background: var(--accent);
  color: #fff;
  border: none;
  padding: 5px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.15s;
}
.btn-new:hover { background: var(--accent-hover); }

.section {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.tasks-section { flex: 1 1 40%; }
.files-section { flex: 1 1 60%; border-top: 1px solid var(--sidebar-border); }

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  flex-shrink: 0;
}
.section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--sidebar-text-dim);
}
.section-count {
  font-size: 11px;
  color: var(--sidebar-text-dim);
  background: var(--sidebar-hover);
  padding: 1px 8px;
  border-radius: 10px;
}
.section-actions {
  display: flex;
  gap: 4px;
}
.btn-icon {
  background: none;
  border: none;
  color: var(--sidebar-text-dim);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.15s;
}
.btn-icon:hover:not(:disabled) {
  background: var(--sidebar-hover);
  color: #fff;
}
.btn-icon:disabled { opacity: 0.5; cursor: not-allowed; }

.section-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 8px;
}

.empty-hint {
  padding: 12px;
  font-size: 12px;
  color: var(--sidebar-text-dim);
  text-align: center;
}

.task-item {
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  margin-bottom: 4px;
  transition: background 0.15s;
}
.task-item:hover { background: var(--sidebar-hover); }
.task-item.active {
  background: rgba(59, 130, 246, 0.15);
  border-left: 3px solid var(--accent);
  padding-left: 7px;
}
.task-text {
  font-size: 13px;
  color: var(--sidebar-text);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}
.task-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}
.badge {
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 10px;
  font-weight: 600;
}
.badge.pending { background: #3a3b47; color: #9ca3af; }
.badge.running {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  animation: pulse 1.5s infinite;
}
.badge.completed { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
.badge.failed { background: rgba(239, 68, 68, 0.2); color: #f87171; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

.task-time {
  font-size: 11px;
  color: var(--sidebar-text-dim);
}

.file-tree {
  padding-bottom: 8px;
}
</style>
