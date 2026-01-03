import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  emailVerified: boolean('email_verified').default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  isPremium: boolean('is_premium').default(false).notNull(),
  premiumSince: timestamp('premium_since'),
  stripeCustomerId: text('stripe_customer_id'),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
