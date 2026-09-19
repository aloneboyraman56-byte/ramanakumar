import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import multer from 'multer'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const port = Number(process.env.PORT || 8787)
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (_req, file, cb) => cb(null, file.mimetype === 'application/pdf') })

app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }))
app.use(express.json({ limit: '1mb' }))

const demoUser = (name, email) => ({ id: 'demo-user', name: name || email.split('@')[0], email })
const demoNotes = (topic) => `## ${topic || 'Study topic'}\n\n### Core idea\n- Start with the definition and why it matters.\n- Connect the concept to one concrete example.\n- Explain it back in your own words to check understanding.\n\n### Remember\nUse the **3-step loop**: understand → practise → explain.\n\n### Quick quiz\n1. What is the main idea?\n2. What is one example?\n3. What would change in a new situation?`

async function openAIChat({ system, user }) {
  if (!process.env.OPENAI_API_KEY) return null
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', temperature: 0.4, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.error?.message || 'OpenAI request failed')
  return payload.choices?.[0]?.message?.content || ''
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'studyai-api', mode: process.env.OPENAI_API_KEY ? 'live' : 'demo' }))

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body || {}
  if (!email || !password || password.length < 6) return res.status(400).json({ error: 'Enter a valid email and a password with at least 6 characters.' })
  // Demo auth only. Add a real database + password hashing before production use.
  res.status(201).json({ user: demoUser(name, email), demo: true })
})

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' })
  // Demo auth only. Replace with a database-backed session or JWT flow before production use.
  res.json({ user: demoUser('', email), demo: true })
})

app.post('/api/chat', async (req, res) => {
  const message = String(req.body?.message || '').trim()
  if (!message) return res.status(400).json({ error: 'Message is required.' })
  try {
    const reply = await openAIChat({ system: 'You are StudyAI, a warm and precise study tutor. Explain clearly, use simple language first, and include one short check-for-understanding question. Do not pretend to know current facts without verification.', user: message })
    if (!reply) return res.json({ demo: true, reply: `Demo mode is on. I received: “${message}”\n\nAdd OPENAI_API_KEY to server/.env for live tutor responses. In the meantime, break this into the definition, one example, and a quick recap.` })
    res.json({ reply, demo: false })
  } catch (error) { res.status(502).json({ error: error.message }) }
})

app.post('/api/notes', async (req, res) => {
  const topic = String(req.body?.topic || '').trim()
  if (!topic) return res.status(400).json({ error: 'Topic is required.' })
  try {
    const notes = await openAIChat({ system: 'You are StudyAI. Turn the user topic into concise markdown study notes with a title, core ideas, key terms, one example, and three quick quiz questions. Keep it friendly and accurate.', user: topic })
    res.json({ notes: notes || demoNotes(topic), demo: !notes })
  } catch (error) { res.status(502).json({ error: error.message }) }
})

app.post('/api/pdf-to-notes', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Please upload a PDF file.' })
  // Integration point: extract PDF text with pdf-parse or a document service, then send it to openAIChat.
  if (!process.env.OPENAI_API_KEY) return res.json({ demo: true, notes: demoNotes(req.file.originalname.replace(/\.pdf$/i, '')) })
  res.json({ demo: true, notes: demoNotes(req.file.originalname.replace(/\.pdf$/i, '')), message: 'PDF extraction is scaffolded. Add your preferred PDF text extraction provider here.' })
})

app.post('/api/image', async (req, res) => {
  const prompt = String(req.body?.prompt || '').trim()
  if (!prompt) return res.status(400).json({ error: 'Prompt is required.' })
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'Image generation is not configured. Add OPENAI_API_KEY to server/.env.' })
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1', prompt, size: '1024x1024', quality: 'low' }) })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error?.message || 'Image request failed')
    res.json({ imageUrl: payload.data?.[0]?.url || `data:image/png;base64,${payload.data?.[0]?.b64_json}`, demo: false })
  } catch (error) { res.status(502).json({ error: error.message }) }
})

app.post('/api/payment/create-checkout-session', (_req, res) => res.status(501).json({ error: 'Payment gateway placeholder. Add provider credentials and server-side checkout creation here.' }))

const distPath = join(__dirname, '..', 'dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (req, res, next) => req.path.startsWith('/api') ? next() : res.sendFile(join(distPath, 'index.html')))
}

app.use((error, _req, res, _next) => {
  if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'PDF must be smaller than 10MB.' })
  if (error.message === 'Unexpected field' || error.message.includes('File')) return res.status(400).json({ error: 'Only PDF uploads are supported.' })
  res.status(500).json({ error: 'Unexpected server error.' })
})

app.listen(port, () => console.log(`StudyAI API running on http://localhost:${port} (${process.env.OPENAI_API_KEY ? 'live' : 'demo'} mode)`))
