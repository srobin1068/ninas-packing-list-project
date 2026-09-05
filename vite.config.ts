import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import os from 'os'

function packmateSyncPlugin(): Plugin {
  // Store outside project root so Vite file watcher is never triggered
  const dbPath = path.join(os.tmpdir(), 'packmate_sync_db.json')

  const getDbData = () => {
    try {
      if (fs.existsSync(dbPath)) {
        return JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
      }
    } catch (e) {
      console.error('Error reading sync DB file:', e)
    }
    return null
  }

  const saveDbData = (data: any) => {
    try {
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8')
    } catch (e) {
      console.error('Error writing sync DB file:', e)
    }
  }

  return {
    name: 'packmate-sync-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/sync') {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

          if (req.method === 'OPTIONS') {
            res.statusCode = 200
            res.end()
            return
          }

          if (req.method === 'GET') {
            const data = getDbData()
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 200
            res.end(JSON.stringify(data || {}))
            return
          }

          if (req.method === 'POST') {
            let body = ''
            req.on('data', (chunk) => {
              body += chunk.toString()
            })
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body)
                saveDbData(parsed)
                res.setHeader('Content-Type', 'application/json')
                res.statusCode = 200
                res.end(JSON.stringify({ success: true, updatedAt: parsed.updatedAt }))
              } catch (e) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Invalid JSON' }))
              }
            })
            return
          }
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    packmateSyncPlugin(),
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 5173,
    watch: {
      ignored: ['**/.packmate_sync_db.json'],
    },
  },
})
