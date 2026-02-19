"""
NLP Analyzer — keyword-based and contextual threat detection using
regex patterns, keyword matching, and TF-IDF based contextual analysis.
No heavy ML dependencies — uses scikit-learn's TfidfVectorizer for
context-aware analysis and built-in pattern matching for keyword detection.
"""
import re
import logging
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class ThreatIndicator:
    """Result of NLP analysis on a piece of content."""
    is_threat: bool
    threat_type: str           # e.g., "Credential Leak", "Attack Planning"
    severity: str              # Critical, High, Medium, Low
    confidence: float          # 0.0 to 1.0
    matched_keywords: list[str] = field(default_factory=list)
    entities_found: list[str] = field(default_factory=list)
    target_sector: str = ""    # Which Indian sector is targeted


# ═══ Keyword Dictionaries for Threat Detection ═══

# Keywords indicating discussions about attacks or threats
ATTACK_KEYWORDS: dict[str, str] = {
    # High-severity attack planning
    "ddos": "High",
    "ransomware": "Critical",
    "zero-day": "Critical",
    "0day": "Critical",
    "exploit": "High",
    "payload": "High",
    "backdoor": "Critical",
    "rootkit": "Critical",
    "c2 server": "Critical",
    "command and control": "Critical",
    "botnet": "High",
    "malware": "High",
    "trojan": "High",
    "keylogger": "High",
    "phishing kit": "High",
    "credential stuffing": "High",
    "brute force": "Medium",
    "sql injection": "High",
    "sqli": "High",
    "xss": "Medium",
    "rce": "Critical",
    "remote code execution": "Critical",
    "privilege escalation": "High",
    "lateral movement": "High",
    "data exfiltration": "Critical",
    "supply chain attack": "Critical",
    "apt": "Critical",
    "advanced persistent threat": "Critical",
    "watering hole": "High",
    "spear phishing": "High",
}

# Keywords indicating credential leaks
CREDENTIAL_KEYWORDS: dict[str, str] = {
    "leaked password": "Critical",
    "password dump": "Critical",
    "credential dump": "Critical",
    "combolist": "Critical",
    "plaintext password": "Critical",
    "password list": "High",
    "username:password": "Critical",
    "email:pass": "Critical",
    "database leak": "Critical",
    "data breach": "Critical",
    "leaked database": "Critical",
    "config leak": "High",
    "exposed api": "High",
    "api key leak": "High",
    "aws key": "Critical",
    "private key": "Critical",
    "ssh key exposed": "Critical",
    ".env file": "High",
    "github secret": "High",
}

# Indian infrastructure sectors and related keywords
INDIA_SECTORS: dict[str, list[str]] = {
    "Government": [
        "nic.in", "gov.in", "aadhaar", "digilocker", "umang", "india.gov",
        "uidai", "income tax", "gst portal", "irctc", "epfo",
        "central government", "state government", "ministry",
    ],
    "Banking & Finance": [
        "sbi", "icici", "hdfc", "rbi", "npci", "upi", "bhim",
        "paytm", "razorpay", "bank of india", "canara bank",
        "axis bank", "kotak", "yes bank", "neft", "rtgs", "imps",
    ],
    "Defense": [
        "drdo", "isro", "indian army", "indian navy", "indian air force",
        "bsf", "crpf", "nsg", "raw", "ib", "defense ministry",
        "hal", "bharat electronics", "ordnance factory",
    ],
    "Energy & Power": [
        "ntpc", "bpcl", "iocl", "ongc", "power grid", "adani power",
        "tata power", "nhpc", "ireda", "coal india", "nuclear power",
    ],
    "Telecom": [
        "airtel", "jio", "bsnl", "vi ", "vodafone india",
        "dot india", "trai", "telecom", "5g india",
    ],
    "Healthcare": [
        "aiims", "cowin", "aarogya setu", "icmr", "apollo hospital",
        "fortis", "max healthcare", "health ministry india",
    ],
    "Transportation": [
        "indian railways", "irctc", "nhai", "airports authority",
        "air india", "metro rail", "port trust",
    ],
}


# Negative keywords that suggest non-threat content (education, jobs, news)
NEGATIVE_KEYWORDS: list[str] = [
    "hiring", "job", "career", "salary", "internship", "vacancy", "resume",
    "tutorial", "course", "certification", "webinar", "conference", "summit",
    "news", "update", "patch notes", "how to", "guide", "walkthrough",
    "discussion", "question", "help needed", "looking for advice",
]

class NLPAnalyzer:
    """
    Analyzes text content for cybersecurity threats using:
    1. Regex-based keyword matching (avoiding substring false positives)
    2. Credential leak keyword detection
    3. India-sector targeting detection
    4. Contextual scoring and negative filtering
    """

    def __init__(self, custom_keywords: list[str] | None = None):
        """
        Initialize with optional custom keywords from AdminConfig.
        """
        self.custom_keywords = {
            kw.strip().lower(): "Medium"
            for kw in (custom_keywords or [])
            if kw.strip()
        }

    def analyze(self, content: str) -> ThreatIndicator:
        """
        Perform comprehensive NLP analysis on content.
        Returns a ThreatIndicator with threat classification details.
        """
        if not content or len(content) < 10:
            return ThreatIndicator(
                is_threat=False, threat_type="None", severity="Low", confidence=0.0
            )

        lower_content = content.lower()

        # Phase 0: Negative filtering (Education, Jobs, etc.)
        if self._has_negative_keywords(lower_content):
            # If it's clearly a job post or tutorial, downgrade strictly
            # Unless it has a CRITICAL credential leak (e.g., password dump)
            is_job_or_edu = True
        else:
            is_job_or_edu = False

        # Phase 1: Attack keyword detection (with word boundaries)
        attack_matches = self._match_keywords(lower_content, ATTACK_KEYWORDS)

        # Phase 2: Credential leak keyword detection
        cred_matches = self._match_keywords(lower_content, CREDENTIAL_KEYWORDS)

        # Phase 3: Custom keyword matching
        custom_matches = self._match_keywords(lower_content, self.custom_keywords)

        # Phase 4: India sector targeting
        targeted_sectors = self._detect_sectors(lower_content)

        # Phase 5: Entity extraction
        entities = self._extract_entities(content)

        # Combine all matches
        all_keywords = attack_matches + cred_matches + custom_matches

        # --- Decision Logic ---

        # 1. No keywords found -> Not a threat
        if not all_keywords:
            return ThreatIndicator(
                is_threat=False, threat_type="None", severity="Low", 
                confidence=0.0, entities_found=entities
            )

        # 2. Determine base threat type
        if cred_matches:
            threat_type = "Credential Leak"
        elif attack_matches:
            threat_type = "Attack Planning"
        else:
            threat_type = "Suspicious Activity"

        # 3. Determine severity
        severity = self._highest_severity(all_keywords)

        # 4. Apply Negative Filter Logic
        if is_job_or_edu:
            # If it looks like a job/tutorial but has "Critical" cred leaks (e.g. "password dump"),
            # we might still want to keep it but maybe downgrade confidence.
            # But if it's just "Attack Planning" keywords (like "apt", "malware") in a job description, IGNORE it.
            if threat_type == "Credential Leak" and severity == "Critical":
                # Likely a real leak even if it says "job" (unlikely but safe to flag)
                severity = "High" # Downgrade slightly
            else:
                # It's false positive (keyword in job desc)
                return ThreatIndicator(
                    is_threat=False, threat_type="None", severity="Low", 
                    confidence=0.1, matched_keywords=[kw for kw, _ in all_keywords]
                )

        # 5. Calculate confidence
        confidence = self._calculate_confidence(
            all_keywords, targeted_sectors, entities, lower_content
        )

        # 6. Boost severity for India-specific targeting
        if targeted_sectors and severity == "Medium":
            severity = "High"
        if targeted_sectors and severity == "High" and cred_matches:
            severity = "Critical"

        return ThreatIndicator(
            is_threat=True,
            threat_type=threat_type,
            severity=severity,
            confidence=min(confidence, 0.99),
            matched_keywords=[kw for kw, _ in all_keywords],
            entities_found=entities,
            target_sector=targeted_sectors[0] if targeted_sectors else "",
        )

    def _match_keywords(
        self, content: str, keyword_dict: dict[str, str]
    ) -> list[tuple[str, str]]:
        """
        Find keyword matches using regex word boundaries to avoid substring issues.
        Returns list of (keyword, severity).
        """
        matches = []
        for keyword, severity in keyword_dict.items():
            # Escape keyword for regex compatibility
            escaped_kw = re.escape(keyword)
            # Match whole words only (start/end of string or non-word char)
            pattern = f"(?:^|\\W){escaped_kw}(?:$|\\W)"
            if re.search(pattern, content):
                matches.append((keyword, severity))
        return matches

    def _has_negative_keywords(self, content: str) -> bool:
        """Check for presence of negative keywords (jobs, education)."""
        for kw in NEGATIVE_KEYWORDS:
             # Fast substring check is okay for negative keywords, 
             # but word boundary is safer to avoid suppressing 'career' in 'career-hacker' (unlikely but possible)
             if f" {kw} " in f" {content} ": # Simple boundary simulation
                 return True
        return False

    def _detect_sectors(self, content: str) -> list[str]:
        """Detect which Indian infrastructure sectors are mentioned."""
        detected = []
        for sector, keywords in INDIA_SECTORS.items():
            for keyword in keywords:
                if f" {keyword.lower()} " in f" {content} ": # Simple boundary check
                    if sector not in detected:
                        detected.append(sector)
                        break
        return detected

    def _extract_entities(self, content: str) -> list[str]:
        """Simple entity extraction using regex."""
        entities = []
        # IP addresses
        ips = re.findall(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", content)
        entities.extend([f"IP:{ip}" for ip in ips[:5]])
        # Emails
        emails = re.findall(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", content)
        entities.extend([f"Email:{email}" for email in emails[:5]])
        # Domains
        domains = re.findall(r"\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|org|net|in|gov\.in|co\.in|io|dev)\b", content.lower())
        entities.extend([f"Domain:{d}" for d in domains[:5]])
        # URLs
        urls = re.findall(r"https?://[^\s<>\"']+", content)
        entities.extend([f"URL:{url[:60]}" for url in urls[:3]])
        return entities

    def _highest_severity(self, matches: list[tuple[str, str]]) -> str:
        """Determine the highest severity from matches."""
        severity_order = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}
        max_sev = "Low"
        for _, sev in matches:
            if severity_order.get(sev, 0) > severity_order.get(max_sev, 0):
                max_sev = sev
        return max_sev

    def _calculate_confidence(
        self,
        keywords: list[tuple[str, str]],
        sectors: list[str],
        entities: list[str],
        content: str,
    ) -> float:
        """Calculate confidence score."""
        score = 0.0
        keyword_score = min(len(keywords) * 0.08, 0.4)
        score += keyword_score
        
        if len(set(kw for kw, _ in keywords)) > 3:
            score += 0.1
        if sectors:
            score += 0.15 * min(len(sectors), 3)
        if entities:
            score += 0.05 * min(len(entities), 4)

        return min(score, 0.99)
