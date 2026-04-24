export interface LedgerDef {
  path: string
  schema: string[]
  dedupField?: string
}

export interface InjectorDef {
  name: string
  regex: string
  captureGroup?: number
  ledger: string
  filterField?: string
  artifactPath?: string
  template?: string
}

export interface QmdDef {
  binary?: string
  defaultLimit?: number
  maxBuffer?: number
}

export interface PiContextDef {
  enabled?: boolean
  tagPatterns?: string[]
  enhanceInjectors?: boolean
  autoEnableAcm?: boolean
  indexContextEvents?: boolean
}

export interface UniversalConfig {
  version: number
  ledgers: Record<string, LedgerDef>
  injectors: InjectorDef[]
  qmd: QmdDef
  extensionCompatibility?: {
    'pi-context'?: PiContextDef
  }
}

export const DEFAULT_CONFIG: UniversalConfig = {
  version: 2,
  ledgers: {
    master: {
      path: 'ledger/master.jsonl',
      schema: ['id', 'domain', 'source', 'fact', 'tag', 'artifact'],
      dedupField: 'fact',
    },
    pending: {
      path: 'ledger/pending.jsonl',
      schema: 'master' as unknown as string[],
    },
    context_events: {
      path: 'ledger/context_events.jsonl',
      schema: ['id', 'type', 'session_entry_id', 'content', 'timestamp', 'tags'],
      dedupField: 'id',
    },
  },
  injectors: [
    {
      name: 'draft-context',
      regex: 'draft\\s+(\\S+)',
      ledger: 'master',
      filterField: 'tag',
      artifactPath: 'ledger/artifact.md',
    },
  ],
  qmd: {
    binary: 'qmd',
    defaultLimit: 5,
    maxBuffer: 10 * 1024 * 1024,
  },
  extensionCompatibility: {
    'pi-context': {
      enabled: false,
      tagPatterns: [],
      enhanceInjectors: false,
      autoEnableAcm: true,
      indexContextEvents: true,
    },
  },
}

export interface QmdCheckResult {
  ok: boolean
  version?: string
  instructions?: string
}
