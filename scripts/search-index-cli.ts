import process from 'node:process'
import { generateSearchIndex } from './generate-search-index'

const outDir = process.argv.includes('--dist') ? 'dist' : 'public'
await generateSearchIndex(outDir)
