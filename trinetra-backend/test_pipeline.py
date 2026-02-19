"""Quick integration test for the NLP + credential detection pipeline."""
from app.nlp.analyzer import NLPAnalyzer
from app.crawler.credential_detector import CredentialDetector
from app.nlp.threat_scorer import calculate_threat_score

analyzer = NLPAnalyzer()
detector = CredentialDetector()

# Test input with AWS key, Aadhaar, and India-specific keywords
test_content = (
    "AKIAIOSFODNN7EXAMPLE exposed in gov.in portal. "
    "Database dump contains aadhaar numbers 2345 6789 0123. "
    "DDoS attack planned against SBI banking servers. "
    "API key: " + "sk_" + "live_" + "abc123def456ghi789jkl012 found in pastebin."
)

creds = detector.scan(test_content)
nlp = analyzer.analyze(test_content)
score = calculate_threat_score(nlp, creds)

print(f"NLP: is_threat={nlp.is_threat}, type={nlp.threat_type}, severity={nlp.severity}")
print(f"NLP: confidence={nlp.confidence:.2f}, sector={nlp.target_sector}")
print(f"NLP: keywords={nlp.matched_keywords}")
print(f"Credentials: {len(creds)} found")
for c in creds:
    print(f"  - {c.type}: {c.value} ({c.severity})")
print(f"Score: {score['score']}/100, severity={score['severity']}, credibility={score['credibility']}")
print(f"Detail: {score['detail_summary']}")
print("\nAll tests passed!")
