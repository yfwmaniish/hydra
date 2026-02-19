"""
Credential Detector — regex-based detection of leaked credentials,
API keys, tokens, and sensitive India-specific identifiers.
"""
import re
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class CredentialMatch:
    """Represents a detected credential or sensitive data match."""
    type: str          # e.g., "AWS Key", "API Token", "Aadhaar Number"
    value: str         # The matched string (partially redacted for storage)
    severity: str      # Critical, High, Medium, Low
    pattern_name: str  # Which regex pattern matched
    context: str       # Surrounding text for evidence


# Each pattern: (name, regex, severity, credential_type)
CREDENTIAL_PATTERNS: list[tuple[str, str, str, str]] = [
    # ═══ Cloud Provider Keys ═══
    (
        "AWS Access Key",
        r"(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}",
        "Critical",
        "AWS Key",
    ),
    (
        "AWS Secret Key",
        r"(?:aws_secret_access_key|AWS_SECRET_ACCESS_KEY)\s*[=:]\s*[A-Za-z0-9/+=]{40}",
        "Critical",
        "AWS Secret",
    ),
    (
        "Google API Key",
        r"AIza[0-9A-Za-z_-]{35}",
        "High",
        "Google API Key",
    ),
    (
        "Azure Key",
        r"(?:AccountKey|SharedAccessKey)\s*=\s*[A-Za-z0-9+/=]{44,}",
        "Critical",
        "Azure Key",
    ),

    # ═══ API Tokens & Secrets ═══
    (
        "Stripe Live Key",
        r"sk_" + r"live_[0-9a-zA-Z]{24,}",
        "Critical",
        "Stripe Key",
    ),
    (
        "Stripe Test Key",
        r"sk_test_[0-9a-zA-Z]{24,}",
        "Medium",
        "Stripe Test Key",
    ),
    (
        "GitHub Token",
        r"(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}",
        "Critical",
        "GitHub Token",
    ),
    (
        "Slack Token",
        r"xox[bporas]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,}",
        "High",
        "Slack Token",
    ),
    (
        "Discord Bot Token",
        r"[MN][A-Za-z\d]{23,}\.[\w-]{6}\.[\w-]{27}",
        "High",
        "Discord Token",
    ),
    (
        "Generic API Key Assignment",
        r"(?:api[_-]?key|apikey|api[_-]?secret)\s*[=:]\s*['\"]?[A-Za-z0-9_\-]{16,}['\"]?",
        "High",
        "API Key",
    ),

    # ═══ Private Keys & Certificates ═══
    (
        "RSA Private Key",
        r"-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----",
        "Critical",
        "Private Key",
    ),
    (
        "SSH Private Key",
        r"-----BEGIN OPENSSH PRIVATE KEY-----",
        "Critical",
        "SSH Key",
    ),
    (
        "PGP Private Key",
        r"-----BEGIN PGP PRIVATE KEY BLOCK-----",
        "Critical",
        "PGP Key",
    ),

    # ═══ Database Connection Strings ═══
    (
        "Database URL",
        r"(?:mongodb|postgres|mysql|redis|amqp)://[^\s'\"]{10,}",
        "Critical",
        "Database URL",
    ),
    (
        "Connection String Password",
        r"(?:password|passwd|pwd)\s*[=:]\s*['\"]?[^\s'\"]{6,}['\"]?",
        "High",
        "Password",
    ),

    # ═══ JWT Tokens ═══
    (
        "JWT Token",
        r"eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}",
        "High",
        "JWT Token",
    ),

    # ═══ India-Specific Identifiers ═══
    (
        "Aadhaar Number",
        r"\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b",
        "Critical",
        "Aadhaar",
    ),
    (
        "Indian PAN Number",
        r"\b[A-Z]{5}[0-9]{4}[A-Z]\b",
        "High",
        "PAN Number",
    ),
    (
        "Indian Phone Number",
        r"\b(?:\+91[\s-]?)?[6-9]\d{9}\b",
        "Medium",
        "Phone Number",
    ),
    (
        "Indian Bank Account",
        r"\b\d{9,18}\b(?=.*(?:IFSC|ifsc|bank|account))",
        "High",
        "Bank Account",
    ),

    # ═══ Env File Contents ═══
    (
        "Env File Indicator",
        r"(?:SECRET_KEY|DATABASE_URL|API_SECRET|PRIVATE_KEY)\s*=\s*\S+",
        "High",
        "Env Variable",
    ),
]

# Pre-compile all patterns for performance
_COMPILED_PATTERNS = [
    (name, re.compile(pattern, re.IGNORECASE | re.MULTILINE), severity, cred_type)
    for name, pattern, severity, cred_type in CREDENTIAL_PATTERNS
]


class CredentialDetector:
    """
    Scans text content for leaked credentials, API keys, tokens,
    and India-specific sensitive identifiers using regex pattern matching.
    """

    def __init__(self, custom_patterns: list[str] | None = None):
        """
        Initialize with optional custom regex patterns.
        Custom patterns are loaded from the AdminConfig credential patterns box.
        """
        self.custom_compiled: list[tuple[str, re.Pattern, str, str]] = []

        if custom_patterns:
            for i, pattern_str in enumerate(custom_patterns):
                pattern_str = pattern_str.strip()
                if not pattern_str or pattern_str.startswith("#"):
                    continue
                try:
                    compiled = re.compile(pattern_str, re.MULTILINE)
                    self.custom_compiled.append(
                        (f"Custom Pattern #{i+1}", compiled, "High", "Custom Match")
                    )
                except re.error as exc:
                    logger.warning(f"Invalid custom regex pattern: {pattern_str}: {exc}")

    def scan(self, content: str) -> list[CredentialMatch]:
        """
        Scan content for credential matches.
        Returns a list of CredentialMatch objects with type, redacted value, and context.
        """
        if not content or len(content) < 5:
            return []

        matches: list[CredentialMatch] = []
        all_patterns = _COMPILED_PATTERNS + self.custom_compiled

        for name, pattern, severity, cred_type in all_patterns:
            for match in pattern.finditer(content):
                matched_value = match.group(0)

                # Get surrounding context (50 chars before and after)
                start = max(0, match.start() - 50)
                end = min(len(content), match.end() + 50)
                context = content[start:end].strip()

                # Partially redact the matched value for storage
                redacted = self._redact(matched_value)

                matches.append(
                    CredentialMatch(
                        type=cred_type,
                        value=redacted,
                        severity=severity,
                        pattern_name=name,
                        context=context[:200],
                    )
                )

        # Deduplicate by (type, value)
        seen = set()
        unique_matches = []
        for m in matches:
            key = (m.type, m.value)
            if key not in seen:
                seen.add(key)
                unique_matches.append(m)

        if unique_matches:
            logger.info(
                f"Credential scan found {len(unique_matches)} unique matches"
            )

        return unique_matches

    @staticmethod
    def _redact(value: str) -> str:
        """Partially redact a credential value for safe storage/display."""
        if len(value) <= 8:
            return value[:2] + "***"
        show = min(6, len(value) // 3)
        return value[:show] + "***" + value[-3:]
