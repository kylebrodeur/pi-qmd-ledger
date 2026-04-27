# TODO

This file tracks planned enhancements to the `pi-qmd-ledger` extension, particularly focusing on improving the human-facing configuration interface (currently reliant on manual JSON editing).

## TUI Configuration Management

*   **[x] Create `/qmd-settings` Interactive Dashboard**
    *   Implement a comprehensive TUI menu (`Container` with `SelectList` and `Input` components).
    *   Allow users to view current settings, navigate between Ledgers, Injectors, QMD, and Extension settings, and apply changes visually.
    *   *Reference Task ID: 9*

*   **[x] Create `/qmd-ledger-create` Interactive Wizard**
    *   Prompt the user for a new Ledger name.
    *   Prompt for the file path (defaulting to `ledger/<name>.jsonl`).
    *   Prompt for schema fields (comma-separated list).
    *   Prompt for an optional `dedupField`.
    *   Automatically update the `pi-qmd-ledger.config.json` and scaffold the empty `.jsonl` file.
    *   *Reference Task ID: 10*

*   **[x] Create `/qmd-injector-create` Interactive Wizard**
    *   Guide the user through setting up a new prompt injector context trigger.
    *   Prompt for the injector name, regex pattern, target ledger, and filter field.
    *   Persist the new injector block to the configuration file.
    *   *Reference Task ID: 11*

## Long-term SDK Integrations

*   **[ ] Pi SDK Settings Menu Support**
    *   If/when the Pi SDK introduces a standardized settings registry panel for extensions, map `UniversalConfig` properties to the Pi native settings panel.
