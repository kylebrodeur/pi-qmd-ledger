# Evaluation: ligaments-dev/liga-manufacturing-v2

## Architecture Summary
- **Architecture**: Qwen3ForCausalLM (Finetuned from Qwen3-4B-Instruct)
- **Parameters**: ~4.02B
- **License**: Apache-2.0
- **Type**: Finetuned Causal LLM.

## Manufacturing/Robotics Fit
- **G-code**: Not documented.
- **Control**: Not documented.
- **Vision**: Not documented.
- **Reasoning**: Not documented.
- **Overall Fit**: Low to Medium. While the name "liga-manufacturing" suggests a domain focus, the README is a generic Unsloth template and provides no details on the training data or intended manufacturing capabilities.

## Edge Deployment Feasibility
- **VRAM Requirements**:
  - BF16: ~8GB
  - 4-bit Quantization: ~3-5GB
- **Feasibility**: HIGH. Small enough for embedded industrial PCs.

## Book Chapter Recommendation
**Chapter**: "The Utility of Small-Scale Fine-tunes in Industrial Workflows."

---
**Summary Checklist:**
- Model: ligaments-dev/liga-manufacturing-v2
- Size: 4B params
- Ollama Compatible: Yes (Qwen3 architecture)
- Manufacturing Relevance: 3/10 (Generic README, specialized name)
- Best For: Edge reasoning (if domain-tuned).
- Deployment: Edge/Local
- Priority: LOW
- Notes: Trained with Unsloth for efficiency; lacks functional documentation.
