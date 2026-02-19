# Trinetra: The Third Eye of Cyber Defense (2-Minute Pitch)

**Total Duration**: ~2 Minutes
**Target Audience**: Judges, Investors, Technologists

---

## 0:00 - 0:30 | The Problem Statement
**(Visuals: News headlines of AIIMS hack, Power Grid attacks, Dark Web screenshots)**

"Ladies and gentlemen, cyber warfare is no longer a futuristic concept—it is today's reality. India's critical infrastructure—our banking, defense, and power grids—are under constant attack.

Current threat intelligence tools are either too expensive or too generic. They flood analysts with noise, missing the specific, nuanced threats targeting **Indian entities** like UPI, Aadhaar, or DRDO. We are reactive, waiting for a breach to happen. We need to be proactive."

---

## 0:30 - 1:00 | The Proposed Solution
**(Visuals: Trinetra Dashboard Demo, Live Threat Feed scrolling)**

"Introducing **Trinetra**—the 'Third Eye' of cyber defense.

Trinetra is a **real-time threat intelligence platform** designed specifically to protect Indian cyberspace. It continuously scans the dark corners of the web—hacking forums, Pastebin credential dumps, and underground communities—to detect threats *before* they manifest as attacks.

It doesn't just collect data; it 'reads' it, identifying leaks of government emails, defense strategies, and banking API keys instantly."

---

## 1:00 - 1:30 | Technical Approach & Flow
**(Visuals: Architecture Diagram - Scrapers -> Engine -> Dashboard)**

"Our technical approach is built on speed and precision:

1.  **Ingestion**: Our asynchronous **Crawler Engine** simultaneously scrapes high-risk sources like Reddit's netsec communities, Pastebin dumps, and custom forums every 5 minutes.
2.  **Analysis**: We use a **Hybrid Detection Engine**.
    *   **Deterministic**: 24+ custom Regex patterns instantly catch leaked secrets like AWS keys and Aadhaar numbers with 100% precision.
    *   **Probabilistic**: Our NLP Analyzer detects attack context—differentiating a student asking 'how to DDoS' from a threat actor planning 'Operation Payback against India'.
3.  **Delivery**: We replaced standard pulling with **WebSockets**, pushing alerts to the dashboard in milliseconds."

---

## 1:30 - 2:00 | Innovation & Feasibility
**(Visuals: Code snippets of 'India Sector' logic, 'Critical' Alert popup)**

"What makes Trinetra innovative is its **Context-Aware Scoring**. Unlike generic tools, Trinetra knows that a threat to 'SBI' or 'ISRO' is more critical than a random website. Our proprietary algorithm weights threats based on Indian critical infrastructure targeting.

**Feasibility**: Built on a robust, scalable stack—**FastAPI, Python, React, and Firestore**—Trinetra is enterprise-ready today. It is low-cost, high-impact, and scalable from a single analyst to a national SOC.

Trinetra sees what others miss. Thank you."
