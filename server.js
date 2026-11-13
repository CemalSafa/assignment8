import express from 'express'
import path from 'node:path'

const app = express()
const PORT = process.env.PORT || 3000

// Paths are built from the location of this file, not from the folder
// the server was started in, so the server works from any folder
const PUBLIC_DIR = path.join(import.meta.dirname, 'public')

app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`)
})
