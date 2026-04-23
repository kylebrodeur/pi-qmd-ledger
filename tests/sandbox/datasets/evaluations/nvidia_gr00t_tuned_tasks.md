# Dataset Evaluation: nvidia/PhysicalAI-GR00T-Tuned-Tasks

```
Dataset: nvidia/PhysicalAI-GR00T-Tuned-Tasks
Size: 2000 trajectories / Multimodal / 26.5 GB
Task Type: Imitation Learning / Robotics Control
Manufacturing Domain: Industrial Robotic Manipulation (Sorting, Pouring)
Quality Score: 10
Benchmark Usage: GR00T N1 post-training
Book Chapter: Robotic Assembly and Manipulation
Priority: HIGH
Notes: Primary source for Sim-to-Real humanoid task grounding.
```

## 1. Data Schema and Quality Assessment
- **Schema**: Multimodal time-series.
    - **Actions**: Joint desired positions (26 DoF, FP64).
    - **Observations**: Joint positions (26 DoF, FP64) + 256x256 RGB video (first-person).
    - **Metadata**: Task descriptions (language) and timestamps.
- **Quality**: Exceptional. Generated using MimicGen and Isaac Lab, ensuring physically plausible trajectories. Data is curated for औद्योगिक (industrial) settings.

## 2. Manufacturing Domain Relevance (Score: 10/10)
Directly addresses industrial automation:
- **Exhaust-Pipe-Sorting**: Classic logistics/assembly task.
- **Nut-Pouring**: Precision material handling.
- High relevance for automating "dark factories" with humanoid agents.

## 3. Potential use in Agentic Benchmarking
- **SFT (Supervised Fine-Tuning)**: Perfect for Behavior Cloning (BC) to teach agents specific industrial primitives.
- **RLHF/RL**: Can be used to define "Success" (e.g., pipe in bin) for reward shaping in RL agents.
- **Multi-Modal Reasoning**: Benchmark an agent's ability to map a language instruction ("Sort the pipes") to a visual state and a sequence of 26-DoF actions.

## 4. Suggested Code Example for the Book
```python
import h5py
import numpy as np

def load_gr00t_trajectory(file_path):
    with h5py.File(file_path, 'r') as f:
        # Load modalities
        actions = f['action'][:] 
        states = f['observation/state'][:]
        # RGBs are typically stored as separate mp4s or compressed tensors
        return actions, states

# Example: Analyze joint-space variance for a sorting task
actions, states = load_gr00t_trajectory("exhaust_pipe_sorting_001.hdf5")
variance = np.var(actions, axis=0)
print(f"Joint variance: {variance}")
```
