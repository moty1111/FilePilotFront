<script setup>
const props = defineProps({
  file: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['back'])

function formatSize(bytes) {
  if (bytes == null) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function detectLang(name) {
  if (name.endsWith('.md')) return 'Markdown'
  if (name.endsWith('.py')) return 'Python'
  if (name.endsWith('.js')) return 'JavaScript'
  if (name.endsWith('.json') || name.endsWith('.jsonl')) return 'JSON'
  if (name.endsWith('.csv')) return 'CSV'
  if (name.endsWith('.html')) return 'HTML'
  if (name.endsWith('.css')) return 'CSS'
  if (name.endsWith('.log')) return 'Log'
  if (name.endsWith('.txt')) return 'Text'
  return 'Text'
}
</script>

<template>
  <div class="file-viewer">
    <!-- 文件头部 -->
    <div class="file-header">
      <button class="btn-back" @click="emit('back')">
        ← 返回聊天
      </button>
      <div class="file-info">
        <span class="file-name">{{ file?.name || '未知文件' }}</span>
        <span v-if="file" class="file-meta">
          <span class="tag">{{ detectLang(file.name) }}</span>
          <span class="tag">{{ formatSize(file.size) }}</span>
          <span v-if="file.truncated" class="tag warn">已截断</span>
        </span>
      </div>
      <div class="file-path">{{ file?.path || '' }}</div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="file-loading">
      <div class="spinner"></div>
      <span>加载文件内容...</span>
    </div>

    <!-- 错误 -->
    <div v-else-if="error" class="file-error">
      <span class="error-icon">⚠️</span>
      <span>{{ error }}</span>
    </div>

    <!-- 文件内容 -->
    <div v-else-if="file" class="file-content">
      <pre class="code-view"><code>{{ file.content }}</code></pre>
    </div>

    <!-- 空状态 -->
    <div v-else class="file-empty">
      <span class="empty-icon">📂</span>
      <span>选择左侧文件查看内容</span>
    </div>
  </div>
</template>

<style scoped>
.file-viewer {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--main-bg);
}

.file-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.btn-back {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 5px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.btn-back:hover {
  background: var(--main-bg);
  color: var(--text-primary);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.file-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-meta {
  display: flex;
  gap: 6px;
}
.tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #f0f2f5;
  color: var(--text-secondary);
  font-weight: 500;
  white-space: nowrap;
}
.tag.warn {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}
.file-path {
  font-size: 12px;
  color: var(--text-muted);
  font-family: 'SF Mono', 'Fira Code', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}

.file-content {
  flex: 1;
  overflow: auto;
  background: #1e1f26;
}
.code-view {
  margin: 0;
  padding: 20px;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #e0e0e8;
  white-space: pre;
  tab-size: 2;
}
.code-view code {
  font-family: inherit;
}

.file-loading, .file-error, .file-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-muted);
  font-size: 14px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.file-error { color: var(--error); }
.error-icon { font-size: 32px; }

.empty-icon { font-size: 48px; }
</style>
