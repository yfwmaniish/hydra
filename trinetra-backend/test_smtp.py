
import smtplib
from email.message import EmailMessage
import os
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

def test_email():
    print(f"Testing SMTP for {SMTP_USERNAME}...")
    
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print("ERROR: Credentials missing in .env")
        return

    msg = EmailMessage()
    msg['Subject'] = "Trinetra SMTP Test"
    msg['From'] = SMTP_USERNAME
    msg['To'] = "manishtiwari5398@gmail.com"
    msg.set_content("This is a test email from the Trinetra backend debugger.")

    try:
        print(f"Connecting to {SMTP_SERVER}:{SMTP_PORT}...")
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as smtp:
            print("Login...")
            smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
            print("Sending...")
            smtp.send_message(msg)
        print("✅ SUCCESS: Email sent successfully!")
    except Exception as e:
        print(f"❌ FAILED: {e}")

if __name__ == "__main__":
    test_email()
