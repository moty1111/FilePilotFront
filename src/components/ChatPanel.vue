<script setup>
import { ref, watch, nextTick } from 'vue'
import { marked } from 'marked'

const props = defineProps({
  taskInstruction: { type: String, default: '' },
  traces: { type: Array, default: () => [] },
  status: { type: String, default: '' },
})

const chatBodyRef = ref(null)

// 自动滚动到底部
watch(
  () => props.traces.length,
  () => {
    nextTick(() => {
      if (chatBodyRef.value) {
        chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
      }
    })
  }
)

function traceLabel(type) {
  const map = {
    llm_thinking: 'LLM 思考',
    tool_call: '工具调用',
    final: '最终回复',
    max_steps_reached: '达到步数上限',
  }
  return map[type] || type
}

function traceIcon(type) {
  const map = {
    llm_thinking: '💭',
    tool_call: '🔧',
    final: '✅',
    max_steps_reached: '⚠️',
  }
  return map[type] || '📌'
}

function formatArgs(args) {
  if (!args) return ''
  try {
    return JSON.stringify(args, null, 2)
  } catch {
    return String(args)
  }
}

function isRunning() {
  return props.status === 'running' || props.status === 'pending'
}

function renderMarkdown(text) {
  if (!text) return ''
  return marked.parse(text)
}
</script>

<template>
  <div class="chat-panel">
    <div ref="chatBodyRef" class="chat-body">
      <!-- 用户指令（右侧气泡） -->
      <div v-if="taskInstruction" class="msg-row user">
        <div class="bubble user-bubble">
          {{ taskInstruction }}
        </div>
        <div class="avatar user-avatar">👤</div>
      </div>

      <!-- Agent Trace 条目（左侧） -->
      <div
        v-for="(trace, i) in traces"
        :key="i"
        class="msg-row agent"
      >
        <div class="avatar agent-avatar">🤖</div>
        <div class="trace-card" :class="trace.type">
          <div class="trace-header">
            <span class="trace-icon">{{ traceIcon(trace.type) }}</span>
            <span class="trace-type" :class="trace.type">{{ traceLabel(trace.type) }}</span>
            <span class="trace-step">Step {{ trace.step }}</span>
            <span v-if="trace.timestamp" class="trace-time">
              {{ new Date(trace.timestamp).toLocaleTimeString('zh-CN') }}
            </span>
          </div>

          <!-- LLM 思考内容 -->
          <div v-if="trace.type === 'llm_thinking' && trace.content" class="trace-body">
            <div class="thinking-text markdown-body" v-html="renderMarkdown(trace.content)"></div>
          </div>

          <!-- 工具调用 -->
          <div v-if="trace.type === 'tool_call'" class="trace-body">
            <div v-if="trace.tool" class="tool-name">
              <span class="tool-badge">{{ trace.tool }}</span>
            </div>
            <div v-if="trace.args" class="tool-args">
              <div class="args-label">参数</div>
              <pre class="code-block">{{ formatArgs(trace.args) }}</pre>
            </div>
            <div v-if="trace.result_summary" class="tool-result">
              <div class="args-label">结果</div>
              <div class="result-text">{{ trace.result_summary }}</div>
            </div>
          </div>

          <!-- 最终回复 -->
          <div v-if="trace.type === 'final' && trace.content" class="trace-body">
            <div class="final-text markdown-body" v-html="renderMarkdown(trace.content)"></div>
          </div>
          <div v-if="trace.type === 'final' && trace.result_summary" class="trace-body">
            <div class="final-text markdown-body" v-html="renderMarkdown(trace.result_summary)"></div>
          </div>

          <!-- 达到步数上限 -->
          <div v-if="trace.type === 'max_steps_reached'" class="trace-body">
            <div class="warning-text">{{ trace.content || 'Agent 已达到最大执行步数限制' }}</div>
          </div>
        </div>
      </div>

      <!-- 运行中指示器 -->
      <div v-if="isRunning()" class="msg-row agent">
        <div class="avatar agent-avatar">🤖</div>
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!taskInstruction && traces.length === 0" class="empty-chat">
        <div class="empty-icon">🤖</div>
        <div class="empty-title">FilePilot Agent</div>
        <div class="empty-desc">
          在下方输入框中输入你的文件操作指令，<br>
          Agent 将自主调用工具完成任务。
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--main-bg);
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── 消息行 ── */
.msg-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  max-width: 100%;
}
.msg-row.user {
  justify-content: flex-end;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.user-avatar { background: var(--accent); }
.agent-avatar { background: #e8eaf0; }

/* ── 用户气泡 ── */
.bubble {
  max-width: 70%;
  padding: 10px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}
.user-bubble {
  background: var(--user-bubble);
  color: var(--user-bubble-text);
  border-bottom-right-radius: 4px;
}

/* ── Agent Trace 卡片 ── */
.trace-card {
  max-width: 75%;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  border-bottom-left-radius: 4px;
  overflow: hidden;
  box-shadow: var(--shadow);
}
.trace-card.final {
  border-color: var(--success);
  border-left: 3px solid var(--success);
}
.trace-card.max_steps_reached {
  border-color: var(--warning);
  border-left: 3px solid var(--warning);
}

.trace-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid var(--border-color);
}
.trace-icon { font-size: 14px; }
.trace-type {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.trace-type.llm_thinking { color: #8b5cf6; }
.trace-type.tool_call { color: var(--accent); }
.trace-type.final { color: var(--success); }
.trace-type.max_steps_reached { color: var(--warning); }

.trace-step {
  font-size: 11px;
  color: var(--text-muted);
  margin-left: auto;
}
.trace-time {
  font-size: 11px;
  color: var(--text-muted);
}

.trace-body {
  padding: 10px 12px;
}

.thinking-text, .final-text {
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}
.final-text { font-weight: 500; }

.markdown-body p { margin: 0 0 8px; }
.markdown-body p:last-child { margin-bottom: 0; }
.markdown-body ul, .markdown-body ol { margin: 0 0 8px; padding-left: 20px; }
.markdown-body li { margin-bottom: 4px; }
.markdown-body h1, .markdown-body h2, .markdown-body h3,
.markdown-body h4, .markdown-body h5, .markdown-body h6 {
  margin: 12px 0 6px;
  font-weight: 600;
  line-height: 1.4;
}
.markdown-body code {
  background: rgba(0,0,0,0.06);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 13px;
}
.markdown-body pre {
  background: rgba(0,0,0,0.06);
  padding: 10px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0 0 8px;
}
.markdown-body pre code { background: none; padding: 0; }
.markdown-body blockquote {
  margin: 0 0 8px;
  padding-left: 10px;
  border-left: 3px solid rgba(0,0,0,0.15);
  color: rgba(0,0,0,0.6);
}
.markdown-body a { color: #4a90d9; }
.markdown-body strong { font-weight: 600; }

.warning-text {
  font-size: 13px;
  color: var(--warning);
  font-weight: 500;
}

.tool-name { margin-bottom: 8px; }
.tool-badge {
  display: inline-block;
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent);
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.args-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  margin-bottom: 4px;
}
.tool-args { margin-bottom: 8px; }

.code-block {
  background: #1e1f26;
  color: #e0e0e8;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre;
}

.tool-result { margin-top: 8px; }
.result-text {
  font-size: 13px;
  color: var(--text-secondary);
  background: #f8f9fa;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  border-left: 2px solid var(--success);
  white-space: pre-wrap;
  word-break: break-word;
}

/* ── 运行中指示器 ── */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  border-bottom-left-radius: 4px;
}
.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-muted);
  animation: bounce 1.4s infinite;
}
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-8px); opacity: 1; }
}

/* ── 空状态 ── */
.empty-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
}
.empty-icon { font-size: 48px; }
.empty-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}
.empty-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.8;
}
</style>
