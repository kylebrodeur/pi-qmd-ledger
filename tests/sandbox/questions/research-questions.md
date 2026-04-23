# Research Questions for Multi-Agent Manufacturing

Open questions to guide experiments and simulations.

---

## Economic Emergence

1. **Can agents develop price signaling without explicit programming?**
   - Do prices emerge naturally from supply/demand?
   - Can agents discover arbitrage opportunities?

2. **Do specializations emerge naturally?**
   - Does comparative advantage develop over time?
   - Do agents cluster around specific capabilities?

3. **What causes market crashes in simulated economies?**
   - Information propagation delays?
   - Cascading failures from single points of failure?
   - Trust collapse mechanisms?

---

## Coordination

4. **How many agents before communication overhead dominates?**
   - N=10? N=100? N=1000?
   - What messaging patterns mitigate overhead?

5. **Do hierarchical or flat structures work better?**
   - Hub-and-spoke vs peer-to-peer?
   - Dynamic restructuring vs fixed hierarchies?

6. **Can agents develop trust/reputation systems?**
   - Emergent ratings based on performance?
   - Gossip protocols for information sharing?

---

## ML Integration

7. **Do vision models improve agent decisions?**
   - Can Molmo/Qwen visually assess job feasibility?
   - Does visual input reduce routing errors?

8. **Can we fine-tune Gemma for manufacturing?**
   - What domain-specific training data is needed?
   - Fine-tuning vs few-shot prompting effectiveness?

9. **Does real factory data improve agent realism?**
   - Training on actual sensor data?
   - Generalization across different factory types?

---

## Sustainability & Circular Economy

10. **Can agents autonomously optimize for environmental impact?**
    - Do they trade efficiency for sustainability when given the choice?
    - Can they calculate lifecycle costs without explicit programming?

11. **What incentives drive waste transformation adoption?**
    - Do material credits work better than disposal fees?
    - How much profit margin is needed for micro-recycling to compete?

12. **Does modular design emerge from market forces?**
    - Do agents prefer repairable products when reliability data is visible?
    - Can planned obsolescence be penalized effectively by reputation systems?

---

## Trust & Quality Systems

13. **How robust are reputation systems to Sybil attacks?**
    - Can fake nodes game the system?
    - What reputation threshold is needed before trust converges?

14. **Does open certification scale better than centralized QA?**
    - Compare distributed vs centralized inspection overhead
    - Does transparency reduce quality disputes?

15. **Can cooperative ownership models outperform competitive ones?**
    - Compare shared profit vs individual profit maximization
    - Does altruism emerge in iterated games?

---

## Resilience & Network Behavior

16. **How many node failures can the network tolerate?**
    - At what threshold N does throughput collapse?
    - Does geographic distribution improve recovery time?

17. **Does decentralization actually improve resilience?**
    - Compare centralized vs distributed under cascading failure scenarios
    - Can the network self-heal without global coordination?

---

## Alternative Economic Models

18. **Does barter create more equitable outcomes than monetary systems?**
    - Compare Gini coefficients in barter-only vs credit-based simulations
    - Do "unbanked" agents participate more in barter economies?

19. **How does reputation function as currency?**
    - Is reputation inflationary or deflationary over time?
    - Can high-reputation nodes become "too big to fail"?

20. **Do futures contracts stabilize production planning?**
    - Reduce boom-bust cycles in material availability?
    - Do they introduce systemic risk from over-commitment?

---

## Skill & Knowledge Systems

21. **Does LLM guidance actually accelerate training curves?**
    - Compare time-to-productivity: LLM-assisted vs traditional
    - Does knowledge persistence survive agent turnover?

22. **Can collective intelligence emerge from agent interactions?**
    - Do networked agents outperform isolated agents on the same task?
    - Is there wisdom in agent crowds?

---

## Methodology Notes

- Run 100-agent simulations for statistical significance
- Document emergent behaviors in "zoo" of patterns
- A/B test: rule-based vs ML-based decision making
- Track metrics: throughput, latency, economic surplus


---

*Source: Derived from Pi-Mono Swarm Vision and VISION.md documents*
