# Analysis of Pi-Link and Pi-Swarm (Communication & Coordination)

## Executive Summary
This report analyzes the low-level communication mechanisms of `pi-link` and the intended swarm coordination patterns. `pi-link` provides a lightweight, WebSocket-based transport layer for inter-terminal communication, enabling a hub-and-spoke architecture for multi-agent orchestration. While a dedicated `pi-swarm` repository was not found in the provided reference material, the "swarm" logic is implementable atop `pi-link` through specific coordination patterns.

**Relevance Score: 8/10**
`pi-link` is highly relevant as a transport layer for a factory-wide network due to its simplicity, low overhead, and native integration with Pi terminals. It allows for asynchronous delegation, status tracking, and synchronous RPC-style prompting.

---

## 1. Pi-Link: Low-Level Communication Analysis

### Architecture
`pi-link` employs a **Hub-and-Spoke (Star) Topology**.
- **Hub:** The first terminal to start acts as the central router, hosting a `WebSocketServer` on `127.0.0.1:9900`.
- **Clients:** Subsequent terminals connect as clients. All inter-terminal traffic is routed through the hub.
- **Auto-Discovery:** A simple fallback mechanism allows any terminal to either join an existing hub or become the new hub if none exists.

### Protocol Specification
The protocol uses JSON-serialized messages over WebSockets. Key message types include:
- **`register` / `welcome`**: Handshake for identity and initial state (CWD, status).
- **`chat`**: Fire-and-forget messaging. Supports `triggerTurn: true` to automatically kick off an LLM turn on the receiver.
- **`prompt_request` / `prompt_response`**: Implementation of a synchronous RPC pattern. The sender waits for the receiver's LLM to complete a task and return a result.
- **`status_update`**: Real-time broadcast of agent state (`idle`, `thinking`, or `tool:<tool_name>`).

### Critical Analysis for Factory Network
- **Pros:**
    - **Zero Configuration:** Automatic hub promotion and discovery.
    - **State Awareness:** Peer terminals can see each others' CWDs and current activities, enabling "intelligent" task routing.
    - **Synchronous Delegation:** The `link_prompt` mechanism allows an orchestrator to treat other agents as function calls.
- **Cons:**
    - **Single Point of Failure:** The hub is a bottleneck and potential failure point (though race-based promotion mitigates this).
    - **Localhost Only:** Hardcoded to `127.0.0.1`, meaning it cannot currently bridge physical machine boundaries without modification.
    - **No Queuing:** Remote prompts are rejected if the target is busy, requiring the orchestrator to handle retries.

---

## 2. Swarm Coordination Logic

Although a separate `pi-swarm` codebase was not identified, the "swarm" behavior is emergent from `pi-link`'s capabilities:

### Coordination Patterns
1. **Orchestrator/Worker:** One terminal uses `link_prompt` to delegate sub-tasks to specialized workers and aggregates results.
2. **Fan-out:** Large tasks are split across multiple terminals (e.g., Frontend agent vs. Backend agent).
3. **Review Pipeline:** a "Builder" agent sends code to a "Reviewer" agent via `link_send`, who then responds with corrections.

### Transport Layer Suitability
`pi-link` is an excellent candidate for the factory-wide network's transport layer because it treats the LLM not just as a chat bot, but as a routable service. The ability to trigger turns and wait for responses transforms a collection of terminals into a cohesive swarm.

---

## 3. Final Assessment & Recommendations

### Relevance Score: 8/10

### Recommendations for Factory Integration:
- **Extend to LAN:** Modify the hardcoded `127.0.0.1` to allow binding to network interfaces, enabling a true distributed factory of terminals.
- **Implement Task Queuing:** Replace the "Terminal is busy" rejection with a message queue to improve swarm reliability.
- **Formalize Roles:** Define specific "Caste" identifiers in the `register` message (e.g., `worker`, `scout`, `coordinator`) to simplify discovery and routing.
