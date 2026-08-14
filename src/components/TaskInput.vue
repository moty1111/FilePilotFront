<script>
import { ref, nextTick } from 'vue'

export default {
  props: {
    disabled: { type: Boolean, default: false },
    placeholder: { type: String, default: '输入文件操作指令，按 Enter 提交...' },
  },
  emits: ['submit'],
  setup(props, { emit }) {
    const text = ref('')
    const textareaRef = ref(null)

    function autoResize() {
      const el = textareaRef.value
      if (!el) return
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 160) + 'px'
    }

    function submit() {
      const trimmed = text.value.trim()
      if (!trimmed || props.disabled) return
      emit('submit', trimmed)
      text.value = ''
      nextTick(autoResize)
    }

    function onKeydown(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        submit()
      }
    }

    return { text, textareaRef, autoResize, submit, onKeydown }
  },
}
</script>

<template>
  <div class="task-input">
    <div class="input-wrapper">
      <textarea
        ref="textareaRef"
        v-model="text"
        class="input-field"
        :placeholder="placeholder"
        :disabled="disabled"
        rows="1"
        @keydown="onKeydown"
        @input="autoResize"
      ></textarea>
      <button
        class="btn-send"
        :disabled="disabled || !text.trim()"
        @click="submit"
      >
        <span v-if="!disabled" class="send-icon">➤</span>
        <span v-else class="dots"><span></span><span></span><span></span></span>
      </button>
    </div>
    <div class="input-hint">
      <kbd>Enter</kbd> 发送 · <kbd>Shift</kbd>+<kbd>Enter</kbd> 换行
    </div>
  </div>
</template>

<style scoped>
.task-input {
  padding: 12px 24px 16px;
  background: var(--card-bg);
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}
.input-wrapper {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  background: var(--main-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 8px 8px 8px 16px;
  transition: border-color 0.15s;
}
.input-wrapper:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.input-field {
  flex: 1;
  border: none;
  outline: none;
  background: none;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  max-height: 160px;
  padding: 4px 0;
}
.input-field::placeholder { color: var(--text-muted); }
.input-field:disabled { cursor: not-allowed; opacity: 0.6; }
.btn-send {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  transition: all 0.15s;
}
.btn-send:hover:not(:disabled) { background: var(--accent-hover); transform: scale(1.05); }
.btn-send:disabled { cursor: not-allowed; opacity: 0.5; }
.send-icon { transform: rotate(180deg); }
.dots { display: flex; gap: 3px; }
.dots span {
  width: 4px; height: 4px; border-radius: 50%; background: #fff;
  animation: bounce 1.4s infinite;
}
.dots span:nth-child(2) { animation-delay: 0.2s; }
.dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}
.input-hint {
  text-align: center;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 8px;
}
kbd {
  background: #e4e6eb;
  border-radius: 3px;
  padding: 1px 5px;
  font-size: 10px;
  font-family: monospace;
}
</style>
