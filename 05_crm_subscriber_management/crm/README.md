# FastAPI CRM with Supabase Auth, SendGrid Email, and Twilio SMS

See `.env.example` for environment setup.  
**To run locally:**

```
pip install -r requirements.txt
uvicorn main:app --reload
```

**Deploy to Railway/Render:**
- Set all environment variables from `.env.example`
- Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

Features:
- Supabase Auth (JWT, login/logout, protected routes)
- Email sending (SendGrid)
- SMS sending (Twilio)
- Admin UI for OnlyFans CRM
