import process from 'node:process'
import { generateSearchIndex } from './generate-search-index.ts'

const outDir = process.argv.includes('--dist') ? 'dist' : 'public'
await generateSearchIndex(outDir)
