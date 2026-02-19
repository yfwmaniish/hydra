"""
AI Service Wrapper for OpenRouter.
Provides a unified interface for interacting with LLMs via OpenRouter.
Falls back to a simple heuristic if API key is missing.
"""
import httpx
import logging
import json
from ..config import settings


logger = logging.getLogger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
# Using a performant, cost-effective model as default
DEFAULT_MODEL = "google/gemini-2.0-flash-001" 

async def generate_threat_insight(threat: dict) -> str:
    """
    Generates a tactical executive summary for a given threat.
    """
    if not settings.openrouter_api_key:
        logger.warning("OpenRouter API key missing. Returning heuristic summary.")
        return _heuristic_summary(threat)

    prompt = f"""
    You are a cyber threat intelligence analyst. Analyze this threat alert and provide a tactical summary.
    
    THREAT DATA:
    Title: {threat.get('title')}
    Source: {threat.get('source')} -> Target: {threat.get('target')}
    Type: {threat.get('type')} | Severity: {threat.get('severity')}
    Raw Evidence: {threat.get('rawEvidence', 'N/A')}
    
    INSTRUCTIONS:
    1. LANGUAGE DETECTION: If the raw evidence is in Hindi or Hinglish (Hindi written in Latin script), TRANSLATE relevant key phrases to English in your analysis.
    2. DIRECT ASSESSMENT: Start with a direct assessment in English (e.g., "Credible threat detected against X...").
    3. TTPs: Explain the likely TTPs (tactics, techniques, procedures) based on the evidence.
    4. IMMEDIATE ACTION: Recommend one immediate action.
    5. FORMAT: Keep it under 60 words. Professional, military-grade tone. NO MARKDOWN.
    """

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                    "HTTP-Referer": "https://trinetra.cyber", 
                    "X-Title": "Trinetra Threat Intel",
                },
                json={
                    "model": DEFAULT_MODEL,
                    "messages": [
                        {"role": "system", "content": "You are a senior threat intelligence officer."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.3, # Low temp for factual analysis
                    "max_tokens": 100,
                },
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()
            return data['choices'][0]['message']['content'].strip()

    except Exception as e:
        logger.error(f"AI Generation failed: {e}")
        return _heuristic_summary(threat)

def _heuristic_summary(threat: dict) -> str:
    """Fallback if AI is unavailable."""
    return f"Automated Analysis: {threat.get('severity')} severity threat detected from {threat.get('source')} targeting {threat.get('target')}. Type: {threat.get('type')}."
