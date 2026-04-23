# Execution Guide: Distributed Agentic Research

**Status:** Active Research Phase  
**Next:** Deploy `ant_colony` architectural exploration $\rightarrow$ NotebookLM synthesis $\rightarrow$ Targeted deep-dives.

---

## 🚀 The "Agentic Research Refinery" Workflow (Proven Method)

For generating high-fidelity, publication-ready research reports from raw data, use this specific agentic chain:

**Chain Logic**: `Synthesizer` $\rightarrow$ `Grounder` $\rightarrow$ `Editor`

1. **The Synthesizer**: Blends raw research with the vision/emotional core to create a "Master Narrative".
2. **The Grounder**: Performs a "Grounding Audit", checking every claim/number against source files. Flags unsupported or contradictory claims (`[UNSUPPORTED]`, `[CONTRADICTION]`).
3. **The Editor**: Resolves flags and polishes tone to "Professional yet Visionary".

This process ensures that the final report is not just an AI-generated guess, but a technically verified document.

### 🐜 Repository Exploration: The Colony Approach (P0)

Instead of shallow README extraction, we use the **`ant_colony`** tool for deep architectural exploration. This allows agents to actually read code, explore directories, and validate implementations.

**The Colony Logic**: `Specialist Agent` $\rightarrow$ `Asynchronous Swarm` $\rightarrow$ `Worktree Isolation`

**Execution Protocol**:
1. **Generate Input**: Create a TSV of priority repos from `research-unified.json`.
2. **Launch Colonies**: Deploy themed colonies (Physics, Manufacturing, Coordination, Safety, Code) via `docs/_research/COLONY_LAUNCHER.md`.
3. **Autonomous Exploration**: Ants independently clone, `ls`, `grep`, and `read` the codebases.
4. **Artifact Generation**: Resulting "Deep Analysis" files are written to `docs/_research/repos/extracted/`.

**Why Colony over Script?**
- **Depth**: Agents use tools to find the *real* logic, not just the README summary.
- **Speed**: Parallel execution via async subagents.
- **Cleanliness**: Git worktrees prevent filesystem pollution.

---

## Data Sources (Already Available)

Your 200 repo skim is captured in:
- `docs/_research/research-unified.json` (211 repos with metadata)
- GitHub stars list (descriptions, stars, languages) in `docs/_research/repos/`

**We extract from existing data - no manual shortlist needed.**

---

## Hardware Configuration & Model Selection

**Your Machine:**
- **GPU:** NVIDIA RTX 5080 (16GB VRAM)
- **CPU:** Intel Core Ultra 9
- **RAM:** 32GB DDR4
- **Optimal for:** Medium-large local models (7B-16B parameters)

### Local Ollama Models (FREE - Your Hardware)

**Pull these for your RTX 5080 - PRIORITIZE GEMMA 4 (Kaggle competition model):**

```bash
# PRIMARY - Kaggle competition model, optimized for edge
ollama pull gemma4:26b                   # 17GB, MoE (4B active), competition-ready, COMPETITION STANDARD

# SECONDARY - Higher quality when needed
ollama pull qwen2.5-coder:14b          # 14GB, best code analysis
ollama pull phi-4                       # 14GB, excellent reasoning
ollama pull deepseek-r1:14b            # 14B, complex reasoning tasks

# FALLBACK - Maximum speed for batch processing
ollama pull qwen2.5-coder:7b           # 7GB, faster throughput
```

**Why `gemma4:26b` as primary:**
- ✅ **Kaggle competition deployment target** (proven edge-ready)
- ✅ **4B active params** (MoE = fast like small, quality like large)
- ✅ **Already pulled** on your system
- ✅ **Competition alignment** (what you'll actually deploy)

**⚠️ Important:** `gemma4:26b` at 17GB may be tight on RTX 5080 16GB. See Cloud Alternatives below.

**Recommended workflow:**
- **Primary:** `gemma4:26b` local (17GB, use if VRAM allows)
- **Fallback local:** `gemma4:4b` (~10GB, guaranteed fit)
- **Better quality:** Cloud `gemma4:31b-cloud` (when local insufficient)
- **Code extraction:** `qwen2.5-coder:14b` or cloud alternatives
- **Reasoning tasks:** `deepseek-r1:14b` or cloud alternatives

### Cloud Ollama Alternatives (When Local Too Large)

**Use Ollama Cloud when local VRAM insufficient:**

```bash
# Cloud Gemma 4 - No local VRAM required
ollama run gemma4:31b-cloud            # 31B dense, runs via Ollama Cloud
ollama run gemma4:26b-cloud              # If available, same model cloud-hosted

# Cloud Phi 4
ollama run phi-4:cloud                   # If available
```

**When to use Cloud vs Local:**

| Scenario | Local Model | Cloud Alternative | Cost |
|----------|-------------|-------------------|------|
| **PRIMARY** - Fits on RTX 5080 | `gemma4:26b` (17GB) | N/A - Use local (FREE) | $0 |
| Local OOM / slow | `gemma4:4b` (~10GB) | `gemma4:31b-cloud` | ~$0.50/hr |
| Need 31B quality | `gemma4:4b` (limited) | `gemma4:31b-cloud` | ~$0.50/hr |
| Multi-model parallel | Small models only | Mix local + cloud | Variable |

**Decision Tree:**
```
Start with: ollama run gemma4:26b (local)
    ↓
VRAM error or too slow?
    ↓ YES
Try: ollama run gemma4:4b (local, ~10GB)
    ↓ Still need more quality?
    ↓ YES
Use: ollama run gemma4:31b-cloud (cloud, no VRAM cap)
```

**VRAM Usage (RTX 5080 - 16GB):**
| Model | VRAM Required | Speed | Use Case |
|-------|---------------|-------|----------|
| **gemma4:26b** | ~17GB | ⚡ Instant | **PRIMARY** - Batch scoring, competition-aligned |
| qwen2.5-coder:7b | ~7GB | Fast | Quality code extraction |
| qwen2.5-coder:14b | ~14GB | Medium | Deep architecture analysis |
| phi-4 | ~14GB | Medium | Reasoning tasks |

**Your RTX 5080 can run:**
- **One 14B model** (14GB) + **room for 4B** (4GB) = 18GB (swap memory)
- **OR multiple 4B/7B models concurrently**
- **Recommended:** `gemma4:26b` always resident, swap in 14B for deep dives

### Cloud API Usage (When Local Isn't Enough)

**Use these ONLY when specified:**

| Service | Model | Use For | Cost | Setup |
|---------|-------|---------|------|-------|
| **Gemini** | `gemini-1.5-flash-8b` | 1M context, synthesis | ~$0.50/hr | `export GEMINI_API_KEY=...` |
| **Claude** | `claude-3-5-sonnet-4` | Critical deep dives | ~$3-5/repo | Claude via Pi (already available) |

**When to use Cloud vs Local:**

| Task | Use | Why |
|------|-----|-----|
| Repo README extraction | **Local Ollama** | Free, fast, good enough |
| Code pattern extraction | **Local Ollama** | Free, 14B models sufficient |
| Large codebase analysis (>10k lines) | **Gemini Flash** | 1M token context |
| Complex synthesis across domains | **Gemini Flash** | Cheap, fast |
| Architecture diagrams | **Claude** | Premium quality, rare |
| Final chapter organization | **Claude** | Premium quality, rare |

**Keep Cloud Costs Low:**
- Local Ollama: **80%+ of tasks** ($0)
- Ollama Cloud (Gemma): **~15%** (~$0.50/hr for 31B quality)
- Gemini Flash: **~5% of tasks** (~$5 total)
- Claude: **<5% of tasks** (~$10 total, only critical repos)

**Ollama Cloud Setup:**
```bash
# Check available cloud models
ollama list # Shows local + cloud

# Pull cloud variant explicitly
ollama pull gemma4:31b-cloud

# Run cloud model
ollama run gemma4:31b-cloud "Create G-code for a cylinder"

# Or use in scripts/ants with cloud model
```

---

## Phase 0: Setup & Verification (15 minutes)

**Complete once before starting batch extraction.**

### Step 0.1: Pull Ollama Models (10 min, one-time)

```bash
# Verify Ollama installed
ollama --version

# Pull models optimized for RTX 5080
# PRIMARY (14GB VRAM - your sweet spot)
ollama pull qwen2.5-coder:14b

# FALLBACK models
ollama pull phi-4                  # 14B, if qwen2.5-coder slow
ollama pull qwen2.5-coder:7b       # 7B, faster batch processing
ollama pull gemma4:4b                    # ~10GB, E4B (Effective 4B), edge deployment fallback
ollama pull deepseek-r1:14b        # 14B, reasoning tasks

# Verify pulls
ollama list
```

### Step 0.2: Verify GitHub CLI Access (1 min)

```bash
# Check auth
git --version
git status
gh auth status

# Test repo access
gh repo view lsj5031/PiSwarm --json name
```

### Step 0.3: NotebookLM Authentication (3 min)

```bash
# Install nlm CLI if missing
npm install -g notebooklm-cli

# Login (opens browser, grab cookies)
nlm login

# Verify
nlm notebook list
```

**Multi-profile setup (optional):**
```bash
# If you have multiple Google accounts
nlm login --profile research
nlm login profile list
```

### Step 0.4: Create Output Directories (30 sec)

```bash
mkdir -p docs/_research/repos/extracted
mkdir -p docs/_research/repos/deep-dives
mkdir -p docs/_research/repos/notebooks
```

### Step 0.5: Optional API Keys (1 min, if using cloud)

```bash
# Gemini Flash (only if you plan to use it)
# Get key from: https://makersuite.google.com/app/apikey
export GEMINI_API_KEY="your-key-here"

# Verify unified DB is current
wc -l docs/_research/research-unified.json
head -20 docs/_research/research-unified.json
```

### Setup Checklist

✅ Ollama models pulled (qwen2.5-coder:14b primary)  
✅ GitHub CLI authenticated  
✅ nlm CLI installed and logged in  
✅ Output directories created  
✅ unified DB verified  

**Pre-flight test:**
```bash
# Test Ollama on sample repo
echo "Testing Ollama..."
echo "What is 2+2?" | ollama run gemma4:26b

# Test GitHub
echo "Testing GitHub CLI..."
gh repo view alvivar/pi-link --json name

echo "Setup complete!"
```

---

## Phase 1: Batch Agent Extraction (2-3 hours, $0)

**Use the Pi agents we created to analyze repos from unified DB:**

```bash
# Export top repos from unified DB
jq -r '.items[] | select(.type=="repo") | select(.derived.priority_score>=25) | 
  [.full_name, .description, (.category//"general")] | @tsv' \
  docs/_research/research-unified.json | head -50 > /tmp/batch-repos.tsv

# Run agent extraction in parallel batches
./scripts/research/agent-batch-extract.sh /tmp/batch-repos.tsv
```

**Script uses Pi agents by category:**

```bash
#!/bin/bash
# Agent-powered batch extraction

BATCH_FILE="$1"
OUTPUT_DIR="docs/_research/repos/extracted"
mkdir -p "$OUTPUT_DIR"

# Process each repo with appropriate agent
while IFS=$'\t' read -r repo desc category; do
  safe_name=$(echo "$repo" | tr '/' '-')
  
  # Select agent based on category
  case "$category" in
    "physics"|"simulation") AGENT="research-physics-specialist" ;;
    "manufacturing"|"cnc") AGENT="research-manufacturing-specialist" ;;
    "coordination"|"agents") AGENT="research-coordination-specialist" ;;
    "safety"|"validation") AGENT="research-safety-specialist" ;;
    *) AGENT="research-code-specialist" ;;
  esac
  
  echo "→ $repo → $AGENT"
  
  # Use subagent for extraction
  subagent:
    agent: $AGENT
    task: |
      Analyze repo: $repo
      Description: $desc
      
      Tasks:
      1. Clone repo (--depth 1)
      2. Extract key technical patterns
      3. Score manufacturing relevance 1-10
      4. Recommend book chapter
      
      Output: Structured analysis
    
    output: "$OUTPUT_DIR/${safe_name}.md"
    
done < "$BATCH_FILE"
```

**Available agents in `.agents/` (created earlier):**

| Agent | Role | Best For |
|-------|------|----------|
| `research-physics-specialist` | Physics/simulation repos | Newton, Warp, Brax, MuJoCo |
| `research-manufacturing-specialist` | Manufacturing/CNC | OrcaSlicer, G-code, production |
| `research-coordination-specialist` | Multi-agent frameworks | CAMEL, pi-coordinator, swarm |
| `research-safety-specialist` | Validation/guardrails | aegis, circuit breakers |
| `research-code-specialist` | General code patterns | Libraries, APIs, utilities |
| `research-code-archaeologist` | Deep architecture dives | Complex multi-file repos |
| `research-model-evaluator` | HF model analysis | Model cards, benchmarks |
| `research-dataset-analyst` | Dataset evaluation | Data quality, schemas |
| `research-synthesis-coordinator` | Cross-domain synthesis | Chapter integration |

**Usage patterns:**

```yaml
# Pattern 1: Simple extraction with subagent
subagent:
  agent: research-physics-specialist
  task: "Analyze {repo} for physics patterns. Extract README summary, key files, relevance score."

# Pattern 2: Batch parallel with ant_colony
ant_colony:
  agent: research-physics-specialist
  goal: "Extract patterns from physics repos"
  maxAnts: 5
  model: ollama/phi-4
```

**Old script reference (superseded):** The `batch-ollama-extract.sh` script does direct Ollama calls without agents. Use the agent approach above for better results.

**Parallel execution with `ant_colony`:**

```yaml
# Use ant_colony for maximum parallelism
# Each agent category runs as a separate batch

ant_colony:
  goal: |
    Extract from physics/simulation repos using research-physics-specialist.
    
    For each repo:
    1. Clone shallow
    2. Read README and key files
    3. Extract physics patterns
    4. Score and categorize
    
    Input: /tmp/physics-repos.txt
    Output: docs/_research/repos/extracted/
  
  agent: research-physics-specialist
  maxAnts: 5
  model: ollama/gemma4:26b              # PRIMARY - Kaggle competition model

# Alternative models for specific needs:
# model: ollama/qwen2.5-coder:14b     # Higher quality, slower
# model: ollama/qwen2.5-coder:7b      # Faster batch processing
# model: ollama/deepseek-r1:14b       # Complex reasoning
```

**Agent selection by category:**

---

## Phase 2: NotebookLM Upload & Synthesis (30 min, $0)

**Upload extracted batches to NotebookLM:**

```bash
# Create notebook
NOTEBOOK_ID=$(nlm notebook create "Batch Repo Analysis - Round 1" --quiet)
nlm alias set repos-batch-1 "$NOTEBOOK_ID"

# Upload all extracts (rate limited)
for file in docs/_research/repos/extracted/*.md; do
  filename=$(basename "$file" .md)
  nlm source add "$NOTEBOOK_ID" --text "$(cat "$file")" --title "$filename"
  sleep 2
done

# Generate synthesis
echo "Generating synthesis..."
nlm report create "$NOTEBOOK_ID" --format "Study Guide" --confirm
```

**Query for deep-dive candidates:**
```bash
# Ask NotebookLM to identify which repos need deeper analysis
nlm notebook query "$NOTEBOOK_ID" "Which 10 repos have the most complex or interesting patterns that would benefit from deep code analysis?"

nlm notebook query "$NOTEBOOK_ID" "Group repos by chapter: 04-physics, 05-coordination, 06-safety, 07-manufacturing, 08-integration. List top 5 per chapter."
```

---

## Phase 3: Models & Datasets (1 hour, $0)

**Models - Use existing registry:**

```bash
# Upload model evaluations to NotebookLM
NOTEBOOK_ID=$(nlm notebook create "HF Model Evaluation" --quiet)

# Add model registry
nlm source add "$NOTEBOOK_ID" --text "$(cat docs/_research/models/registry.json | jq '.')" --title "Model Registry"

# Generate model comparison
nlm report create "$NOTEBOOK_ID" --format "Study Guide" --prompt "Compare models for manufacturing AI use. Rank by edge deployment, code generation, reasoning." --confirm
```

**Datasets - Use existing registry:**

```bash
NOTEBOOK_ID=$(nlm notebook create "Dataset Catalog" --quiet)
nlm source add "$NOTEBOOK_ID" --text "$(cat docs/_research/datasets/registry.json | jq '.')" --title "Dataset Registry"
nlm notebook query "$NOTEBOOK_ID" "Which datasets are highest priority for manufacturing agent training?"
```

---

## Phase 4: Deep-Dive Selection (15 min)

**From NotebookLM synthesis, identify:**

```bash
# Get synthesis output and identify gaps
nlm studio status "$NOTEBOOK_ID" --full

# Extract repos needing deep dive
nlm notebook query "$NOTEBOOK_ID" "List repos that need deep code review - either because:
1. Complex multi-file architecture
2. Critical for book narrative
3. Pattern not clear from README analysis

Format: repo_name | reason | estimated effort"
```

**Typical deep-dive count: 10-15 repos** (down from 200)

---

## Phase 5: Targeted Deep Dives (~$10-15)

**Use AI ONLY for repos flagged by NotebookLM synthesis.**

**Decision tree:**

```
Repo flagged by NotebookLM
    ↓
Can Ollama handle it? (single file, pattern clear)
    ↓ YES → Use Ollama deepseek-r1:14b ($0)
    ↓ NO → Large multi-file, unclear patterns?
    ↓
Is it CRITICAL for book narrative?
    ↓ YES → Use Claude Sonnet (~$5)
    ↓ NO → Use Gemini Flash (~$2)
```

**Examples for your setup:**

```yaml
# Case 1: Deep but straightforward - Ollama (FREE)
subagent:
  agent: research-code-archaeologist
  task: |
    Analyze {repo} that NotebookLM flagged as "interesting dispatcher pattern."
    
    This is a single-go file repository with clear structure.
    
    Deliver:
    - Extract dispatcher implementation
    - Show code example
    - Note integration points
  
  model: ollama/deepseek-r1:14b    # Your RTX 5080 handles this

# Case 2: Large repo, unclear from README - Gemini Flash (CHEAP)
subagent:
  agent: research-code-archaeologist  
  task: |
    NotebookLM couldn't categorize {repo} from README.
    
    This is a 50-file codebase with unclear architecture.
    
    Tasks:
    - Read main entry points
    - Identify 2-3 key patterns
    - Explain manufacturing relevance
  
  model: gemini/gemini-1.5-flash-8b  # $0.50/hr, 1M context
  
# Case 3: FLAGSHIP repo for Ch07 - Claude Sonnet (PREMIUM)
subagent:
  agent: research-code-archaeologist
  task: |
    This is your FLAGSHIP repo for Chapter 07 (Manufacturing).
    NotebookLM ranked it #1 priority.
    
    Deliver production quality:
    - Mermaid architecture diagram
    - 3 production-ready code snippets
    - Comparison with 2 alternatives
    - Integration guide
  
  model: claude-3-5-sonnet-4        # $3-5, worth it for FLAGSHIP
```

**API Key Setup (do once):**

```bash
# Gemini (optional, for large context needs)
export GEMINI_API_KEY="your-key-here"
# Or use `nlm` auth if using Gemini via NotebookLM proxy

# Claude (via Pi - already configured)
# No key needed, Pi manages Claude access
```

**Cost by repo type:**
| Repo Type | Method | Cost | Example |
|-----------|--------|------|---------|
| Standard (80%) | Ollama deepseek-r1:14b | $0 | Most repos |
| Complex multi-file (15%) | Gemini Flash | ~$2 | Unclear README |
| FLAGSHIP critical (5%) | Claude Sonnet | ~$5 | PiSwarm, key examples |

---

---

## Cost Breakdown

| Phase | Cost | Time | Output |
|-------|------|------|--------|
| **Phase 0: Setup** | $0 | 15m | Models pulled, CLIs configured |
| **Phase 1: Repos (50)** | $0 | 2-3h | Extracted summaries |
| **Phase 2: Synthesis** | $0 | 30m | Chapter assignments |
| **Phase 3: Models (8)** | $0 | 30m | Comparison report |
| **Phase 4: Datasets (12)** | $0 | 30m | Priority ranking |
| **Phase 5: Deep dives (10)** | ~$5-10 | 1h | Detailed analysis |
| **TOTAL** | **$5-10** | **5-6h** | Complete research |

---

## Exact Command Sequence

```bash
# ========= PHASE 0: SETUP (15 minutes) =========

# 0.1 Pull Ollama models (one-time) - PRIORITIZE GEMMA 4 for Kaggle alignment
ollama pull gemma4:26b                    # PRIMARY - Competition model, 4GB
ollama pull qwen2.5-coder:14b            # Quality code analysis, 14GB
ollama pull qwen2.5-coder:7b             # Fast batch processing, 7GB
ollama pull phi-4                        # Reasoning, 14GB
ollama pull deepseek-r1:14b             # Complex reasoning, 14GB
ollama list

# 0.2 Verify GitHub access
git status
git gh login
gh auth status

# 0.3 NotebookLM auth
npm install -g notebooklm-cli  # if needed
nlm login
nlm notebook list  # verify

# 0.4 Create directories
mkdir -p docs/_research/repos/{extracted,deep-dives,notebooks}

# 0.5 Optional - Gemini key (if using cloud)
export GEMINI_API_KEY="your-key-here"

# ========= PHASE 1: REPO EXTRACTION (2-3 hours) =========

# 1.1 Export repos from unified DB
jq -r '.items[]|select(.type=="repo")|select(.derived.priority_score>=25)|[.full_name,.description]|@tsv' \
  docs/_research/research-unified.json | head -50 > /tmp/batch-repos.txt

# 1.2 Batch extract with Ollama (runs 2-3 hours, can run overnight)
OLLAMA_MODEL=qwen2.5-coder:14b ./scripts/research/batch-ollama-extract.sh /tmp/batch-repos.txt

# ========= PHASE 2: NOTEBOOKLM SYNTHESIS (30 min) =========

# 2.1 Create notebook
NOTEBOOK_ID=$(nlm notebook create "Repo Analysis Batch 1" --quiet)
nlm alias set repos-batch-1 "$NOTEBOOK_ID"

# 2.2 Upload extracts (rate limited)
for f in docs/_research/repos/extracted/*.md; do
  nlm source add "$NOTEBOOK_ID" --text "$(cat $f)" --title "$(basename $f .md)"
  sleep 2
done

# 2.3 Generate synthesis
nlm report create "$NOTEBOOK_ID" --format "Study Guide" --confirm

# 2.4 Query for deep-dives
nlm notebook query "$NOTEBOOK_ID" "Which repos need deep code analysis?"

# ========= PHASE 3: MODELS (30 min) =========

NOTEBOOK_ID2=$(nlm notebook create "Models" --quiet)
nlm source add "$NOTEBOOK_ID2" --text "$(cat docs/_research/models/registry.json)" --title "Models"
nlm report create "$NOTEBOOK_ID2" --confirm

# ========= PHASE 4: DATASETS (30 min) =========

NOTEBOOK_ID3=$(nlm notebook create "Datasets" --quiet)
nlm source add "$NOTEBOOK_ID3" --text "$(cat docs/_research/datasets/registry.json)" --title "Datasets"
nlm report create "$NOTEBOOK_ID3" --confirm
```

---

---

## Success Criteria

✅ Batch 1: 50 repo summaries in NotebookLM  
✅ Synthesis: Chapter assignments identified  
✅ Deep-dive list: 10-15 repos flagged by AI  
✅ Models: Comparison report generated  
✅ Datasets: Priority ranking complete  

**Next:** Run deep-dives on flagged repos (Phase 5)
