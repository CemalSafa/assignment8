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

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`)
})
