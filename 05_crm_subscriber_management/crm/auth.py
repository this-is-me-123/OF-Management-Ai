# auth.py
import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import HTTPException, status, Request, Form
from starlette.responses import RedirectResponse
from jose import JWTError, jwt
from supabase import create_client, Client

# Environment vars
SUPABASE_URL        = os.environ["SUPABASE_URL"]
SUPABASE_KEY        = os.environ["SUPABASE_SERVICE_ROLE_KEY"]  # use your service_role key
SUPABASE_JWT_SECRET = os.environ["SUPABASE_JWT_SECRET"]

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def login_user(request: Request, email: str = Form(...), password: str = Form(...)):
    """
    Sign in via Supabase and set JWT cookie.
    """
    resp = supabase.auth.sign_in_with_password({"email": email, "password": password})
    print("DEBUG login resp:", resp)  # should show session and user

    session = getattr(resp, "session", None)
    if session and session.access_token:
        token = session.access_token
        response = RedirectResponse("/dashboard", status_code=303)
        response.set_cookie(
            "access_token",
            token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=session.expires_in
        )
        print("DEBUG cookie set:", token[:10], "…")
        return response

    print("ERROR login: no session.token found")
    raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")


def verify_jwt(request: Request):
    """
    Dependency: validate JWT from cookie.
    """
    token = request.cookies.get("access_token")
    print("DEBUG verify_jwt token:", token)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"])
        print("DEBUG payload:", payload)
        return payload
    except JWTError as e:
        print("ERROR jwt decode:", str(e))
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
