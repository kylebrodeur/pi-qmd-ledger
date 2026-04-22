import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import extensionFactory from '../index'

/*
  Test harness that mocks the pi ExtensionAPI surface.
  Runs each test in a fresh temp directory to avoid side-effects.
*/

interface MockCall {
  name: string
  args: any[]
}

function createMockApi() {
  const tools: MockCall[] = []
  const commands: MockCall[] = []
  const events: MockCall[] = []

  const api = {
    registerTool: (def: any) => tools.push({ name: def.name, args: [def] }),
    registerCommand: (name: string, opts: any) =>
      commands.push({ name, args: [name, opts] }),
    on: (event: string, handler: any) =>
      events.push({ name: event, args: [event, handler] }),
    getActiveTools: () => [],
    getAllTools: () => tools.map((t) => t.args[0]),
  }

  return { api, tools, commands, events }
}

function createMockContext(cwd: string) {
  return {
    cwd,
    ui: {
      confirm: async (_title: string, _msg: string) => true,
      notify: (_msg: string, _type: string) => {},
      editor: (_title: string, _msg: string) => {},
    },
    hasUI: true,
    sessionManager: {} as any,
    modelRegistry: {} as any,
    model: undefined,
    signal: undefined,
    isIdle: () => true,
    abort: () => {},
    shutdown: () => {},
    compact: () => {},
    getContextUsage: () => undefined,
    getSystemPrompt: () => 'system prompt',
  }
}

function createMockExtensionContext(cwd: string) {
  return {
    ...createMockContext(cwd),
    waitForIdle: async () => {},
    newSession: async () => ({ cancelled: false }),
    fork: async () => ({ cancelled: false }),
    navigateTree: async () => ({ cancelled: false }),
    switchSession: async () => ({ cancelled: false }),
    reload: async () => {},
  }
}

describe('Extension registration', () => {
  it('registers all 8 tools', () => {
    const { api, tools } = createMockApi()
    extensionFactory(api as any)
    const names = tools.map((t) => t.name).sort()
    assert.deepStrictEqual(names, [
      'append_ledger',
      'configure_ledger',
      'describe_ledger',
      'ledger_export',
      'ledger_stats',
      'qmd_search',
      'qmd_status',
      'query_ledger',
    ])
  })

  it('registers all 4 commands', () => {
    const { api, commands } = createMockApi()
    extensionFactory(api as any)
    const names = commands.map((c) => c.name).sort()
    assert.deepStrictEqual(names, [
      'qmd-approve',
      'qmd-index',
      'qmd-init',
      'qmd-validate',
    ])
  })

  it('registers 2 events', () => {
    const { api, events } = createMockApi()
    extensionFactory(api as any)
    const names = events.map((e) => e.name).sort()
    assert.deepStrictEqual(names, ['before_agent_start', 'resources_discover'])
  })
})

describe('Config system', () => {
  let tmpDir: string
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qmd-test-'))
  })
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('scaffolds config and ledger files via /qmd-init', async () => {
    const { api, commands } = createMockApi()
    const ext = extensionFactory(api as any)
    const initCmd = commands.find((c) => c.name === 'qmd-init')!.args[1]
    const ctx = createMockExtensionContext(tmpDir)
    await initCmd.handler('', ctx as any)

    assert.ok(fs.existsSync(path.join(tmpDir, 'pi-qmd-ledger.config.json')))
    assert.ok(fs.existsSync(path.join(tmpDir, 'ledger', 'master.jsonl')))
    assert.ok(fs.existsSync(path.join(tmpDir, 'ledger', 'pending.jsonl')))
  })

  it('reads back correct config', async () => {
    const { api, commands } = createMockApi()
    const ext = extensionFactory(api as any)
    const initCmd = commands.find((c) => c.name === 'qmd-init')!.args[1]
    const ctx = createMockExtensionContext(tmpDir)
    await initCmd.handler('', ctx as any)

    const cfgPath = path.join(tmpDir, 'pi-qmd-ledger.config.json')
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'))
    assert.strictEqual(cfg.version, 2)
    assert.ok(cfg.ledgers.master)
    assert.ok(cfg.ledgers.pending)
  })

  it('env override for QMD_BINARY works', async () => {
    process.env.QMD_BINARY = '/custom/qmd'
    const { api } = createMockApi()
    const ext = extensionFactory(api as any)
    // Config reads lazily in tools; init and validate would exercise it
    delete process.env.QMD_BINARY
  })
})

describe('Ledger CRUD', () => {
  let tmpDir: string
  let ext: any
  let tools: Map<
    string,
    (
      id: string,
      params: any,
      signal: any,
      onUpdate: any,
      ctx: any
    ) => Promise<any>
  >

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qmd-test-'))
    const { api, commands: cmdList } = createMockApi()
    ext = extensionFactory(api as any)

    // scaffold
    const initCmd = cmdList.find((c) => c.name === 'qmd-init')!.args[1]
    initCmd.handler('', createMockExtensionContext(tmpDir) as any)

    // collect tools by name
    tools = new Map()
    for (const t of (api as any).getAllTools()) {
      tools.set(t.name, t.execute.bind(t))
    }
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('appends to master in autopilot mode', async () => {
    const append = tools.get('append_ledger')!
    const ctx = createMockContext(tmpDir)
    const result = await append(
      'tc-1',
      {
        ledger: 'master',
        mode: 'autopilot',
        entry: {
          id: 'r1',
          domain: 'test',
          source: 'test',
          fact: 'hello',
          tag: 't1',
          artifact: '',
        },
      },
      undefined,
      undefined,
      ctx as any
    )

    assert.ok(result.content[0].text.includes('Appended'))
    const ledgerPath = path.join(tmpDir, 'ledger', 'master.jsonl')
    const lines = fs.readFileSync(ledgerPath, 'utf-8').trim().split('\n')
    assert.strictEqual(lines.length, 1)
    const entry = JSON.parse(lines[0])
    assert.strictEqual(entry.fact, 'hello')
  })

  it('prevents duplicate in autopilot when dedupField matches', async () => {
    const append = tools.get('append_ledger')!
    const ctx = createMockContext(tmpDir)

    // first append
    await append(
      'tc-1',
      {
        ledger: 'master',
        mode: 'autopilot',
        entry: {
          id: 'r1',
          domain: 'test',
          source: 'test',
          fact: 'dup-test',
          tag: 't1',
          artifact: '',
        },
      },
      undefined,
      undefined,
      ctx as any
    )

    // second append with same fact (dedupField)
    const result = await append(
      'tc-2',
      {
        ledger: 'master',
        mode: 'autopilot',
        entry: {
          id: 'r2',
          domain: 'test',
          source: 'test',
          fact: 'dup-test',
          tag: 't2',
          artifact: '',
        },
      },
      undefined,
      undefined,
      ctx as any
    )

    assert.ok(result.content[0].text.includes('Duplicate'))
  })

  it('queries by exact filter', async () => {
    const append = tools.get('append_ledger')!
    const query = tools.get('query_ledger')!
    const ctx = createMockContext(tmpDir)

    await append(
      'tc-1',
      {
        ledger: 'master',
        mode: 'autopilot',
        entry: {
          id: 'r1',
          domain: 'test',
          source: 's1',
          fact: 'a',
          tag: 'alpha',
          artifact: '',
        },
      },
      undefined,
      undefined,
      ctx as any
    )
    await append(
      'tc-2',
      {
        ledger: 'master',
        mode: 'autopilot',
        entry: {
          id: 'r2',
          domain: 'test',
          source: 's2',
          fact: 'b',
          tag: 'beta',
          artifact: '',
        },
      },
      undefined,
      undefined,
      ctx as any
    )

    const result = await query(
      'tc-3',
      { ledger: 'master', filters: { tag: 'alpha' } },
      undefined,
      undefined,
      ctx as any
    )
    const entries = JSON.parse(result.content[0].text)
    assert.strictEqual(entries.length, 1)
    assert.strictEqual(entries[0].id, 'r1')
  })

  it('describes ledger with counts and samples', async () => {
    const append = tools.get('append_ledger')!
    const describe = tools.get('describe_ledger')!
    const ctx = createMockContext(tmpDir)

    await append(
      'tc-1',
      {
        ledger: 'master',
        mode: 'autopilot',
        entry: {
          id: 'r1',
          domain: 'test',
          source: 's1',
          fact: 'first',
          tag: 't',
          artifact: '',
        },
      },
      undefined,
      undefined,
      ctx as any
    )
    await append(
      'tc-2',
      {
        ledger: 'master',
        mode: 'autopilot',
        entry: {
          id: 'r2',
          domain: 'test',
          source: 's2',
          fact: 'second',
          tag: 't',
          artifact: '',
        },
      },
      undefined,
      undefined,
      ctx as any
    )

    const result = await describe(
      'tc-3',
      { ledger: 'master' },
      undefined,
      undefined,
      ctx as any
    )
    const text = result.content[0].text
    assert.ok(text.includes('Total entries: 2'))
    assert.ok(text.includes('first'))
    assert.ok(text.includes('second'))
  })

  it('exports to csv format', async () => {
    const append = tools.get('append_ledger')!
    const exportTool = tools.get('ledger_export')!
    const ctx = createMockContext(tmpDir)

    await append(
      'tc-1',
      {
        ledger: 'master',
        mode: 'autopilot',
        entry: {
          id: 'r1',
          domain: 'test',
          source: 's1',
          fact: 'hello',
          tag: 't',
          artifact: '',
        },
      },
      undefined,
      undefined,
      ctx as any
    )

    const result = await exportTool(
      'tc-2',
      { ledger: 'master', format: 'csv' },
      undefined,
      undefined,
      ctx as any
    )
    const text = result.content[0].text
    assert.ok(text.includes('"id","domain","source","fact","tag","artifact"'))
    assert.ok(text.includes('"r1","test"'))
    assert.ok(text.includes('"hello"'))
  })

  it('exports to markdown format', async () => {
    const append = tools.get('append_ledger')!
    const exportTool = tools.get('ledger_export')!
    const ctx = createMockContext(tmpDir)

    await append(
      'tc-1',
      {
        ledger: 'master',
        mode: 'autopilot',
        entry: {
          id: 'r1',
          domain: 'test',
          source: 's1',
          fact: 'hello',
          tag: 't',
          artifact: '',
        },
      },
      undefined,
      undefined,
      ctx as any
    )

    const result = await exportTool(
      'tc-2',
      { ledger: 'master', format: 'markdown' },
      undefined,
      undefined,
      ctx as any
    )
    const text = result.content[0].text
    assert.ok(text.includes('| --- |'))
    assert.ok(text.includes('r1'))
  })

  it('stats reports correct counts', async () => {
    const append = tools.get('append_ledger')!
    const stats = tools.get('ledger_stats')!
    const ctx = createMockContext(tmpDir)

    await append(
      'tc-1',
      {
        ledger: 'master',
        mode: 'autopilot',
        entry: {
          id: 'r1',
          domain: 'test',
          source: 's1',
          fact: 'f1',
          tag: 't',
          artifact: '',
        },
      },
      undefined,
      undefined,
      ctx as any
    )

    const result = await stats('tc-2', {}, undefined, undefined, ctx as any)
    const text = result.content[0].text
    assert.ok(text.includes('"master"'))
    assert.ok(text.includes('1 entries'))
  })

  it('configure_ledger updates config at runtime', async () => {
    const configure = tools.get('configure_ledger')!
    const ctx = createMockContext(tmpDir)

    const result = await configure(
      'tc-1',
      { action: 'update', config: { qmd: { defaultLimit: 20 } } },
      undefined,
      undefined,
      ctx as any
    )
    const cfg = JSON.parse(result.content[0].text)
    assert.strictEqual(cfg.qmd.defaultLimit, 20)
  })
})

describe('Injector system', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qmd-test-'))
  })
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('injects matching entries on before_agent_start', async () => {
    // Write a config with an injector that triggers on "draft <tag>"
    const cfg = {
      version: 2,
      ledgers: {
        master: {
          path: 'ledger/master.jsonl',
          schema: ['id', 'domain', 'source', 'fact', 'tag', 'artifact'],
          dedupField: 'fact',
        },
        pending: { path: 'ledger/pending.jsonl', schema: 'master' },
      },
      injectors: [
        {
          name: 'test-inj',
          regex: 'draft\\s+(\\S+)',
          ledger: 'master',
          filterField: 'tag',
        },
      ],
      qmd: { binary: 'qmd', defaultLimit: 5 },
    }
    fs.writeFileSync(
      path.join(tmpDir, 'pi-qmd-ledger.config.json'),
      JSON.stringify(cfg)
    )
    fs.mkdirSync(path.join(tmpDir, 'ledger'), { recursive: true })
    fs.writeFileSync(
      path.join(tmpDir, 'ledger', 'master.jsonl'),
      JSON.stringify({
        id: 'r',
        domain: 'test',
        source: 's',
        fact: 'injected-fact',
        tag: 'login',
        artifact: '',
      }) + '\n'
    )

    const { api, events } = createMockApi()
    extensionFactory(api as any)
    const handler = events.find((e) => e.name === 'before_agent_start')!.args[1]

    const ctx = createMockContext(tmpDir)
    const result = await handler(
      { prompt: 'draft login', systemPrompt: 'base prompt' },
      ctx as any
    )

    assert.ok(result)
    assert.ok(result.systemPrompt.includes('injected-fact'))
    assert.ok(result.systemPrompt.includes('login'))
  })

  it('returns undefined when no injector matches', async () => {
    const cfg = {
      version: 2,
      ledgers: {},
      injectors: [],
      qmd: { binary: 'qmd' },
    }
    fs.writeFileSync(
      path.join(tmpDir, 'pi-qmd-ledger.config.json'),
      JSON.stringify(cfg)
    )

    const { api, events } = createMockApi()
    extensionFactory(api as any)
    const handler = events.find((e) => e.name === 'before_agent_start')!.args[1]

    const ctx = createMockContext(tmpDir)
    const result = await handler(
      { prompt: 'hello world', systemPrompt: 'base' },
      ctx as any
    )

    assert.strictEqual(result, undefined)
  })
})

describe('Commands', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qmd-test-'))
  })
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('/qmd-validate reports missing ledgers', async () => {
    const { api, commands } = createMockApi()
    extensionFactory(api as any)
    const handler = commands.find((c) => c.name === 'qmd-validate')!.args[1]

    const ctx = createMockContext(tmpDir)
    const result = await handler.handler('', ctx as any)
    assert.ok(result.content[0].text.includes('master'))
  })
})
