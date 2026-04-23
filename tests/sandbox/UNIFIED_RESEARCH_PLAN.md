# Unified Research Plan: GitHub Repos & HuggingFace Models

**Created:** April 11, 2026  
**Purpose:** Single guide for all research activities using modern Pi tools  
**Replaces:** MULTI_AGENT_REPOSITORY_REVIEW_SYSTEM.md, AGENT_REVIEW_PLAN.md, AGENT_TEAM_REPO_REVIEW.md

---

## Overview

This document consolidates all research activities into a unified plan using modern Pi tooling (`subagent`, `ant_colony`, `pi-link`).

**Three Research Tracks:**
1. **GitHub Repository Analysis** - 1,000 starred repos for code patterns and architecture
2. **HuggingFace Model Research** - SOTA open models for manufacturing AI tasks
3. **Dataset Research** - Manufacturing, AI, and agent datasets for training and benchmarking

**Modern Approach:**
- ❌ **DEPRECATED:** 7-terminal parallel review with custom scripts
**Modern Approach:**
- ❌ **DEPRECATED:** 7-terminal parallel review with custom scripts
**Modern Approach:**
- ❌ **DEPRECATED:** 7-terminal parallel review with custom scripts
- ✅ **CURRENT:** `subagent` for single tasks, `ant_colony` for distributed architectural exploration (using specialized agent colonies), and **Agentic Research Refinery** (Synthesizer $\rightarrow$ Grounder $\rightarrow$ Editor) for high-fidelity final reports (e.g., `V2_RESEARCH_REPORT_FINAL.md`).

**Research Database:** All findings feed into `docs/_research/research-unified.json` (see Research DB Integration section)

---

## Research Track 1: GitHub Repository Deep Dive

### Goal
Analyze 300 high-priority repositories from the 1,000-starred list for:
- Code architecture patterns
- Implementation examples for book chapters
- Integration opportunities
- Deep-dive cloning recommendations

### What We're Looking For

| Category | Examples | Book Chapter |
|----------|----------|--------------|
| **Physics Engines** | Newton, Warp, Brax, MuJoCo | Ch 04, 08 |
| **Manufacturing Tools** | OrcaSlicer, Spoolman, VMAS | Ch 07, 08 |
| **Multi-Agent Frameworks** | CAMEL, Autogen, pi-coordinator | Ch 05, 06 |
| **Safety/Validation** | aegis, guardrails, EnviSmart patterns | Ch 06 |
| **ML/LLM Tools** | vLLM, transformers, Llama.cpp | Ch 06, 08 |
| **Simulation** | Isaac Gym, SAPIEN, PyBullet | Ch 04 |

### Research Methodology

**Phase 1: Priority Filtering (Human + AI)**
```bash
# Export starred repos to JSON
gh my-starred --format json > repos/all-starred.json

# Filter to top 300 by relevance signals
# - Stars > 100
# - Description contains keywords
# - Last updated < 2 years
# - Manufacturing/AI/simulation domain
```

**Phase 2: Expert Analysis (ant_colony)**
```
ant_colony:
  goal: |
    Analyze {{repo_list}} for manufacturing AI relevance.
    
    For each repo:
    1. Clone with --depth 1
    2. Read README, architecture docs
    3. Extract code patterns for: physics, agents, safety, manufacturing
    4. Score 1-10 relevance
    5. Recommend book chapter integration
    
    Output: JSON with findings per repo
  
  parallel: true
  maxAnts: 6  # One per category
```

**Phase 3: Deep Dive (subagent)**
```
# For Tier 1 repos only (top 30)
subagent:
  agent: code-archaeologist
  task: |
    Deep analysis of {{repo_name}} for book Chapter {{chapter}}.
    
    Deliverables:
    - Architecture diagram (Mermaid)
    - 3 code snippets with explanations
    - Integration pattern notes
    - Comparison with alternatives
    
    Read: README, src/, examples/, docs/
    Write: research-synthesis/repos/{{repo_name}}.md
```

### Agent Configuration

| Agent | Role | Tooling | Expertise |
|-------|------|---------|-----------|
| physics-specialist | Physics/simulation repos | ant_colony worker | Differentiable physics, Newton, Warp, Brax |
| manufacturing-specialist | Manufacturing/CNC repos | ant_colony worker | Production workflows, G-code, fabrication |
| coordination-specialist | Multi-agent frameworks | ant_colony worker | Swarm intelligence, orchestration patterns |
| safety-specialist | Validation/guardrails | ant_colony worker | Deterministic validation, circuit breakers |
| code-specialist | Utility/frameworks | ant_colony worker | API patterns, implementation examples |
| synthesis-coordinator | Cross-domain integration | subagent | Architecture patterns, chapter integration |

### Output Structure

```
docs/_research/repos/
├── analysis/
│   ├── newton-physics-newton.md          # Deep dive (Tier 1)
│   ├── nvidia-warp.md
│   ├── orca-slicer.md
│   └── ...
├── summaries/
│   ├── physics-repos.json                # Batch analysis results
│   ├── manufacturing-repos.json
│   └── ...
└── recommendations/
    ├── tier1-clone-list.md               # Must-clone for book
    ├── code-examples-extracted.md        # Snippets ready for chapters
    └── integration-patterns.md           # Architecture patterns
```

---

## Research Track 2: HuggingFace Model Research

### Goal
Identify and evaluate open-source models for manufacturing AI tasks:
- Code generation for manufacturing (G-code, toolpath planning)
- Multi-modal vision (quality inspection, defect detection)
- Reasoning/planning (production scheduling, optimization)
- Small models for edge deployment

### Model Categories

| Use Case | Model Class | Examples | Priority |
|----------|-------------|----------|----------|
| **Code Generation** | Qwen2.5-Coder, CodeLlama, DeepSeek-Coder | Toolpath generation | HIGH |
| **Vision** | MiniCPM-V, LLaVA, CLIP | Defect detection | HIGH |
| **Reasoning** | DeepSeek-R1, QwQ, o1-distilled | Scheduling optimization | HIGH |
| **Small/Specialized** | Phi-4, Gemma 4, Llama 3.2 1B | Edge deployment | HIGH |
| **Multi-Modal** | Qwen2.5-VL, InternVL | Documentation analysis | MEDIUM |

### Research Methodology

**Phase 1: Model Discovery (HuggingFace Hub)**
```python
# Target models from research_huggingface.txt
priority_models = [
    "Qwen/Qwen2.5-Coder-7B",      # Code generation
    "deepseek-ai/DeepSeek-R1",     # Reasoning
    "OpenGVLab/MiniCPM-V",         # Vision
    "microsoft/phi-4",              # Small/efficient
    "meta-llama/Llama-3.2-1B",     # Edge deployment
    "HuggingFaceTB/SmolLM2",        # Tiny but capable
]

# Evaluation criteria:
# - License (Apache 2.0, MIT preferred)
# - Size (4GB-16GB for local, <1GB for edge)
# - Benchmarks (HumanEval, MMMU, etc.)
# - Manufacturing relevance (code, vision, reasoning)
```

**Phase 2: Model Evaluation (subagent per model)**
```
subagent:
  agent: model-evaluator
  task: |
    Evaluate {{model_id}} for manufacturing AI use cases.
    
    Deliverables:
    - Model card summary (size, license, architecture)
    - Performance on relevant benchmarks
    - Manufacturing use case fit:
      * Code generation: Can it write G-code? Toolpaths?
      * Vision: Can it detect defects? Read technical drawings?
      * Reasoning: Can it optimize production schedules?
    - Deployment requirements (VRAM, quantization options)
    - Comparison with alternatives
    
    Research: HuggingFace Hub, papers, community examples
    Write: research-synthesis/models/{{model_name}}.md
```

**Phase 3: Integration Testing (ant_colony - parallel)**
```
# Test top 5 models with Ollama/ant_colony
ant_colony:
  goal: |
    Test {{model_name}} on manufacturing tasks via Ollama.
    
    Tasks:
    1. Generate G-code for simple part (cube with hole)
    2. Explain CNC toolpath optimization
    3. Describe thermal management in machining
    
    Evaluate: Accuracy, coherence, technical depth
    Record: Response quality, latency, token usage
  
  models: ["phi-4", "qwen2.5-coder", "deepseek-r1:7b", ...]
  parallel: true
```

### Evaluation Framework

**Manufacturing-Specific Benchmarks**

| Task | Test Prompt | Success Criteria |
|------|-------------|------------------|
| **G-code Generation** | "Generate G-code for a 20mm cube with 5mm hole, ABS filament" | Valid syntax, correct dimensions, safe speeds |
| **Toolpath Optimization** | "Explain how to minimize tool changes in multi-part production" | Practical strategies, efficiency metrics |
| **Defect Classification** | Vision model: [image of surface finish] "Classify this defect" | Correct classification, confidence score |
| **Schedule Optimization** | "Optimal order for jobs A(30min), B(15min), C(45min) on 2 machines" | Makespan calculation, constraint handling |

**Deployment Scoring**

| Model | Size | Ollama | Edge | Score |
|-------|------|--------|------|-------|
| Gemma 4 | 4B | ✅ Fast | ✅ 4GB | ⭐⭐⭐⭐⭐ |
| Phi-4 | 14B | ✅ Medium | ⚠️ 8GB | ⭐⭐⭐⭐ |
| Qwen2.5-Coder | 7B | ✅ Fast | ✅ 6GB | ⭐⭐⭐⭐⭐ |
| DeepSeek-R1 | 7B | ✅ Medium | ⚠️ 8GB | ⭐⭐⭐⭐ |
| Llama 3.2 1B | 1B | ⚡ Instant | ✅ 2GB | ⭐⭐⭐⭐ |

### Output Structure

```
docs/_research/models/
├── evaluations/
│   ├── qwen2.5-coder.md
│   ├── deepseek-r1.md
│   ├── phi-4.md
│   └── ...
├── benchmarks/
│   ├── code-generation-results.json
│   ├── vision-task-results.json
│   └── reasoning-results.json
├── deployment/
│   ├── ollama-compatibility.md
│   ├── edge-deployment-guide.md
│   └── quantization-comparison.md
└── recommendations/
    ├── tier1-models.md          # Must-have for project
    ├── book-integration.md        # Which models to mention
    └── ollama-model-config.yml    # Recommended Ollama setup
```

---

## Tool Comparison: Modern vs Deprecated

| Aspect | Deprecated (7-Terminal) | Modern (Pi Tools) |
|--------|---------------------------|-------------------|
| **Tool** | Custom shell scripts | `subagent`, `ant_colony` |
| **Setup** | 7 terminals, pi-link daemons | Single command |
| **Communication** | WebSocket pi-link | Built-in dispatch |
| **Fault Tolerance** | Manual checkpoint/restore | Automatic retry |
| **Progress** | Manual monitoring | Built-in TUI status |
| **Output** | JSON files in shared dir | Structured returns |
| **Cost** | 7× terminal time | 1× efficient parallel |
| **Maintenance** | Scripts need updating | Core Pi tools maintained |

**Recommendation:** Use `ant_colony` for batch repo analysis, `subagent` for deep-dives.

---

## Quick Start Commands

### GitHub Repo Research

```bash
# Step 1: Export your starred repos
gh my-starred --format json > repos/all-starred.json

# Step 2: Priority analysis (ant_colony - parallel)
# Creates: docs/_research/repos/summaries/*.json
ant_colony:
  goal: "Analyze repos from all-starred.json. For each, extract: category, relevance score, key patterns. Output JSON per repo."
  maxAnts: 6

# Step 3: Deep dive top 10 (subagent - sequential depth)
# Creates: docs/_research/repos/analysis/*.md
for repo in $(cat tier1-repos.txt); do
  subagent:
    agent: code-archaeologist
    task: "Deep analysis of $repo for book integration. Extract architecture, code examples, patterns."
    output: "repos/analysis/${repo//\//-}.md"
done
```

### HuggingFace Model Research

```bash
# Step 1: Model discovery (manual + hub search)
# Use: https://huggingface.co/models
# Filter: text-generation, vision, small models

# Step 2: Batch evaluation (ant_colony)
# Creates: docs/_research/models/evaluations/*.md
ant_colony:
  goal: |
    Evaluate HF models for manufacturing AI.
    Check: size, license, benchmarks, manufacturing relevance.
    Output: Structured evaluation per model.
  models: ["phi-4", "qwen2.5-coder", "gemma-4b", "deepseek-r1"]

# Step 3: Ollama integration testing
# Creates: models/deployment/ollama-compatibility.md
ollama pull phi-4
ollama pull qwen2.5-coder:7b
# Test with manufacturing prompts, record results
```

---

## Research Track 3: Dataset Research

### Goal
Identify and catalog datasets for:
- Training manufacturing AI models (supervised fine-tuning, RLHF)
- Benchmarking agent and multi-agent systems
- Testing physics simulation accuracy
- Evaluating safety and validation approaches

### Dataset Categories

| Category | Use Cases | Sources |
|----------|-----------|---------|
| **Manufacturing Process** | Tool wear prediction, defect detection, process optimization | Kaggle, UCI ML Repository, NIST |
| **Robot Simulation** | Sim-to-real transfer, policy learning, trajectory optimization | MuJoCo datasets, Isaac Gym benchmarks |
| **Multi-Agent Behavior** | Swarm coordination, emergent behaviors, consensus protocols | PettingZoo, MAgent, custom simulations |
| **Code/Toolpaths** | G-code generation, CNC programming, CAD understanding | HuggingFace Code datasets, GitHub CodeSearchNet |
| **Safety & Validation** | Adversarial examples, constraint satisfaction, test cases | Safety Gym, formal verification benchmarks |
| **Natural Language** | Technical documentation, manufacturing manuals, SOPs | HuggingFace Datasets, domain-specific crawls |

### Research Methodology

**Phase 1: Dataset Discovery (librarian + HF Datasets)**

```
librarian:
  query: |
    Find manufacturing datasets for machine learning:
    - CNC machining process data
    - Additive manufacturing (3D printing) quality data
    - Defect detection image datasets
    - Tool wear prediction time-series data
    - Industrial IoT sensor datasets
  
  deliverables:
    - Dataset name and source
    - Size, format, license
    - Publication/paper reference
    - Manufacturing domain relevance score
```

**HuggingFace Datasets Hub Search:**
```
# Priority dataset searches
HF_SEARCH_QUERIES = [
  "manufacturing",
  "defect detection", 
  "CNC",
  "tool wear",
  "g-code",
  "quality control",
  "industrial",
  "CAD",
  "simulation",
  "robotics"
]

# Use HF API or web search
# Filter: >1000 samples, permissive license, recent
```

**Phase 2: Dataset Evaluation (ant_colony)**

```python
# Dataset evaluation criteria
EVALUATION_RUBRIC = {
    "manufacturing_relevance": 0-10,  # Direct manufacturing application
    "size_quality": 0-10,             # Adequate samples, clean data
    "license": "apache2/mit",         # Permissive for commercial use
    "documentation": 0-10,            # Clear docs, examples provided
    "benchmark_usage": ["papers"],    # Used in published research
    "download_access": "easy",        # Not broken, not gated
    "format_quality": "standard"      # Parquet, CSV, not proprietary
}
```

**Phase 3: Deep Dive (subagent for Tier 1 datasets)**

```
subagent:
  agent: dataset-analyst
  task: |
    Analyze {{dataset_name}} for manufacturing AI research.
    
    Deliverables:
    - Dataset overview (task, domain, size)
    - Data schema and quality assessment
    - Baseline model performance (if available)
    - Manufacturing use case recommendations
    - Integration with simulation framework
    - Book chapter relevance (which chapter, how cited)
    
    Research: Papers using this dataset, HF dataset card
    Write: research-synthesis/datasets/{{dataset_name}}.md
```

### Priority Dataset Sources

**Manufacturing-Specific:**
| Dataset | Source | Size | Task | Priority |
|---------|--------|------|------|----------|
| **MILL tool wear** | PHM Society | ~100 runs | Tool wear prediction | HIGH |
| **CNCDataset** | Kaggle | 10K+ | G-code optimization | HIGH |
| **Casting Product** | UCI | ~2000 images | Defect detection | MEDIUM |
| **AI4I 2020** | UCI | 10K rows | Predictive maintenance | MEDIUM |
| **Tool Condition** | NASA Prognostics | 3 datasets | Wear tracking | MEDIUM |

**General ML/Agent:**
| Dataset | Source | Use Case | Priority |
|---------|--------|----------|----------|
| **GlaDOS Agent Trajectories** | Custom | Agent training data | HIGH |
| **Open X-Embodiment** | DeepMind | Robot learning data | MEDIUM |
| **Safety Gym** | OpenAI | Safety validation | MEDIUM |
| **CodeSearchNet** | GitHub | Code understanding | MEDIUM |

### Output Structure

```
docs/_research/datasets/
├── manufacturing/
│   ├── mill-tool-wear.md
│   ├── cnc-dataset-kaggle.md
│   ├── casting-defects.md
│   └── ...
├── general-ml/
│   ├── open-x-embodiment.md
│   ├── safety-gym.md
│   └── ...
└── registry.json
    # Unified dataset registry with all metadata
    # Cross-reference: dataset -> models -> repos
```

---

## Research Database Integration

### Unified Database Structure

**File:** `docs/_research/research-unified.json`

**Purpose:** Single canonical source merging all research findings

**Current Sources (v1.0.0):**
| Source | Count | Description |
|--------|-------|-------------|
| **microfactory-curated** | 181 | GitHub Stars list (manufacturing-research) |
| **top-30-analysis** | 30 | Deep analyzed repos with book relevance |
| **keyword-top-50** | 50 | Keyword-filtered from starred repos |
| **librarian-discovered** | 7 | Web search discoveries beyond stars |
| **huggingface-models** | ⏳ | NEW: Model evaluations |
| **dataset-registry** | ⏳ | NEW: Dataset catalog |

**Total:** 268 unique repos/resources (211 existing + planned additions)

### Using the Update Script

**Script:** `scripts/research/update_unified_repos.py`

**Function:** Merges multiple JSON sources into unified database with:
- Deduplication by `full_name`
- Source provenance tracking
- Priority scoring algorithm
- Needs-review flags

**Usage:**
```bash
# Add new source to script first (edit update_unified_repos.py)
# Then run:
python3 scripts/research/update_unified_repos.py

# Output: docs/_research/research-unified.json
```

**Adding New Sources:**

```python
# In update_unified_repos.py, add to sources:

# Source 5: HuggingFace Models
print("Loading huggingface-models.json...")
hf_models = load_json(RESEARCH_DIR / "huggingface-models.json")
if hf_models:
    sources['huggingface-models'] = hf_models
    print(f"  ✓ {len(hf_models)} models")

# Source 6: Datasets
print("Loading dataset-registry.json...")
datasets = load_json(RESEARCH_DIR / "datasets" / "registry.json")
if datasets:
    sources['dataset-registry'] = datasets
    print(f"  ✓ {len(datasets)} datasets")
```

### Query Examples

```bash
# Top 20 highest priority repos
jq '.repos | sort_by(.derived.priority_score) | reverse | .[:20] | 
    map({name: .full_name, score: .derived.priority_score})' \
    docs/_research/research-unified.json

# Physics-related repos
jq '.repos[] | select(.category | test("physics|simulation")) | 
    {name: .full_name, category: .category}' \
    docs/_research/research-unified.json

# Multi-source (high confidence) items
jq '.repos[] | select(.derived.source_count >= 3) | 
    {name: .full_name, sources: .sources, score: .derived.priority_score}' \
    docs/_research/research-unified.json

# Ch07 flagged repos
jq '.repos[] | select(.book_relevance | test("CH07")) | 
    {name: .full_name, relevance: .book_relevance}' \
    docs/_research/research-unified.json
```

### Integration Workflow

```
Phase 1: Individual Research
├── GitHub repos → analysis/*.md
├── HF Models → models/*.md
├── Datasets → datasets/*.md
└── All write JSON to repos/

Phase 2: Update Unified DB
└── python3 scripts/research/update_unified_repos.py

Phase 3: Cross-Reference
└── Update MASTER_TODO_AND_SPEC.md with findings

Phase 4: Book Integration
└── Generate code examples from high-priority items
```

---

## Status & Next Steps

### Repository Research Status

| Phase | Status | Notes |
|-------|--------|-------|
| Export starred repos | ✅ Complete | `gh my-starred` working |
| Priority filtering | 🔄 Ready | Need criteria refinement |
| Ant colony analysis | ⏳ Pending | Configure agents |
| Deep dive top 30 | ⏳ Pending | After batch analysis |
| Chapter integration | ⏳ Pending | Synthesis phase |

### HuggingFace Research Status

| Phase | Status | Notes |
|-------|--------|-------|
| Model list discovery | 🔄 Partial | research_huggingface.txt exists |
| Model cards review | ⏳ Pending | Need systematic evaluation |
| Ollama testing | ⏳ Pending | Requires GPU resources |
| Edge deployment guide | ⏳ Pending | After testing |

### Dataset Research Status

| Phase | Status | Notes |
|-------|--------|-------|
| Manufacturing datasets | ⏳ Pending | MILL, CNCDataset, AI4I 2020 |
| Agent benchmarks | ⏳ Pending | Safety Gym, PettingZoo |
| Robotics datasets | ⏳ Pending | Open X-Embodiment, MuJoCo |
| Code datasets | ⏳ Pending | G-code datasets (scarce) |
| Dataset registry | ⏳ Pending | Create unified registry.json |
| Integration with DB | ⏳ Pending | Update update_unified_repos.py |

### P0 Actions (This Week)

1. **Configure ant_colony agents** for repo analysis
   - Define 6 specialist agent configs
   - Set up output directory structure
   - Test with 10-repo pilot

2. **HuggingFace model priority list**
   - Finalize top 10 models for evaluation
   - Check Ollama compatibility
   - Create evaluation rubric

3. **Dataset research kickoff**
   - Search HF Datasets hub for manufacturing data
   - Evaluate MILL tool wear dataset (HIGH priority)
   - Catalog agent/robotics benchmarks
   - Add dataset-registry.json to update script

4. **Research DB integration**
   - Update `update_unified_repos.py` to include:
     * HuggingFace models source
     * Dataset registry source
   - Re-generate unified database
   - Query high-priority items for Chapter assignments

5. **Unified output integration**
   - Link repo findings to MASTER_TODO_AND_SPEC.md chapters
   - Link model evaluations to Chapter 6 (deployment)
   - Link datasets to Chapter 9 (testing/benchmarks)

---

## Appendix A: Deprecated Documents

The following documents are **superseded** by this unified plan:

| Document | Status | Replacement |
|----------|--------|-------------|
| `docs/_reviews/AGENT_REVIEW_PLAN.md` | ⚠️ Deprecated | This document (Sec 1-2) |
| `docs/_research/research-synthesis/AGENT_TEAM_REPO_REVIEW.md` | ⚠️ Deprecated | This document (Sec 1-2) |
| `docs/_research/research-synthesis/MULTI_AGENT_REPOSITORY_REVIEW_SYSTEM.md` | ⚠️ Deprecated | This document (Sec 1-2) |
| Old 7-terminal scripts | ⚠️ Deprecated | `ant_colony`, `subagent` |

**Also Referenced:**
- `docs/_research/UNIFIED_RESEARCH_DB.md` - Research database documentation
- `scripts/research/update_unified_repos.py` - Database update script
- `docs/_research/research-unified.json` - Canonical merged database

---

## Appendix B: Deprecated Scripts

The following scripts exist but are **not recommended** for current use:

| Script | Status | Replacement |
|--------|--------|-------------|
| `scripts/research/dispatcher.sh` | ⚠️ Deprecated | `ant_colony` |
| `scripts/research/agent_task_handler.sh` | ⚠️ Deprecated | `subagent` |
| `scripts/research/QUICKSTART-multi-agent-review.sh` | ⚠️ Deprecated | `ant_colony` |
| `scripts/research/SEQUENTIAL_REPO_REVIEW.sh` | ⚠️ Deprecated | `subagent` chain |

**Why deprecated:**
- Requires 7 terminal instances (resource heavy)
- Custom WebSocket protocol (brittle)
- Manual checkpoint/restore (error prone)
- Not maintained with Pi updates

**Keep for reference** but use modern `subagent`/`ant_colony` for new work.

---

## Quick Reference: Choose Your Cost Level

| Plan | Cost | Time | Best For |
|------|------|------|----------|
| **Manual + Ollama Only** ([EXECUTION_GUIDE.md](EXECUTION_GUIDE.md)) | **$0** | **3 hours** | You already reviewed repos |
| **Ultra-Cheap** ([ULTRA_CHEAP_RESEARCH.md](ULTRA_CHEAP_RESEARCH.md)) | **$10-20** | **6-8 hours** | Maximum frugality |
| **Optimized** ([OPTIMIZED_RESEARCH_EXECUTION.md](OPTIMIZED_RESEARCH_EXECUTION.md)) | **$85-95** | **12-16 hours** | Balanced cost/quality |
| **Full Premium** (This doc) | **$500+** | **50+ hours** | Academic rigor |

**Recommended:** Start with Current Execution Guide ($0) since you already reviewed 200 repos.

---

This section provides the **exact commands** to execute the unified research plan.

### Pre-Flight Checklist

```bash
# 1. Verify git is clean
git status

# 2. Check unified DB is current
cat docs/_research/research-unified.json | jq '.metadata'

# 3. Verify agents exist
ls .agents/research-* | wc -l  # Should be 9

# 4. Check disk space
df -h .  # Need ~10GB for cloned repos
```

---

### Phase 1: Repository Deep Dive (Week 1)

#### Step 1.1: Pilot Test (Day 1 - 2 hours)

Test the research infrastructure with 5 repos:

```yaml
# Create test configuration
cat > /tmp/pilot-repos.yml << 'EOF'
repos:
  - lsj5031/PiSwarm
  - alvivar/pi-link
  - dustinbyrne/kb
  - patoles/agent-flow
  - bytedance/deer-flow
EOF

# Run pilot with physics specialist (single repo first)
ant_colony:
  goal: |
    Analyze lsj5031/PiSwarm for manufacturing AI relevance.
    
    Tasks:
    1. Clone repo with --depth 1
    2. Read README and key source files
    3. Identify physics or swarm patterns
    4. Score relevance for manufacturing (1-10)
    5. Suggest book chapter integration
    
    Output: Summary with scores and recommendations
  
  agent: physics-specialist
  maxAnts: 1
```

**Success Criteria:**
- [ ] Pilot completes without errors
- [ ] Output file generated
- [ ] Relevance score assigned
- [ ] Review output quality

#### Step 1.2: Export Starred Repos (Day 1 - 30 min)

```bash
# Export GitHub starred repos
gh my-starred --format json > docs/_research/repos/all-starred-export.json

# Filter to relevant repos (top 200 by stars)
jq '[.[] | select(.stars > 50)] | sort_by(.stars) | reverse | .[:200]' \
  docs/_research/repos/all-starred-export.json > docs/_research/repos/top-200-filtered.json

# Verify output
wc -l docs/_research/repos/top-200-filtered.json
head -50 docs/_research/repos/top-200-filtered.json | jq '.[0].full_name, .[0].stars, .[0].description'
```

**Success Criteria:**
- [ ] File created with ~200 repos
- [ ] Contains full_name, stars, description
- [ ] Sorted by star count

#### Step 1.3: Batch Analysis (Days 2-4 - 8 hours)

Run parallel analysis with all 5 specialist agents:

```yaml
# Split repos by category (manual or heuristic-based)
# Run 5 ant_colony instances in parallel

# Physics repos (estimated: 40 repos)
ant_colony:
  goal: |
    Analyze physics and simulation repos from top-200-filtered.json.
    
    Look for:
    - Physics engines (Newton, Warp, Brax, MuJoCo)
    - Differentiable simulation
    - Robotics environments
    - Factory simulation tools
    
    For each repo:
    1. Clone and examine
    2. Score relevance 1-10
    3. Note physics capabilities
    4. Recommend chapter (Ch04 or Ch08)
    
    Output: docs/_research/repos/summaries/physics-analysis.json
  
  agent: physics-specialist
  maxAnts: 3
  worktree: true
```

Repeat for other categories:

```yaml
# Manufacturing repos (estimated: 35 repos)
ant_colony:
  goal: "Analyze manufacturing/CNC repos..."
  agent: manufacturing-specialist

# Coordination repos (estimated: 40 repos)
ant_colony:
  goal: "Analyze multi-agent frameworks..."
  agent: coordination-specialist

# Safety repos (estimated: 25 repos)
ant_colony:
  goal: "Analyze validation/safety repos..."
  agent: safety-specialist

# Code repos (estimated: 60 repos)
ant_colony:
  goal: "Analyze utility/framework repos..."
  agent: code-specialist
```

**Parallel Execution Tips:**
- Run in separate terminals or use `&` for background
- Monitor with `ant_colony: action: status`
- Each agent processes ~20-40 repos depending on complexity

**Success Criteria:**
- [ ] 5 JSON summary files created
- [ ] All repos scored 1-10
- [ ] Chapter recommendations assigned
- [ ] No errors in logs

#### Step 1.4: Merge Results (Day 4 - 1 hour)

```bash
# Merge all summaries
python3 scripts/research/merge-batch-results.py \
  --inputs "repos/summaries/*.json" \
  --output "repos/merged-batch-analysis.json"

# Update unified DB
python3 scripts/research/update_unified_repos.py

# Query high-priority repos
jq '.items[] | select(.derived.priority_score >= 40) | 
    {name: .full_name, score: .derived.priority_score}' \
  docs/_research/research-unified.json | tee docs/_research/repos/high-priority.txt
```

**Success Criteria:**
- [ ] Merged file generated
- [ ] Unified DB updated
- [ ] Top ~30 high-priority repos identified

#### Step 1.5: Deep Dives (Days 5-7 - 12 hours)

```yaml
# Get top 30 repos from high-priority list
for repo in $(head -30 docs/_research/repos/high-priority.txt | jq -r '.name'); do
  subagent:
    goal: |
      Deep analysis of $repo for book integration.
      
      Deliverables:
      - Architecture diagram (Mermaid format)
      - 3-5 key code snippets with explanations
      - Pattern notes (factory, observer, etc.)
      - Comparison with alternatives
      - Book chapter recommendation
      
      Read entire repo: README, src/, docs/, examples/
    
    agent: code-archaeologist
    output: "docs/_research/repos/analysis/${repo//\//-}.md"
done
```

**Success Criteria:**
- [ ] 30 markdown analysis files created
- [ ] Each has architecture diagram
- [ ] Code snippets extracted
- [ ] Book chapter assigned

---

### Phase 2: HuggingFace Model Evaluation (Week 2)

#### Step 2.1: Evaluate 8 Priority Models (Days 1-3 - 6 hours)

```yaml
models:
  - microsoft/phi-4
  - Qwen/Qwen2.5-Coder-7B
  - deepseek-ai/DeepSeek-R1-Distill-Qwen-7B
  - google/gemma-4b-it
  - OpenGVLab/MiniCPM-V-2_6
  - HuggingFaceTB/SmolLM2-1.7B-Instruct
  - meta-llama/Llama-3.2-1B-Instruct
  - Qwen/Qwen2.5-VL-7B-Instruct

# Evaluate each model
for model in "${models[@]}"; do
  subagent:
    goal: |
      Evaluate {{model}} for manufacturing AI.
      
      Research on HF Hub:
      - Model card (size, license, architecture)
      - Benchmarks (HumanEval, MMLU, etc.)
      - Community examples and papers
      
      Assess:
      1. G-code/code generation quality
      2. Reasoning for scheduling
      3. Vision for defect detection (if applicable)
      4. Edge deployment feasibility
      
      Write: docs/_research/models/evaluations/{{model_name}}.md
    
    agent: model-evaluator
done
```

**Success Criteria:**
- [ ] 8 evaluation markdowns created
- [ ] Each has benchmark scores
- [ ] Manufacturing use cases documented

#### Step 2.2: Ollama Testing (Days 4-5 - 4 hours)

```bash
# Pull Ollama-compatible models
for model in phi-4 qwen2.5-coder:7b deepseek-r1:7b gemma:4b llama3.2:1b; do
  ollama pull $model
done

# Create test prompts for manufacturing
cat > /tmp/manufacturing-prompts.txt << 'EOF'
Prompt 1: "Generate G-code for a 20mm cube with a 5mm hole in the center, using ABS filament."
Prompt 2: "Explain toolpath optimization for minimizing tool changes in multi-part CNC production."
Prompt 3: "Describe thermal management considerations for high-speed aluminum machining."
Prompt 4: "Optimal job sequence: Job A (30min milling), Job B (15min drilling), Job C (45min turning), 2 available machines."
EOF

# Test each model (parallel recommended)
for model in phi-4 qwen2.5-coder:7b deepseek-r1:7b gemma:4b llama3.2:1b; do
  output_file="docs/_research/models/ollama-tests/${model}-results.md"
  mkdir -p docs/_research/models/ollama-tests/
  
  while IFS= read -r prompt; do
    echo "## Prompt: $prompt" >> $output_file
    echo "" >> $output_file
    echo "\`\`\`" >> $output_file
    ollama run $model "$prompt" 2>&1 >> $output_file
    echo "\`\`\`" >> $output_file
    echo "" >> $output_file
    echo "---" >> $output_file
    echo "" >> $output_file
  done < /tmp/manufacturing-prompts.txt
done
```

**Success Criteria:**
- [ ] All models pulled successfully
- [ ] Response quality documented
- [ ] Latency measured informally

#### Step 2.3: Update Model Registry (Day 5 - 1 hour)

```bash
# Update registry with evaluation results
# (Manual editing of docs/_research/models/registry.json)

# Add evaluation file paths
# Add benchmark results
# Update manufacturing_relevance scores

# Re-generate unified DB
python3 scripts/research/update_unified_repos.py
```

---

### Phase 3: Dataset Research (Week 2-3)

#### Step 3.1: Evaluate Priority Datasets (Days 6-8 - 6 hours)

```yaml
# Evaluate manufacturing datasets
datasets:
  - mill_tool_wear_phm2010
  - cnc_milling_dataset_kaggle
  - casting_product_uci
  - ai4i_2020_uci
  - nasa_prognostics_tc

for dataset in "${datasets[@]}"; do
  subagent:
    goal: |
      Analyze {{dataset}} for manufacturing AI research.
      
      Tasks:
      - Verify dataset accessibility
      - Check documentation completeness
      - Assess schema and data quality
      - Find papers using this dataset
      - Recommend book chapter integration
      - Suggest code examples
      
      Write: docs/_research/datasets/manufacturing/{{dataset}}.md
    
    agent: dataset-analyst
done
```

**Success Criteria:**
- [ ] 5 dataset evaluations complete
- [ ] Access verified for each
- [ ] Schema documented
- [ ] Chapter recommendations made

#### Step 3.2: Search HF Datasets Hub (Days 9-10 - 4 hours)

```bash
# Search for additional manufacturing datasets
# Use HuggingFace datasets library or web search

# Priority search queries:
queries=("manufacturing" "defect detection" "tool wear" "CNC" "industrial" "quality control")

# Document findings
cat > docs/_research/datasets/additional-findings.md << 'EOF'
# Additional Dataset Discoveries

| Dataset | Source | Size | License | Status |
|---------|--------|------|---------|--------|
| ... | HF Hub | ... | ... | Reviewed |

EOF
```

#### Step 3.3: Update Dataset Registry (Day 10 - 1 hour)

```bash
# Update docs/_research/datasets/registry.json
# Add evaluation results
# Update priority scores

# Re-generate unified DB
python3 scripts/research/update_unified_repos.py
```

---

### Phase 4: Synthesis (Week 3-4)

#### Step 4.1: Run Synthesis Coordinator (Day 1-2 - 4 hours)

```yaml
subagent:
  goal: |
    Synthesize all research findings for book integration.
    
    Inputs:
    - docs/_research/repos/analysis/*.md (30 repos)
    - docs/_research/models/evaluations/*.md (8 models)
    - docs/_research/datasets/manufacturing/*.md (5 datasets)
    
    Deliverables:
    1. Cross-domain integration map
       - Which repos work with which models
       - Dataset support for each repo
    2. Chapter assignments
       - Ch04: Physics repos, models
       - Ch05: Coordination repos
       - Ch06: Safety repos, models
       - Ch07: Manufacturing repos
       - Ch08: Integration repos
       - Ch09: Datasets for testing
    3. Code example specifications
       - 45 required code examples
       - Source repo for each
    4. Integration recommendations
       - Priority order
       - Dependencies
  
  agent: synthesis-coordinator
  output: docs/_research/research-synthesis/INTEGRATION_ROADMAP.md
```

**Success Criteria:**
- [ ] Integration roadmap generated
- [ ] Chapter assignments made
- [ ] Code examples planned

#### Step 4.2: Update MASTER_TODO_AND_SPEC (Day 3 - 2 hours)

```bash
# Query high-priority items from unified DB
jq -r '.items[] | select(.derived.priority_score >= 40) | 
    "- [ ] " + .full_name + " (Ch" + (.chapter // "??") + ")"' \
  docs/_research/research-unified.json | tee /tmp/high-priority-todos.txt

# Append to MASTER_TODO_AND_SPEC.md
cat >> docs/_research/research-synthesis/MASTER_TODO_AND_SPEC.md << 'EOF'

## Appendix G: Research Integration Todos

### High-Priority Repo Integration
EOF
cat /tmp/high-priority-todos.txt >> docs/_research/research-synthesis/MASTER_TODO_AND_SPEC.md
```

#### Step 4.3: Final DB Update (Day 3 - 30 min)

```bash
# Final database update
python3 scripts/research/update_unified_repos.py

# Verify final state
jq '.metadata' docs/_research/research-unified.json

# Tag completion
git add -A
git commit -m "research: Complete unified research phase"
```

---

### Summary: Total Estimated Time

| Phase | Effort | Duration |
|-------|--------|----------|
| Phase 1: Repository Deep Dive | 25 hours | Week 1 |
| Phase 2: Model Evaluation | 11 hours | Week 2 (Days 1-5) |
| Phase 3: Dataset Research | 11 hours | Week 2-3 |
| Phase 4: Synthesis | 6.5 hours | Week 3-4 |
| **Total** | **~53.5 hours** | **~4 weeks** |

### Completion Criteria

✅ **Phase 1 Complete:**
- Unified DB has 231+ items
- 30 deep-dive analyses in `repos/analysis/`
- All repos scored and chapter-assigned

✅ **Phase 2 Complete:**
- 8 model evaluations in `models/evaluations/`
- Ollama compatibility documented
- Tier1 recommendations identified

✅ **Phase 3 Complete:**
- 5+ dataset evaluations in `datasets/manufacturing/`
- Dataset registry populated
- Access verified

✅ **Phase 4 Complete:**
- INTEGRATION_ROADMAP.md generated
- MASTER_TODO_AND_SPEC updated
- All findings linked to book chapters

---

*This guide is designed for step-by-step execution. Check off items as you complete them.*

---  
*Status: Plan complete, ready for execution*  
*Replaces: AGENT_REVIEW_PLAN.md, MULTI_AGENT_REPOSITORY_REVIEW_SYSTEM.md, AGENT_TEAM_REPO_REVIEW.md*  
*Integrates: UNIFIED_RESEARCH_DB.md, update_unified_repos.py, Dataset Research*
