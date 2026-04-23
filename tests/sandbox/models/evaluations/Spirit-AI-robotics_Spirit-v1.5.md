# Evaluation: Spirit-AI-robotics/Spirit-v1.5

## Architecture Summary
- **Architecture**: VLA (Vision-Language-Action)
- **Backbone**: Qwen3-VL-4B-Instruct (VLM) + Diffusion Transformer (DiT) action head
- **License**: Apache-2.0
- **Type**: End-to-end VLA model for robotic control.

## Manufacturing/Robotics Fit
- **G-code**: Not explicitly mentioned.
- **Control**: Extremely High. This is a VLA model designed specifically for action generation (Policy inference API).
- **Vision**: High. Uses a VLM backbone for scene understanding.
- **Reasoning**: Medium to High. Leverages Qwen3-VL for task reasoning.
- **Overall Fit**: Very High for robotic manipulation and autonomous control.

## Edge Deployment Feasibility
- **VRAM Requirements**:
  - VLM Backbone (~4B): ~8-10GB (BF16), ~4-6GB (4-bit)
  - DiT Action Head: Additional VRAM depending on size.
  - Total Estimated: ~12-16GB VRAM total.
- **Feasibility**: MEDIUM TO HIGH. Can be deployed on high-end edge devices (Jetson AGX Orin) but might be too heavy for small embedded controllers.

## Book Chapter Recommendation
**Chapter**: "VLA Models: From Perception to Action in Robot Control."

---
**Summary Checklist:**
- Model: Spirit-AI-robotics/Spirit-v1.5
- Size: ~4B (Backbone) + DiT head
- Ollama Compatible: No (Requires custom DiT action head/inference API)
- Manufacturing Relevance: 10/10 (Directly targets robotic action/control)
- Best For: High-precision robotic manipulation and end-to-end action generation.
- Deployment: Local/Edge (High-end)
- Priority: HIGH
- Notes: Combination of VLM and Diffusion Transformer for precise action output.
