# NotebookLM Export Summary

**Export Date:** April 8, 2025  
**Total Notebooks Exported:** 2

---

## 📚 Notebook 1: Evaluating AI Research in Manufacturing/Machining Context

**Notebook ID:** `fa8d9ea8-ca33-4474-a78f-8631da7dad3a`  
**Source Count:** 157 sources  
**Last Updated:** 2026-04-09

### Directory Structure
```
manufacturing_export/
├── reports/                        # 8 AI-generated reports (Markdown)
│   ├── report_53ffa468-7b4c-....md
│   ├── report_a202e7ce-5ca0-....md
│   ├── report_0bba5e5e-c188-....md
│   ├── report_3afed596-e6af-....md
│   ├── report_fe77cd03-a3d1-....md
│   ├── report_ecffbf65-235f-....md
│   ├── report_d5e76ee2-d35c-....md
│   └── report_ae41251f-1f85-....md
├── slides_349890aa.pptx          # 1 slide deck (PPTX)
├── audio_1.mp3                   # 2 Audio Overview podcasts
├── audio_2_customized.mp3        # (custom instructions: Digital Twin + AI)
├── sources_content/              # Web/URL source text content
├── generated_text/               # Generated text sources
└── notes/                         # 16 notebook notes
    └── all_notes.json
```

### Key Topics Covered
- AI-driven CNC machining and machine tools
- Physics-informed neural networks (PINNs) for manufacturing
- Digital Twin technology integration
- Tool wear prediction and thermal error compensation
- Predictive maintenance systems
- Agentic AI governance frameworks
- World models for autonomous manufacturing
- Human-machine collaboration (Industry 5.0)
- Chatter detection in machining
- Deep learning for smart manufacturing
- Neuro-symbolic AI approaches

### Source Types Breakdown
- **Web Pages:** Research papers, articles, industry documentation
- **PDFs:** Academic papers, technical documents
- **Generated Text:** AI-generated summaries and articles
- **YouTube:** Educational video content

### Artifacts Summary
| Type | Count | Custom Instructions |
|------|-------|-------------------|
| Report | 8 | Various topics on AI in manufacturing |
| Slide Deck | 1 | Digital Twin + AI presentation |
| Audio | 2 | Digital Twin + AI discussion |

---

## 📚 Notebook 2: Architectural Frontiers in Multi-Agent Intelligence and Autonomy

**Notebook ID:** `d41ca71a-f62f-4b59-9185-13a56099a7d5`  
**Source Count:** 30 sources  
**Last Updated:** 2026-04-06

### Directory Structure
```
multiagent_export/
├── reports/                        # 11 AI-generated reports (Markdown)
│   ├── report_1931a84d-8b6b-....md
│   ├── report_f2d56e29-e163-....md
│   ├── report_5e38c9ec-5ecb-....md
│   ├── report_b413a069-ac97-....md
│   ├── report_14eb7dee-cd88-....md
│   ├── report_55b69b57-9d6c-....md
│   ├── report_73a2e4a6-d596-....md
│   ├── report_cd902b2f-0a1e-....md
│   ├── report_29b9dd82-c1c4-....md
│   ├── report_9480aa8c-04fc-....md
│   └── report_80cf64ab-90cf-....md
├── slides_1.pptx                 # 2 slide decks (PPTX)
├── slides_2.pptx
├── audio_1.mp3                   # 2 Audio Overview podcasts
├── audio_2_customized.mp3        # (custom instructions: Multi-agent systems)
├── sources_content/              # Web/URL source text content
├── generated_text/               # Generated text sources
└── notes/                         # 3 notebook notes
    └── all_notes.json
```

### Key Topics Covered
- Multi-agent collaboration frameworks
- Distributed manufacturing systems
- Human-in-the-loop multi-robot systems
- Autonomous agent evolution (CORAL)
- Privacy risks in agentic social networks (AgentSocialBench)
- Remote robotic-assisted surgery
- Edge intelligence and IoT
- Decentralized manufacturing

### Source Types Breakdown
- **Web Pages:** arXiv papers, research articles
- **PDFs:** Academic papers, reports
- **Generated Text:** AI-generated analysis and scenarios
- **Google Docs:** Collaborative documents
- **Pasted Text:** Research notes

### Artifacts Summary
| Type | Count | Custom Instructions |
|------|-------|-------------------|
| Report | 11 | Multi-agent architectures, distributed systems |
| Slide Deck | 2 | Presentations on multi-agent systems |
| Audio | 2 | Multi-agent systems discussion |

---

## 📊 Combined Statistics

| Metric | Manufacturing | Multi-Agent | **Total** |
|--------|---------------|-------------|-----------|
| Sources | 157 | 30 | **187** |
| Reports | 8 | 11 | **19** |
| Slide Decks | 1 | 2 | **3** |
| Audio Podcasts | 2 | 2 | **4** |
| Notes | 16 | 3 | **19** |

---

## 🎯 Usage Guide

### To Download All Source Content
Run the provided script:
```bash
./download_all_sources.sh
```

This will download all source text content into:
- `manufacturing_export/sources_content/`
- `manufacturing_export/generated_text/`
- `multiagent_export/sources_content/`
- `multiagent_export/generated_text/`

Note: This will take ~10-15 minutes due to rate limiting (187 sources × 2 seconds = ~6 minutes minimum).

### To Import into Another System
The JSON source lists (`manufacturing_sources.json`, `multiagent_sources.json`) contain all metadata including:
- Source IDs
- Titles
- URLs (for web sources)
- Source types (web_page, pdf, generated_text, etc.)

### File Sizes (Approximate)
- **Reports:** ~10 KB each (190 KB total)
- **Slide Decks:** ~20 MB total (includes media)
- **Audio Podcasts:** ~180 MB total

---

## 🔗 Source Files Reference

### Metadata Files
- `manufacturing_sources.json` - All 157 source metadata
- `multiagent_sources.json` - All 30 source metadata
- `manufacturing_artifacts.json` - All artifact metadata
- `multiagent_artifacts.json` - All artifact metadata

### Artifacts Downloaded
All artifacts are in the original NotebookLM formats:
- **Reports:** Markdown (.md)
- **Slide Decks:** PowerPoint (.pptx)
- **Audio:** MP3 (.mp3)

---

## 📝 Notes

The notes export includes AI-generated summaries on topics such as:
- Process Optimization
- Human-Machine Synergy
- Adaptive Machining
- Quality Control
- Predictive Maintenance
- Digital Thread concepts
- Decentralized/Autonomous Manufacturing

---

*Export generated using nlm CLI version 0.5.16*
