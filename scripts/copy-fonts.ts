import { cp } from 'node:fs/promises'

async function run() {
  await cp('public/assets/fonts', 'dist/assets/fonts', { recursive: true, force: true })
}

run()
