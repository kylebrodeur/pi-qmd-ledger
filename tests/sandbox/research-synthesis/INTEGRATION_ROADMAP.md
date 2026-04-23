---
tags: [multi-agent, anomaly-detection, robotics, datasets, roadmap]
domain: orchestration
status: synthesized
---

# Integration Roadmap: HuggingFace Models & Datasets

**Status:** Synthesized
**Purpose:** Maps the evaluated HF Models and Datasets to specific book chapters for integration into the Microfactory narrative.

## Chapter 04: Agentic Physics & Robotics
- **Dataset:** `nvidia/gr00t_tuned_tasks`
  - *Context:* Use as the primary data source for training robotic control policies. It provides a grounded example of physics-informed datasets.

## Chapter 05: Economic Models & Multi-Agent Coordination
- **Model:** `beccabai/1.3B-multi-agent-collab`
  - *Context:* Use as an example of "Collaborative Ground Truth" agents that agree on quality metrics before committing them to the economic ledger. Shows how small (1.3B) models can handle consensus.
- **Dataset:** `lainmn/AgentDS-Manufacturing`
  - *Context:* The benchmark dataset for evaluating the multi-agent coordination.

## Chapter 06: Predictive Maintenance & Anomaly Detection
- **Model:** `JaneSmel/predictive-maintenance`
  - *Context:* Demonstrate traditional ML (ONNX/Joblib) deployed on edge devices for fast, deterministic anomaly detection.
- **Model:** `SstealzZ-epi/gemma3_tune_predictive_maintenance`
  - *Context:* Demonstrate PEFT/LoRA adapter tuning for reasoning over the anomalies detected by the traditional ML models.
- **Model:** `keras-io/timeseries_forecasting_for_weather`
  - *Context:* Foundational example for time-series forecasting methodologies applied to manufacturing.
- **Dataset:** `hdtech/mvtech_anomaly_detection`
  - *Context:* The gold standard for visual inspection. Use this dataset to train the Visual Quality Control agents.
- **Dataset:** `phuma`
  - *Context:* Provide the foundational telemetry for predictive maintenance models.

## Next Steps
- Update the main `MASTER_TODO_AND_SPEC.md` to append these resources to the chapter checklists.
- Incorporate the generated code examples from the evaluation phase into the manuscript drafts.
