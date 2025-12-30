import { Client } from 'pg'
import readline from 'node:readline/promises'
import process from 'node:process'
import dotenv from 'dotenv'

const args = new Set(process.argv.slice(2))
const isProd = args.has('--prod')

const envFile = isProd ? '.env.production' : '.env.development'

dotenv.config({ path: envFile })

const { DATABASE_URL } = process.env

if (!DATABASE_URL) {
  throw new Error(`Missing DATABASE_URL after loading ${envFile}`)
}

async function confirmProdWipe(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    const answer = await rl.question(
      'You are about to TRUNCATE ALL TABLES on PRODUCTION. Are you sure? Type "yes" to continue: '
    )

    if (answer.trim().toLowerCase() !== 'yes') {
      throw new Error('Aborted by user')
    }
  } finally {
    rl.close()
  }
}

async function truncateAllPublicTables(client: Client): Promise<void> {
  await client.query(
    `
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
        END LOOP;
      END $$;
    `.trim()
  )
}

async function main(): Promise<void> {
  if (isProd) {
    await confirmProdWipe()
  }

  const client = new Client({ connectionString: DATABASE_URL })
  await client.connect()

  try {
    await truncateAllPublicTables(client)
  } finally {
    await client.end()
  }

  process.stdout.write(`Done. Truncated all public tables using ${envFile}.\n`)
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`)
  process.exitCode = 1
})
