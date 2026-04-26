import type { ExtensionContext } from '@mariozechner/pi-coding-agent';
import { getActiveLedger } from './state.js';

export const WIDGET_KEY = 'pi-qmd-ledger-active';

export const updateActiveLedgerWidget = (ctx: ExtensionContext) => {
    const active = getActiveLedger(ctx.cwd);
    
    // We use a component-based widget to style it nicely above the editor
    // If ctx.ui.setWidget doesn't support the callback in older versions, 
    // it will just fall back, but we pass strings.
    // However, the doc says string arrays are supported for RPC and function callbacks for TUI.
    // The doc also says: ctx.ui.setWidget("my-widget", ["Line 1", "Line 2"], { placement: "aboveEditor" });
    
    const lines = [`[Active Ledger: ${active}]`];
    ctx.ui.setWidget(WIDGET_KEY, lines, { placement: 'aboveEditor' });
};
