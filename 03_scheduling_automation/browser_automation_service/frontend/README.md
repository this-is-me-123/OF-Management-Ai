# 🚀 Deploying to Railway

## 🔧 Backend Service

1. Go to https://railway.app and create a **new project**
2. Choose **Deploy from GitHub** or upload `backend/` manually
3. Ensure your Railway project:
   - Has a `PORT=3001` variable set
   - Uses **Dockerfile** under project settings

Backend will auto-run `index.js` with JWT auth and SQLite.

---

## 🌐 Frontend Service

1. Create a **new project** in Railway
2. Upload the `frontend/` folder OR deploy via GitHub
3. In project settings:
   - Set service type to **Dockerfile**
   - No environment variables needed

---

## 📝 Notes

- You must build frontend (`npm run build`) before pushing or ensure `dist/` is generated in the Dockerfile.
- Ensure API routes in frontend use absolute URLs to the backend (e.g., https://your-backend.up.railway.app/api/logs).