import fs from 'fs'
import path from 'path'
import process from 'node:process'

const API = process.env.VITE_API_BASE || 'http://localhost:4000'

function toDataUri(buf, ext) {
  return 'data:image/' + (ext || 'jpeg') + ';base64,' + buf.toString('base64')
}

async function login() {
  const email = process.env.LOGIN_EMAIL || 'odontokaren@odonto.com'
  const password = process.env.LOGIN_PASSWORD || 'odonto123karen'
  const accessCode = process.env.ACCESS_CODE || 'ODONTO-ACCESS-2025'
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, accessCode })
  })
  if (!res.ok) throw new Error('login_failed')
  const json = await res.json()
  return json.token
}

async function extract(token, images) {
  const res = await fetch(`${API}/api/ai/extract-patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ images })
  })
  const txt = await res.text()
  try { return JSON.parse(txt) } catch { throw new Error(txt) }
}

async function main() {
  const dir = process.argv[2]
  if (!dir) { console.error('Usage: node scripts/analyze-with-ai.js <directory>'); process.exit(1) }
  const files = fs.readdirSync(dir).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).map(f => path.join(dir, f))
  const images = files.map(f => {
    const buf = fs.readFileSync(f)
    const ext = (path.extname(f).slice(1) || 'jpeg').toLowerCase()
    return { name: path.basename(f), url: toDataUri(buf, ext) }
  })
  const token = await login()
  const result = await extract(token, images)
  console.log(JSON.stringify(result, null, 2))
}

main().catch(err => { console.error(err?.message || err); process.exit(1) })
