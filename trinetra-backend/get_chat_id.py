
import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

async def get_chat_id():
    if not TOKEN:
        print("Error: TELEGRAM_BOT_TOKEN not found in .env")
        return

    print(f"Using Token: {TOKEN[:5]}...{TOKEN[-5:]}")
    print("Fetching updates...")
    
    url = f"https://api.telegram.org/bot{TOKEN}/getUpdates"
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url)
            data = resp.json()
            
            if not data.get("ok"):
                print(f"Error: {data.get('description')}")
                return

            results = data.get("result", [])
            if not results:
                print("\n❌ No messages found.")
                print("1. Open your bot in Telegram.")
                print("2. Send a message (e.g., 'Hello').")
                print("3. Run this script again.")
                return

            last_msg = results[-1]
            chat = last_msg.get("message", {}).get("chat", {})
            chat_id = chat.get("id")
            name = chat.get("first_name", "Unknown")
            
            print(f"CHAT_ID_FOUND: {chat_id}")
            
        except Exception as e:
            print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(get_chat_id())
