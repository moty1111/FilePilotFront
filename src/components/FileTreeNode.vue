<script setup>
import { ref } from 'vue'

/**
 * 递归文件树节点组件。
 * 通过文件名自动实现自引用递归。
 */
const props = defineProps({
  node: { type: Object, required: true },
  depth: { type: Number, default: 0 },
  activePath: { type: String, default: '' },
})

const emit = defineEmits(['select-file'])

const expanded = ref(true)

function toggle() {
  if (props.node.type === 'directory') {
    expanded.value = !expanded.value
  }
}

function onClick() {
  if (props.node.type === 'file') {
    emit('select-file', props.node.path)
  } else {
    toggle()
  }
}

function fileIcon(name) {
  if (name.endsWith('.md')) return '\u{1F4DD}'
  if (name.endsWith('.csv')) return '\u{1F4CA}'
  if (name.endsWith('.json') || name.endsWith('.jsonl')) return '\u{1F4E6}'
  if (name.endsWith('.log')) return '\u{1F4CB}'
  if (name.endsWith('.txt')) return '\u{1F4C4}'
  if (name.endsWith('.py')) return '\u{1F40D}'
  return '\u{1F4C4}'
}
</script>

<template>
  <div class="tree-node">
    <div
      class="tree-row"
      :class="{
        active: node.type === 'file' && activePath === node.path,
        directory: node.type === 'directory',
      }"
      :style="{ paddingLeft: depth * 16 + 12 + 'px' }"
      @click="onClick"
    >
      <span v-if="node.type === 'directory'" class="arrow">
        {{ expanded ? '\u25BE' : '\u25B8' }}
      </span>
      <span v-else class="arrowPlaceholder"></span>

      <span class="icon">
        {{ node.type === 'directory' ? (expanded ? '\u{1F4C2}' : '\u{1F4C1}') : fileIcon(node.name) }}
      </span>

      <span class="name">{{ node.name }}</span>
      <span v-if="node.type === 'file' && node.size != null" class="size">
        {{ node.size < 1024 ? node.size + 'B' : (node.size / 1024).toFixed(1) + 'KB' }}
      </span>
    </div>

    <!-- 递归渲染子节点 -->
    <div v-if="node.type === 'directory' && expanded && node.children?.length">
      <FileTreeNode
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :depth="depth + 1"
        :active-path="activePath"
        @select-file="emit('select-file', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.tree-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  cursor: pointer;
  border-radius: 4px;
  white-space: nowrap;
  transition: background 0.15s;
}
.tree-row:hover { background: var(--sidebar-hover); }
.tree-row.active {
  background: rgba(59, 130, 246, 0.2);
  color: #fff;
}
.arrow {
  width: 12px;
  font-size: 10px;
  color: var(--sidebar-text-dim);
  text-align: center;
  flex-shrink: 0;
}
.arrowPlaceholder { width: 12px; flex-shrink: 0; }
.icon { flex-shrink: 0; font-size: 13px; }
.name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
}
.size {
  font-size: 11px;
  color: var(--sidebar-text-dim);
  flex-shrink: 0;
}
</style>
