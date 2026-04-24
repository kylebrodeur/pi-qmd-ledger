import type { ExtensionAPI } from '@mariozechner/pi-coding-agent'
import * as fs from 'fs'
import * as path from 'path'
import { EXT_ROOT } from './utils.js'
import { registerCommands } from './commands.js'
import { registerTools } from './tools.js'
import { handleBeforeAgentStart, handleTurnEnd } from './events.js'

export default function (pi: ExtensionAPI) {
  /* ── expose skills directory ── */
  pi.on('resources_discover', async (_event) => {
    const skillsDir = path.join(EXT_ROOT, 'skills')
    return fs.existsSync(skillsDir) ? { skillPaths: [skillsDir] } : {}
  })

  /* ── register commands ── */
  registerCommands(pi)

  /* ── register tools ── */
  registerTools(pi)

  /* ── before_agent_start: dynamic injectors ── */
  pi.on('before_agent_start', async (event, ctx) => {
    return handleBeforeAgentStart(pi, event, ctx)
  })

  /* ── turn_end: capture pi-context events ── */
  pi.on('turn_end', async (event, ctx) => {
    return handleTurnEnd(pi, event, ctx)
  })
}
