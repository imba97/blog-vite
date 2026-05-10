# imba97-blog-vite

Blog reconstruction project

## Setup (nvmd)

This project keeps full `@iconify/json` and may require more memory during `pnpm install`.

1. Use the expected Node runtime via `nvmd`.
2. Verify runtime and env:
   - `pnpm run env:check`
3. Install with stable parameters:
   - `pnpm run install:stable`
   - This script uses `nvmd` Node directly to run `pnpm.cjs`.
   - If current Node major is 24+, it auto-falls back to installed Node 22.x in `nvmd`
     for install stability.
