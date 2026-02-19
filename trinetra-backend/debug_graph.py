
import requests
import json

try:
    response = requests.get("http://127.0.0.1:8000/api/entities")
    response.raise_for_status()
    entities = response.json()
    print(f"Total Entities returned: {len(entities)}")
    
    print("\nSample Entities:")
    for e in entities[:5]:
        print(f"- {e['label']} ({e['type']})")
        
    print("\nChecking for non-seeded entities...")
    seeded_names = ["shadow_vendor_91", "gov-portal.in", "AKIAIOSFODNN7EXAMPLE", "cyb3r_king", "45.33.49.119", "drdo-secure.org.in"]
    new_entities = [e for e in entities if e['label'] not in seeded_names]
    print(f"New Entities found: {len(new_entities)}")
    if new_entities:
        print("First 3 new entities:")
        for e in new_entities[:3]:
            print(f"- {e['label']} ({e['type']})")

except Exception as e:
    print(f"Error fetching entities: {e}")
