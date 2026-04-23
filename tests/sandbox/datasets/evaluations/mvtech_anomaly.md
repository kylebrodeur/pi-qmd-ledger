# Dataset Evaluation: hdtech/mvtech_anomaly_detection

```
Dataset: hdtech/mvtech_anomaly_detection (MVTec AD)
Size: ~5 GB / Images
Task Type: Visual Anomaly Detection
Manufacturing Domain: Quality Inspection / Defect Detection
Quality Score: 10
Benchmark Usage: The gold standard for industrial anomaly detection (AD)
Book Chapter: Visual Quality Control
Priority: HIGH
Notes: Essential for agents performing "inspection" duties.
```

## 1. Data Schema and Quality Assessment
- **Schema**: Folded structure: `train` (normal images) and `test` (normal + anomaly images). 
- **Quality**: Industry standard. High-resolution images with ground-truth pixel-level masks for anomalies.

## 2. Manufacturing Domain Relevance (Score: 10/10)
The primary task in most electronics and automotive factories is this exact type of visual inspection (finding scratches, dents, or missing components).

## 3. Potential use in Agentic Benchmarking
- **SFT**: Teaching an agent to describe a defect in natural language based on the image.
- **RLHF**: Training the agent to distinguish between "allowable tolerance" and "critical defect."
- **VLM Benchmarking**: Evaluating if a Vision-Language Model can locate and categorize the anomaly.

## 4. Suggested Code Example for the Book
```python
from PIL import Image
import torch
from torchvision import transforms

def check_for_anomaly(image_path, model):
    img = Image.open(image_path).convert('RGB')
    preprocess = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.ToTensor(),
    ])
    tensor = preprocess(img).unsqueeze(0)
    
    with torch.no_grad():
        anomaly_score = model(tensor) # Assume a pre-trained AD model
    
    return "DEFECTIVE" if anomaly_score > 0.5 else "PASS"

# Example usage in a quality control loop
check_for_anomaly("test/cable/000.png", my_ad_model)
```
