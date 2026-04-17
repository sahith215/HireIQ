const express = require('express')
const cors = require('cors')
const multer = require('multer')
const fetch = require('node-fetch')
const FormData = require('form-data')

const app = express()
// Port config

// Use memory storage so we can pipe data directly
const upload = multer({ storage: multer.memoryStorage() })

const path = require('path')

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? '*' 
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}))

app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'HireIQ proxy server is running' })
})

// Inflate endpoint — Decompresses raw DEFLATE bytes from n8n into a PDF
app.post('/inflate', express.raw({ type: '*/*', limit: '50mb' }), (req, res) => {
  const zlib = require('zlib')
  const compressed = req.body
  if (!Buffer.isBuffer(compressed)) {
    return res.status(400).json({ error: 'Expected raw binary data' })
  }
  const tryInflate = (data, callback) => {
    zlib.inflateRaw(data, (err, result) => {
      if (!err) return callback(null, result)
      zlib.inflate(data, (err2, result2) => {
        if (!err2) return callback(null, result2)
        zlib.gunzip(data, (err3, result3) => {
          if (!err3) return callback(null, result3)
          callback(new Error('All decompression methods failed: ' + err.message))
        })
      })
    })
  }

  tryInflate(compressed, (err, decompressed) => {
    if (err) {
      return res.status(400).json({ error: err.message })
    }
    const magic = decompressed.slice(0, 4).toString('ascii')
    if (!magic.startsWith('%PDF')) {
      return res.status(422).json({ error: 'Not a valid PDF', magic })
    }
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Length': decompressed.length,
      'X-File-Size': decompressed.length
    })
    res.end(decompressed)
  })
})

// Evaluate endpoint — receives PDF + job_description, forwards to n8n
app.post('/api/evaluate', upload.single('data'), async (req, res) => {
  try {
    const file = req.file
    const jobDescription = req.body.job_description

    if (!file) {
      return res.status(400).json({ error: 'No PDF file uploaded. Use field name "data".' })
    }
    if (!jobDescription || !jobDescription.trim()) {
      return res.status(400).json({ error: 'Job description is required.' })
    }

    console.log(`[HireIQ] Forwarding evaluation: ${file.originalname} (${(file.size / 1024).toFixed(1)} KB)`)

    // Build multipart/form-data for n8n
    // DO NOT set Content-Type manually — form-data handles the boundary
    const formData = new FormData()
    formData.append('data', file.buffer, {
      filename: file.originalname,
      contentType: 'application/pdf',
    })
    formData.append('job_description', jobDescription.trim())

    const N8N_URL = process.env.N8N_URL || 'http://localhost:5678/webhook/resume_upload'

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000)

    const n8nResponse = await fetch(N8N_URL, {
      method: 'POST',
      body: formData,
      headers: {
        ...formData.getHeaders(),
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const responseText = await n8nResponse.text()

    if (!n8nResponse.ok) {
      console.error(`[HireIQ] n8n returned ${n8nResponse.status}: ${responseText}`)
      return res.status(n8nResponse.status).json({
        error: `n8n webhook error: ${n8nResponse.status}`,
        details: responseText,
      })
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch {
      console.error('[HireIQ] n8n returned non-JSON:', responseText)
      return res.status(502).json({ error: 'n8n returned invalid JSON', raw: responseText })
    }

    console.log(`[HireIQ] Evaluation complete: candidate_id=${data.candidate_id}`)
    return res.json(data)

  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'n8n webhook timed out after 120 seconds.' })
    }
    console.error('[HireIQ] Proxy error:', err.message)
    return res.status(500).json({
      error: 'Internal proxy error',
      message: err.message,
    })
  }
})

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'))
  })
}

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`\n🚀 HireIQ Server running on port ${PORT}`)
  console.log(`   Forwarding to: ${process.env.N8N_URL || 'http://localhost:5678/webhook/resume_upload'}\n`)
})
