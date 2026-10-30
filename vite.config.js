import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Runs the Vercel functions in api/ inside `npm run dev`, so `vercel dev` is not needed.
// /api/uploads/sign -> api/uploads/sign.js, with the small part of Vercel's req/res that the functions use.
function apiDev() {
  return {
    name: 'api-dev',
    configureServer(server) {
      Object.assign(process.env, loadEnv(server.config.mode, process.cwd(), '')) // R2_* from .env.local
      server.middlewares.use('/api', async (req, res) => {
        res.status = (code) => { res.statusCode = code; return res }
        res.json = (data) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)) }
        try {
          const { default: handler } = await server.ssrLoadModule(`/api${req.url.split('?')[0]}.js`)
          let raw = ''
          for await (const chunk of req) raw += chunk
          req.body = raw ? JSON.parse(raw) : undefined
          await handler(req, res)
        } catch (err) {
          console.error(err)
          res.status(500).json({ error: 'Dev API error' })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), apiDev()],
})
