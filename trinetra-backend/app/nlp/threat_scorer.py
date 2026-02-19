"""
Threat Scorer — combines NLP analysis and credential detection results
into a unified threat score with classification.
"""
import logging
from app.nlp.analyzer import ThreatIndicator
from app.crawler.credential_detector import CredentialMatch

logger = logging.getLogger(__name__)


SEVERITY_WEIGHTS = {
    "Critical": 1.0,
    "High": 0.75,
    "Medium": 0.5,
    "Low": 0.25,
}


def calculate_threat_score(
    nlp_result: ThreatIndicator,
    credential_matches: list[CredentialMatch],
) -> dict:
    """
    Calculate a unified threat score (0-100) from NLP analysis
    and credential detection results.

    Returns a dict with:
        - score: int (0-100)
        - severity: str (Critical/High/Medium/Low)
        - credibility: int (0-100)
        - threat_type: str
        - detail_summary: str
    """
    score = 0.0

    # ═══ NLP contribution (max 50 points) ═══
    if nlp_result.is_threat:
        # Base score from NLP severity
        nlp_severity_points = SEVERITY_WEIGHTS.get(nlp_result.severity, 0.25) * 30
        score += nlp_severity_points

        # Confidence bonus (max 10 points)
        score += nlp_result.confidence * 10

        # Keyword variety bonus (max 5 points)
        keyword_count = len(nlp_result.matched_keywords)
        score += min(keyword_count * 1.0, 5.0)

        # Sector targeting bonus (max 5 points)
        if nlp_result.target_sector:
            score += 5.0

    # ═══ Credential detection contribution (max 50 points) ═══
    if credential_matches:
        # Each critical credential adds 15 points, high adds 10, etc.
        cred_score = 0.0
        for match in credential_matches:
            cred_score += SEVERITY_WEIGHTS.get(match.severity, 0.25) * 15

        score += min(cred_score, 50.0)

    # Normalize to 0-100 range
    final_score = int(min(score, 100))

    # Determine overall severity from score
    if final_score >= 80:
        overall_severity = "Critical"
    elif final_score >= 60:
        overall_severity = "High"
    elif final_score >= 35:
        overall_severity = "Medium"
    else:
        overall_severity = "Low"

    # Override to highest component severity if higher
    # Override to highest component severity if higher
    # BUT only if we are confident enough (for NLP)
    for severity in ["Critical", "High"]:
        # Check for credential matches (Deterministic - always trust)
        has_critical_cred = any(m.severity == severity for m in credential_matches)
        
        # Check for NLP matches (Probabilistic - trust only if confident)
        has_critical_nlp = (nlp_result.severity == severity and nlp_result.confidence > 0.6)

        if has_critical_cred or has_critical_nlp:
            sev_score = SEVERITY_WEIGHTS[severity]
            if sev_score > SEVERITY_WEIGHTS.get(overall_severity, 0):
                overall_severity = severity
            break

    # Calculate credibility (how confident we are this is a real threat)
    credibility = _calculate_credibility(nlp_result, credential_matches)

    # Determine the dominant threat type
    if credential_matches and nlp_result.threat_type == "Credential Leak":
        threat_type = "Credential Leak"
    elif credential_matches:
        threat_type = f"Credential Exposure + {nlp_result.threat_type}"
    else:
        threat_type = nlp_result.threat_type

    # Build summary
    summary_parts = []
    if nlp_result.matched_keywords:
        summary_parts.append(
            f"Matched keywords: {', '.join(nlp_result.matched_keywords[:5])}"
        )
    if credential_matches:
        cred_types = list(set(m.type for m in credential_matches))
        summary_parts.append(f"Credentials found: {', '.join(cred_types)}")
    if nlp_result.target_sector:
        summary_parts.append(f"Targets: {nlp_result.target_sector}")
    if nlp_result.entities_found:
        summary_parts.append(
            f"Entities: {', '.join(nlp_result.entities_found[:3])}"
        )

    return {
        "score": final_score,
        "severity": overall_severity,
        "credibility": credibility,
        "threat_type": threat_type,
        "detail_summary": "; ".join(summary_parts) if summary_parts else "No specific indicators",
    }


def _calculate_credibility(
    nlp_result: ThreatIndicator,
    credential_matches: list[CredentialMatch],
) -> int:
    """
    Calculate credibility score (0-100) — how confident we are
    that this is a genuine threat, not a false positive.
    """
    cred = 30  # Base credibility

    # NLP confidence boost
    cred += int(nlp_result.confidence * 25)

    # Multiple keyword matches increase credibility
    if len(nlp_result.matched_keywords) >= 3:
        cred += 10
    if len(nlp_result.matched_keywords) >= 5:
        cred += 10

    # Actual credential patterns are very credible
    if credential_matches:
        cred += 15
        critical_creds = [m for m in credential_matches if m.severity == "Critical"]
        if critical_creds:
            cred += 10

    # Sector targeting increases credibility
    if nlp_result.target_sector:
        cred += 5

    # Entity extraction adds credibility
    if nlp_result.entities_found:
        cred += 5

    return min(cred, 99)
