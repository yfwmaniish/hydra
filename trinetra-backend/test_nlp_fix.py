
from app.nlp.analyzer import NLPAnalyzer

def test_analysis():
    analyzer = NLPAnalyzer()
    
    # The text that caused the false positive
    text = """
    Having Trouble Landing a Cybersecurity Job After the Military
    I’m a retired vet trying to start a new career in cybersecurity and could use some advice. 
    I spent about 6 years in the military as a vehicle mechanic, with a few years in supervisor roles. 
    Since retiring, I’ve earned my bachelor’s in Cybersecurity...
    """
    
    print(f"Analyzing text ({len(text)} chars)...")
    result = analyzer.analyze(text)
    
    print("\n--- Analysis Result ---")
    print(f"Is Threat: {result.is_threat}")
    print(f"Type: {result.threat_type}")
    print(f"Severity: {result.severity}")
    print(f"Confidence: {result.confidence}")
    print(f"Keywords: {result.matched_keywords}")

if __name__ == "__main__":
    test_analysis()
