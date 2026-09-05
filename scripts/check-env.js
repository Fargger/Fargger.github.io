import { readFileSync } from 'node:fs'
import process from 'node:process'

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const expectedNode = packageJson.engines.node
const expectedPnpm = packageJson.packageManager.replace(/^pnpm@/, '')
const actualNode = process.versions.node
const userAgent = process.env.npm_config_user_agent ?? ''
const pnpmMatch = userAgent.match(/^pnpm\/([^\s]+)/)
const actualPnpm = pnpmMatch?.[1]
const errors = []

if (actualNode !== expectedNode) {
  errors.push(`Node.js ${expectedNode} is required, but ${actualNode} is active. Run \`nvm use\`.`)
}

if (actualPnpm && actualPnpm !== expectedPnpm) {
  errors.push(
    `pnpm ${expectedPnpm} is required, but ${actualPnpm} is active. Run \`npm install -g pnpm@${expectedPnpm}\`.`,
  )
}

if (errors.length > 0) {
  console.error(`\nDevelopment environment mismatch:\n- ${errors.join('\n- ')}\n`)
  process.exit(1)
}
