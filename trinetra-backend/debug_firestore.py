
import asyncio
from app.firebase_client import get_firestore

async def check_threats():
    db = get_firestore()
    docs = db.collection("threats").get()
    print(f"Total Threats: {len(docs)}")
    
    for doc in docs:
        d = doc.to_dict()
        print(f"ID: {d.get('id')} | Source: {d.get('source')} | Target: {d.get('target')}")
        if 'rawEvidence' in d:
             print(f"  Has Evidence: {len(d['rawEvidence'])} chars")
        else:
             print("  NO EVIDENCE")

if __name__ == "__main__":
    asyncio.run(check_threats())
