
import firebase_admin
from firebase_admin import firestore
from app.firebase_client import get_firestore
from app.config import settings

def reset_threats():
    print("Connecting to Firestore...")
    db = get_firestore()
    collection_ref = db.collection("threats")
    
    print("Fetching documents...")
    docs = collection_ref.stream()
    
    count = 0
    batch = db.batch()
    
    for doc in docs:
        batch.delete(doc.reference)
        count += 1
        
        if count % 400 == 0:
            print(f"Deleting batch of {count}...")
            batch.commit()
            batch = db.batch()
    
    if count % 400 != 0:
        batch.commit()
        
    print(f"✅ Deleted {count} threats from Firestore.")
    print("The crawler will now re-discover these as new threats and trigger alerts.")

if __name__ == "__main__":
    reset_threats()
