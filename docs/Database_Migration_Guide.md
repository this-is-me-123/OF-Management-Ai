# Database Migration Guide

## Adding a New Table
1. Create a new migration file in `backend/db/migrations/` (e.g., `004_add_promotions.sql`).
2. Add SQL statements:
   ```
   CREATE TABLE promotions (
     id SERIAL PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     discount NUMERIC(5,2) NOT NULL,
     start_date DATE,
     end_date DATE
   );
   ```
3. Run migrations:
   ```bash
   cd backend
   node apply-schema.js
   ```
4. Update ORM models if applicable (e.g., `backend/db/models/PromotionModel.js`).
