import express from 'express'
import path from 'node:path'

const app = express()
const PORT = process.env.PORT || 3000

// Paths are built from the location of this file, not from the folder
// the server was started in, so the server works from any folder
const PUBLIC_DIR = path.join(import.meta.dirname, 'public')

const COURSES = Object.freeze([
  Object.freeze({ id: 1, title: 'Introduction to Programming', credits: 4 }),
  Object.freeze({ id: 2, title: 'Object-Oriented Software Design', credits: 4 }),
  Object.freeze({ id: 3, title: 'Web Programming and Back-End Basics', credits: 3 })
])

let requestCount = 0

// Request logger middleware: one line per request, then passes control on
app.use((req, res, next) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${req.method} ${req.url}`)
  next()
})

// Request counter middleware
// Counting rule: increments by 1 for every request that reaches the server,
// before static files and route handlers run (including /api/stats itself)
app.use((req, res, next) => {
  requestCount += 1
  next()
})

app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'))
})

app.get('/hello', (req, res) => {
  res.type('text/plain')
  res.send("Hello from CemalSafa's server")
})

app.get('/robots.txt', (req, res) => {
  res.type('text/plain')
  res.send('User-agent: *\nDisallow: /api/admin\n')
})

app.get('/old-page', (req, res) => {
  res.redirect('/hello')
})

app.get('/api/courses', (req, res) => {
  res.json(COURSES)
})

app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(process.uptime())
  })
})

app.get('/api/headers', (req, res) => {
  res.json({
    'user-agent': req.headers['user-agent'],
    accept: req.headers.accept
  })
})

app.post('/api/subscribe', (req, res) => {
  res.status(201).json({ subscribed: true })
})

app.get('/api/admin', (req, res) => {
  res.status(403).json({ error: 'Forbidden' })
})

app.get('/api/stats', (req, res) => {
  res.json({ requestsServed: requestCount })
})

// 404 fallback: registered last (Express 5 compatible, no '*' wildcard)
// so it can never hide a real route above it
app.use((req, res) => {
  if (req.path === '/api' || req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'Not found' })
    return
  }

  res.status(404).type('text/plain').send('404 Not Found: this page does not exist')
})

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`)
})
