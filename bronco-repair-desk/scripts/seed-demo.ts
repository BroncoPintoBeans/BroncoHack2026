import { demoStore } from '../lib/db/demo-store'

async function seed() {
  console.log('Seeding demo data...')
  console.log(`Cases: ${[...demoStore.cases.keys()].join(', ')}`)
  console.log(`Runs: ${[...demoStore.runs.keys()].join(', ')}`)
  const evtCounts = [...demoStore.events.entries()].map(([k, v]) => `${k}:${v.length}`).join(', ')
  console.log(`Events: ${evtCounts}`)
  console.log('Seed complete.')
}

seed().catch(console.error)
