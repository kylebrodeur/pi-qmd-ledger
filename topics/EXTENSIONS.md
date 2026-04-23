# Extension Compatibility in pi-qmd-ledger

The `pi-qmd-ledger` extension is designed to progressively enhance its capabilities by optionally integrating with other `pi` extensions when they are available in the user's environment. This document outlines the architecture and configuration for managing these integrations, starting with `pi-context`.

## Architectural Principles

1.  **No Hard Dependencies**: `pi-qmd-ledger` does not require any integrated extensions (like `pi-context`) to be installed. Its core functionality remains independent.
2.  **Runtime Detection**: Integrations are only activated if the target extension's tools are detected at runtime via the `ExtensionContext.toolMap`.
3.  **Configurable Opt-in**: Users have explicit control over enabling or disabling these integrations through the `pi-qmd-ledger.config.json` file.
4.  **Graceful Degradation**: If an integrated extension is configured but not installed, `pi-qmd-ledger` will continue to function normally, simply without the enhanced features.

## Configuration

Extension compatibility settings are managed under the `extensionCompatibility` section in your `pi-qmd-ledger.config.json`.

Example configuration:

```json
{
  "version": 2,
  "ledgers": {
    // ...
  },
  "injectors": [
    // ...
  ],
  "extensionCompatibility": {
    "pi-context": {
      "enabled": true,
      "autoEnableAcm": true,
      "tagPatterns": ["tag:\\s+(\\S+)", "draft.*"],
      "enhanceInjectors": true
    }
  }
}
```

### `pi-context` Specific Settings

The `pi-context` integration offers the following configuration options:

| Key               | Type      | Default   | Description                                                                                                                                                                                                                                                                                                                           |
| :---------------- | :-------- | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`         | `boolean` | `false`   | Set to `true` to enable integration with `pi-context`.                                                                                                                                                                                                                                                                              |
| `autoEnableAcm`   | `boolean` | `true`    | If `true`, `pi-qmd-ledger` will automatically trigger the `/acm` command (Agentic Context Management) via a hidden `pi.sendMessage` at the start of a turn if `pi-context` is installed and enabled. This ensures `context_checkout` functionality is linked to the current session without manual intervention.                  |
| `tagPatterns`     | `string[]`| `[]`      | An array of regex patterns. If a pattern matches a `pi-context` tag found in the `context_log`, `pi-qmd-ledger` will automatically query relevant ledgers for entries matching that tag and inject them into the system prompt. This allows context tags to dynamically drive ledger content injection.                           |
| `enhanceInjectors`| `boolean` | `false`   | (Future Work) If `true`, `pi-qmd-ledger`'s native injectors will also consider `pi-context`'s state (e.g., active branch, current tag) when determining what content to inject. Currently, this flag is a placeholder for future enhancements.                                                                                |

## Commands for Management

Several new commands have been added to help you manage extension integrations:

*   **`/qmd-enable-pi-context [enable|disable]`**:
    Toggles the `enabled` setting for `pi-context` integration in your configuration. This is the primary way to activate or deactivate the integration.
*   **`/qmd-list-extensions`**:
    Displays a summary of all configured and detected extension integrations.
*   **`/qmd-extension-status`**:
    Provides a detailed report on the status of each configured extension, including its enabled state, detection status, and specific settings.
*   **`/qmd-init`**:
    When scaffolding a new configuration, `/qmd-init` now includes a default `extensionCompatibility` section with `pi-context` integration disabled.

## How `pi-context` Integration Works

1.  **`before_agent_start` Hook**: `pi-qmd-ledger` listens to the global `pi.on('before_agent_start')` event.
2.  **`autoEnableAcm`**: If `pi-context` is detected and `autoEnableAcm` is true, a hidden `pi.sendMessage` command for `/acm` is issued. This ensures `pi-context`'s internal session context is set up without user interaction.
3.  **Tag-based Injection**: `pi-qmd-ledger` queries `pi-context`'s `context_log` to retrieve recent tags. If any of these tags match the configured `tagPatterns`, `pi-qmd-ledger` will search its ledgers for entries that also match that tag. These matching ledger entries are then dynamically injected into the current system prompt.
4.  **No Direct Calling**: `pi-qmd-ledger` does not directly call `pi-context`'s internal functions or directly manipulate its state (other than triggering the `/acm` command indirectly). It relies on `pi-context`'s exposed tools and the `pi` event system.

This progressive enhancement approach ensures that `pi-qmd-ledger` can benefit from advanced context management features provided by `pi-context` when available, while maintaining its core functionality for all users.
