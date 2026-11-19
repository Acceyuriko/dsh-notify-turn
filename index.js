// 任务跑完弹一条系统通知。Windows 用 toast，macOS 用 osascript。
// 挂在预设里，所以每个 agent 一个实例；agent/status 是 agent 作用域事件，
// 一个实例只收到自己这个 agent 的状态，不会串。
// 只对顶层会话（不是子代理）发，且跑够 minSeconds 才发，避免每句短回复都弹。

import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

export const name = 'notify-turn'

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'toast.ps1')
const powershell = `${process.env.SystemRoot ?? 'C:\\Windows'}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`

function run(command, args) {
  const child = spawn(command, args, { detached: true, stdio: 'ignore', windowsHide: true })
  child.on('error', () => {})
  child.unref()
}

function appleString(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '\\n')}"`
}

function show(title, body) {
  if (process.platform === 'darwin') {
    run('osascript', ['-e', `display notification ${appleString(body)} with title ${appleString(title)} sound name "Ping"`])
    return
  }
  run(powershell, [
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
    '-File', script, '-Title', title, '-Body', body,
  ])
}

function taskLabel(agent) {
  try {
    for (const message of agent.session.deriveMessages()) {
      if (message.role !== 'user') continue
      const text = message.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (text) return text.length > 80 ? `${text.slice(0, 80)}…` : text
    }
  } catch {}
  return '会话已跑完'
}

export function apply(ctx, config) {
  const minMs = (config?.minSeconds ?? 10) * 1000
  const started = new WeakMap()
  ctx.on('agent/status', ({ agent, status }) => {
    if (status === 'running') {
      started.set(agent, Date.now())
      return
    }
    const began = started.get(agent)
    started.delete(agent)
    if (began === undefined) return
    if (agent.session.header.origin === 'subagent') return
    if (Date.now() - began < minMs) return
    const title = config?.title ?? 'DSH 任务完成'
    const body = taskLabel(agent)
    ctx.logger.info(`notify-turn: ${body}`)
    show(title, body)
  })
}
