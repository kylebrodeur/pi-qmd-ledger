# Research Infrastructure Index

This document serves as the centralized directory for the tools, databases, and guides used to drive the research and synthesis process for the Microfactory Book.

## 🛠️ Core Infrastructure

| Component | File Path | Purpose |
| :--- | :--- | :--- |
| **Canonical DB** | `docs/_research/research-unified.json` | The single source of truth for all evaluated repos, models, and datasets. |
| **The "How-To"** | `docs/_research/EXECUTION_GUIDE.md` | Tactical instructions for model pulling, batch extraction, and tool usage. |
| **The "Strategy"** | `docs/_research/UNIFIED_RESEARCH_PLAN.md` | High-level methodology and the phased research roadmap. |
| **The "Map"** | `docs/_research/research-synthesis/INTEGRATION_BLUEPRINT.md` | Mapping of specific research findings to book chapters and artifacts. |
| **The "Tasks"** | `docs/_research/research-synthesis/TODO.md` | Tracking for pending reviews and integration points. |

## ⚙️ Automation Tooling

- **Update Script**: `scripts/research/update_unified_repos.py`
  - *Function*: Merges raw JSON/TXT sources from `repos/`, `models/`, and `datasets/` into the canonical `research-unified.json`.

## 📂 Directory Organization (LLM-Wiki Map)

This index maps the entire `docs/` directory, distinguishing between **Wiki Pages** (synthesized, LLM-maintained files with YAML frontmatter) and **Raw Sources** (immutable external clones or exports).

### 📝 Wiki Pages (Synthesized Knowledge)
These directories contain active synthesis and narrative decisions. They are continually updated and require valid YAML frontmatter for querying.
- **`docs/_research/research-synthesis/`**: High-level synthesis and book mapping documents (e.g., `INTEGRATION_BLUEPRINT.md`).
- **`docs/_research/research-review-v2/final/`**: Final high-fidelity research reports (e.g., `V2_RESEARCH_REPORT_FINAL.md`).
- **`docs/_research/research-review-v2/`**: Advanced agentic synthesis loop results (Raw mining $\rightarrow$ Grounded synthesis $\rightarrow$ Final Report).
- **`docs/_story/`**: Project vision, narrative structures, and story integration (e.g., `VISION.md`, `PERSONAL_STORY_INTEGRATION.md`).
- **`docs/_reviews/`**: Architectural decisions and agent benchmarking results (e.g., `model-benchmarking/llm-model-benchmarking.md`).

### 📦 Raw Sources (Immutable)
These directories contain external facts, datasets, and raw exports. They are read-only and *do not* require YAML tagging.
- **`docs/_reference/`**: Cloned external git repositories (e.g., `warp/`, `pi-grove/`). *Do not index or modify these files.*
- **`docs/_research/repos/`**: Raw curated lists, deep dives, and extracted code-scents.
- **`docs/_research/models/`**: HuggingFace model evaluations and registries.
- **`docs/_research/datasets/`**: Manufacturing dataset catalogs and analyses.
- **`docs/_research/research-notebooks/`**: Raw audio and JSON exports from NotebookLM or other external agents.

### 🗄️ Historical
- **`docs/_archive/`**: Superseded documentation and historical artifacts (still valid as sources if referenced in the Map/Tasks).
