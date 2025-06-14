# check_login.py

import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load your .env
load_dotenv()

# Use your Supabase URL and service_role key here
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Credentials to test
email    = "chrisverdin2014@gmail.com"
password = "NewStrongP@ssw0rd!"

print("Attempting sign-in for:", email)
resp = supabase.auth.sign_in_with_password({"email": email, "password": password})
print("Response from sign_in_with_password:", resp)
