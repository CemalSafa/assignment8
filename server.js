import express from 'express'
import path from 'node:path'

const app = express()
const PORT = process.env.PORT || 3000

// Paths are built from the location of this file, not from the folder
// the server was started in, so the server works from any folder
const PUBLIC_DIR = path.join(import.meta.dirname, 'public')

const COURSES = Object.freeze([
  Object.freeze({ code: 'CS101', title: 'Introduction to Programming', credits: 4 }),
  Object.freeze({ code: 'CS204', title: 'Object-Oriented Software Design', credits: 4 }),
  Object.freeze({ code: 'CS308', title: 'Web Programming and Back-End Basics', credits: 3 })
])

let requestCount = 0

// Request Logger Middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${req.method} ${req.url}`)
  next()
})

// Request Counter Middleware
// Counting rule: increments by 1 for every incoming HTTP request that reaches
// the server before static files and route handlers run (including /api/stats).
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
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  })
})

app.get('/api/headers', (req, res) => {
  res.json({
    userAgent: req.headers['user-agent'] || 'unknown',
    accept: req.headers.accept || '*/*',
    host: req.headers.host || 'localhost',
    allHeaders: { ...req.headers }
  })
})

app.post('/api/subscribe', (req, res) => {
  res.status(201).json({
    message: 'Subscription created successfully',
    status: 201
  })
})

app.get('/api/admin', (req, res) => {
  res.status(403).json({
    error: 'Forbidden: You do not have permission to access /api/admin',
    status: 403
  })
})

app.get('/api/stats', (req, res) => {
  res.json({
    totalRequests: requestCount,
    countingRule: 'Counts every incoming HTTP request reaching the server before route handlers run (including /api/stats).'
  })
})

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`)
})
