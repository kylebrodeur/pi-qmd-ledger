import type { ExtensionAPI, BeforeAgentStartEvent, TurnEndEvent, ExtensionContext } from '@mariozechner/pi-coding-agent';
import * as fs from 'fs';
import { ensureDir, getPiContextConfig, hasPiContextTools, loadConfig } from './utils.js';

/**
 * Handles before_agent_start to inject ledger entries and pi-context tag matches
 * into the system prompt.
 */
export const handleBeforeAgentStart = async (
    pi: ExtensionAPI,
    event: BeforeAgentStartEvent,
    ctx: ExtensionContext
): Promise<{ systemPrompt?: string } | void> => {
    const cfg = loadConfig(ctx.cwd);
    let additions = '';

    // 1. Standard injector matching
    for (const ij of cfg.injectors) {
        const regex = new RegExp(ij.regex, 'i');
        const match = event.prompt.match(regex);
        if (!match) continue;

        const capture = match[ij.captureGroup ?? 1];
        const ledger = cfg.ledgers[ij.ledger];
        if (!ledger) continue;

        let entriesText = '';
        if (fs.existsSync(ledger.path)) {
            const lines = fs
                .readFileSync(ledger.path, 'utf-8')
                .split('\n')
                .filter(Boolean);
            const hits: unknown[] = [];
            for (const line of lines) {
                try {
                    const e = JSON.parse(line);
                    if (!ij.filterField || e[ij.filterField] === capture) hits.push(e);
                } catch {
                    /* ignore */
                }
            }
            entriesText = JSON.stringify(hits, null, 2);
        }

        const artifactText =
            ij.artifactPath && fs.existsSync(ij.artifactPath)
                ? fs.readFileSync(ij.artifactPath, 'utf-8')
                : '';

        const tmpl =
            ij.template ??
            `\n\n=== {{injector}} CONTEXT [capture={{capture}}] ===\nENTRIES:\n{{entries}}\nARTIFACT:\n{{artifact}}\n`;

        additions += tmpl
            .replace(/\{\{injector\}\}/g, ij.name)
            .replace(/\{\{capture\}\}/g, capture ?? '')
            .replace(/\{\{entries\}\}/g, entriesText || '(none)')
            .replace(/\{\{artifact\}\}/g, artifactText || '(none)');
    }

    if (additions) {
        return { systemPrompt: event.systemPrompt + additions };
    }

    // 2. pi-context integration: auto-ACM and tag-based triggers
    const piContextCfg = getPiContextConfig(cfg);
    if (piContextCfg.enabled) {
        if (piContextCfg.autoEnableAcm) {
            pi.sendMessage(
                {
                    customType: 'pi-context',
                    content: '/acm',
                    display: false,
                },
                {
                    deliverAs: 'followUp',
                }
            );
        }

        if (piContextCfg.tagPatterns && piContextCfg.tagPatterns.length > 0) {
            try {
                const allTools = pi.getAllTools();
                const contextLogTool = allTools.find((t) => t.name === 'context_log');
                if (contextLogTool) {
                    const logs = await (contextLogTool as any).execute?.(
                        null,
                        { limit: 100, verbose: true },
                        null,
                        null,
                        ctx
                    );

                    if (logs && logs.content && logs.content[0]?.text) {
                        const logText = logs.content[0].text;

                        for (const pattern of piContextCfg.tagPatterns) {
                            const tagRegex = new RegExp(pattern, 'i');
                            const tagMatches = logText.match(/tag:\s*([\w-]+)/gi);

                            if (tagMatches) {
                                for (const match of tagMatches) {
                                    const tagValue = match.replace(/tag:\s*/i, '');
                                    if (tagRegex.test(tagValue)) {
                                        for (const [ledgerName, ledgerDef] of Object.entries(cfg.ledgers)) {
                                            if (ledgerDef.schema.includes('tag') && fs.existsSync(ledgerDef.path)) {
                                                const lines = fs.readFileSync(ledgerDef.path, 'utf-8').split('\n').filter(Boolean);
                                                const hits = lines
                                                    .map((l) => {
                                                        try {
                                                            return JSON.parse(l);
                                                        } catch {
                                                            return null;
                                                        }
                                                    })
                                                    .filter((e) => e && e.tag === tagValue);

                                                if (hits.length > 0) {
                                                    additions += `\n\n=== pi-context tag [${tagValue}] matched ${ledgerName} ===\n${JSON.stringify(hits, null, 2)}\n`;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn('[pi-qmd-ledger] pi-context tag integration error:', e);
            }
        }
    }

    if (additions) {
        return { systemPrompt: event.systemPrompt + additions };
    }
};

/**
 * Handles turn_end to capture pi-context events and append them to the
 * context_events ledger.
 */
export const handleTurnEnd = async (
    pi: ExtensionAPI,
    _event: TurnEndEvent,
    ctx: ExtensionContext
): Promise<void> => {
    const cfg = loadConfig(ctx.cwd);
    const piContextCfg = getPiContextConfig(cfg);
    const hasPiContext = hasPiContextTools(pi);

    if (!hasPiContext || !piContextCfg.enabled || !piContextCfg.indexContextEvents) {
        return;
    }

    try {
        if (!hasPiContextTools(pi)) {
            return;
        }

        const allTools = pi.getAllTools();
        const contextLogTool = allTools.find((t) => t.name === 'context_log');
        const contextCheckoutTool = allTools.find((t) => t.name === 'context_checkout');
        if (!contextLogTool || !contextCheckoutTool) {
            return;
        }

        const ledgerDef = cfg.ledgers['context_events'];
        if (!ledgerDef) {
            console.warn(
                "[pi-qmd-ledger] 'context_events' ledger not defined in config. Cannot index pi-context events."
            );
            return;
        }

        // Get current session history
        const logs = await (contextLogTool as any).execute?.(
            null,
            { limit: 100, verbose: true },
            null,
            null,
            ctx
        );

        if (!logs || !logs.content || !logs.content[0]?.text) {
            return;
        }
        const logText = logs.content[0].text;

        interface ContextCapturedEvent {
            id: string;
            type: string;
            session_entry_id: string;
            content: string;
            timestamp: string;
            tags: string[];
            details?: Record<string, string>;
        }

        const capturedEvents: ContextCapturedEvent[] = [];
        const lines = logText.split('\n');

        lines.forEach((line) => {
            const timestamp = new Date().toISOString();
            let event: ContextCapturedEvent | null = null;

            const tagMatch = line.match(
                /^\*?\s*([0-9a-f]+)\s+\(tag:\s*([\w-]+).*\)\s*\[(AI|USER|BASH|TOOL|SUMMARY)\]\s*(.*)/i
            );
            if (tagMatch) {
                event = {
                    id: `tag-${tagMatch[1]}-${tagMatch[2]}`,
                    type: 'tag_created',
                    session_entry_id: tagMatch[1],
                    content: `Tag '${tagMatch[2]}' created at ${tagMatch[1]}`,
                    timestamp,
                    tags: [tagMatch[2], 'pi-context'],
                    details: {
                        tag_name: tagMatch[2],
                        entry_id: tagMatch[1],
                        entry_type: tagMatch[3],
                        entry_summary: tagMatch[4].trim(),
                    },
                };
            }

            const summaryMatch = line.match(
                /^\*?\s*([0-9a-f]+)\s+\((ROOT|HEAD)?.*summary from (.*)\)\s*\[SUMMARY\]\s*(.*)/i
            );
            if (summaryMatch) {
                event = {
                    id: `checkout-summary-${summaryMatch[1]}`,
                    type: 'checkout_summary',
                    session_entry_id: summaryMatch[1],
                    content: `Checkout summary from ${summaryMatch[3]}: ${summaryMatch[4].trim()}`,
                    timestamp,
                    tags: ['pi-context', 'checkout', 'summary'],
                    details: {
                        origin: summaryMatch[3],
                        summary_message: summaryMatch[4].trim(),
                        entry_id: summaryMatch[1],
                    },
                };
            }

            if (event) {
                capturedEvents.push(event);
            }
        });

        // Append events directly to ledger
        if (ledgerDef) {
            ensureDir(ledgerDef.path);

            let existingIds = new Set<string>();
            if (ledgerDef.dedupField && fs.existsSync(ledgerDef.path)) {
                const data = fs.readFileSync(ledgerDef.path, 'utf-8');
                for (const line of data.split('\n').filter(Boolean)) {
                    try {
                        existingIds.add(JSON.parse(line)[ledgerDef.dedupField]);
                    } catch {
                        /* ignore malformed */
                    }
                }
            }

            for (const event of capturedEvents) {
                if (ledgerDef.dedupField && existingIds.has(event[ledgerDef.dedupField])) {
                    continue;
                }
                fs.appendFileSync(ledgerDef.path, JSON.stringify(event) + '\n');
                if (ledgerDef.dedupField) existingIds.add(event[ledgerDef.dedupField]);
            }
        }
    } catch (e) {
        console.error('[pi-qmd-ledger] Error capturing pi-context events:', e);
    }
};