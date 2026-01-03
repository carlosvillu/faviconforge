# FEATURE_0.1_PremiumDatabaseSchema.md

## 1. Natural Language Description

**Current State:** The database has a basic Better Auth schema with a `users` table containing standard fields: `id`, `email`, `name`, `emailVerified`, `image`, `createdAt`, `updatedAt`. There is no way to track premium status or Stripe customer information.

**Expected End State:** The `users` table includes three new fields to support the premium business model:
- `isPremium` - Boolean flag indicating if user has lifetime premium access
- `premiumSince` - Timestamp recording when premium was granted
- `stripeCustomerId` - Stripe customer ID for payment tracking and customer lookup

After this task, the database can store premium status for any user, enabling the freemium/premium distinction throughout the app.

---

## 2. Technical Description

**Approach:**
- Add three columns to the existing `users` table schema using Drizzle ORM
- Generate a migration file using `npm run db:generate`
- Apply the migration using `npm run db:migrate`
- Verify the schema change with typecheck and lint

**Dependencies:**
- Drizzle ORM (already installed)
- PostgreSQL database (already configured)

**Considerations:**
- All new fields are nullable or have defaults to avoid breaking existing users
- `isPremium` defaults to `false` so existing users remain on free tier
- `stripeCustomerId` is nullable because free users won't have a Stripe customer yet
- No foreign key constraints needed since Stripe customer IDs are external references

---

## 2.1. Architecture Gate

This task is a **pure database schema change** with no route modules, components, hooks, or services involved.

- **Pages are puzzles:** N/A - No route changes
- **Loaders/actions are thin:** N/A - No loader/action changes
- **Business logic is not in components:** N/A - No component changes

This is infrastructure work to enable future premium-related features.

---

## 3. Files to Change/Create

### `app/db/schema/users.ts`

**Objective:** Add three new fields to support premium status tracking

**Pseudocode:**
```pseudocode
SCHEMA users
  EXISTING FIELDS:
    id, email, name, emailVerified, image, createdAt, updatedAt

  NEW FIELDS:
    isPremium: boolean
      - DEFAULT: false
      - NOT NULL (has default)

    premiumSince: timestamp
      - NULLABLE (null until user becomes premium)

    stripeCustomerId: varchar(255)
      - NULLABLE (null until user creates Stripe customer)
      - VARCHAR because Stripe IDs are strings like "cus_ABC123"
END
```

**Implementation Notes:**
- Use `boolean('is_premium').default(false).notNull()` for isPremium
- Use `timestamp('premium_since')` for premiumSince (nullable by default in Drizzle)
- Use `text('stripe_customer_id')` for stripeCustomerId (text is preferred over varchar in PostgreSQL)

---

## 4. I18N

N/A - This task is a database schema change with no UI elements.

---

## 5. E2E Test Plan

N/A - Database schema changes are verified through:
1. Successful migration execution
2. `npm run typecheck` passing (types are generated from schema)
3. `npm run lint` passing

The premium helper functions in Task 0.2 will include proper tests for reading/writing these fields.

---

## 6. Verification Steps

After implementation, run these commands in order:

```bash
# 1. Generate migration from schema changes
npm run db:generate

# 2. Apply migration to development database
npm run db:migrate

# 3. Verify types are correct
npm run typecheck

# 4. Verify code style
npm run lint
```

**Manual verification (optional):**
- Connect to database and verify columns exist: `\d users` in psql
- Verify column types and defaults match expectations

---

## 7. Rollback Plan

If issues arise, the migration can be reverted by:
1. Removing the new columns from `app/db/schema/users.ts`
2. Generating a new migration that drops the columns
3. Running the migration

However, since these are new nullable/defaulted columns, rollback should not be necessary.
