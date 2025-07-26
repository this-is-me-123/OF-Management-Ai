# Deployment Playbook

1. **Setup Infrastructure**
   - Provision PostgreSQL, Redis, and Supabase instances.
   - Ensure DNS records and SSL certificates are ready.
2. **Build & Push Docker Images**
   ```bash
   docker build -t of-ai-frontend ./frontend
   docker build -t of-ai-backend ./backend
   docker build -t of-ai-ai-backend ./02_ai_chat_persona/ai-backend
   ```
3. **Deploy Services**
   - Use Kubernetes or Docker Compose to start containers.
   - Run migrations: `node ./backend/apply-schema.js`.
4. **Smoke Tests**
   - Verify health endpoints: `/health` on each service.
5. **Rollback Plan**
   - Tag previous image versions and rollback if needed: `docker-compose down && docker-compose up -d <old-tags>`.
