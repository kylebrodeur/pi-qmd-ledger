# HuggingFace Resources for Manufacturing AI

**Tool:** `huggingface-cli` (now installed)  
**Purpose:** Find pre-trained models and datasets for code examples

---

## HF CLI Commands

```bash
# Search for models
huggingface-cli search manufacturing
huggingface-cli search physics-informed
huggingface-cli search multi-agent
huggingface-cli search robotics
huggingface-cli search "time series forecasting"

# Search for datasets
huggingface-cli list-datasets --filter manufacturing
huggingface-cli list-datasets --filter time-series

# Download models/datasets
huggingface-cli download username/model-name
huggingface-cli dataset download username/dataset-name
```

---

## Models Found

### Manufacturing-Related
| Model | Description | Use Case |
|-------|-------------|----------|
| INTERX/Qwen2.5-GenX-7B | GenX family | Manufacturing LLM |
| INTERX/Qwen2.5-GenX-14B | Larger variant | Manufacturing LLM |

### Physics-Informed
| Model | Description | Use Case |
|-------|-------------|----------|
| Deseme/pinno | PINN model | Physics-informed neural networks |

**Note:** "pinn" search returned mostly bio models (PinnatelyCompound = leaf type)  
**Better search:** Look for "physics-informed", "differentiable-physics"

---

## Recommended HF Searches for Book

### For Chapter 4.5 (Agentic Physics)
```bash
huggingface-cli search "differentiable-simulation"
huggingface-cli search "physics-informed"
huggingface-cli search "thermal-dynamics"
huggingface-cli search "robot-control"
```

### For Chapter 5.5 (Distributed Manufacturing)
```bash
huggingface-cli search "federated-learning"
huggingface-cli search "multi-agent-coordination"
huggingface-cli search "swarm-intelligence"
```

### For Chapter 7 (Scenarios)
```bash
huggingface-cli search "predictive-maintenance"
huggingface-cli search "anomaly-detection"
huggingface-cli search "quality-control"
```

---

## Datasets to Explore

**Search these keywords:**
- `time-series` - For forecasting examples
- `manufacturing` - Industry-specific data
- `predictive-maintenance` - Maintenance prediction
- `anomaly-detection` - Quality control
- `robotics` - Control examples

---

## Integration with Book

### Code Examples Using HF
```python
from transformers import AutoModel, AutoTokenizer

# Load manufacturing LLM
tokenizer = AutoTokenizer.from_pretrained("manufacturing-llm")
model = AutoModel.from_pretrained("manufacturing-llm")

# Use for operator assistance
prompt = "Optimize cutting speed for aluminum"
response = model.generate(prompt)
```

### Dataset Integration
```python
from datasets import load_dataset

# Load manufacturing dataset
dataset = load_dataset("manufacturing/time-series")

# Use in examples
train_data = dataset['train']
```

---

## NEXT STEPS

1. **Search HF** for specific manufacturing models
2. **Download datasets** for code examples
3. **Test integration** with your physics/agent systems
4. **Document** in book as "Using Pre-trained Models" section

---

**HF CLI is ready to use!**
