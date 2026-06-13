import dotenv from 'dotenv'

dotenv.config()

console.log(`Starting server on port: ${process.env.PORT || 3001}`)

import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import './types/express'
import errorHandler from './middleware/errorHandler'
import notFound from './middleware/notFound'
import authRoutes from './routes/auth'
import billingRoutes from './routes/billing'
import chatRoutes from './routes/chat'
import checklistRoutes from './routes/checklist'
import dashboardRoutes from './routes/dashboard'
import exerciseRoutes from './routes/exercises'
import moodRoutes from './routes/mood'
import auth from './middleware/auth'
import appointmentRoutes from './routes/appointment.routes'
import progressRoutes from './routes/progress'
import userRoutes from './routes/user'
import therapistRoutes from './routes/therapist.routes'
import { startChecklistResetJob } from './jobs/checklistCron'
import { handleStripeWebhook } from './controllers/billingController'

console.log('=== ENV CHECK ===')
console.log('GEMINI_API_KEY set:', Boolean(process.env.GEMINI_API_KEY))
console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length ?? 0)
console.log('================')

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'GEMINI_API_KEY',
]

const missingVars = requiredEnvVars.filter((name) => !process.env[name])
if (missingVars.length > 0) {
  console.error('FATAL: Missing required environment variables:', missingVars)
  process.exit(1)
}

console.log('All required environment variables are set')

const app = express()

app.use((req, _res, next) => {
  console.log(
    `[REQUEST] ${req.method} ${req.url} | origin: ${req.headers.origin || 'none'}`,
  )
  next()
})

const allowedOrigins = new Set(
  [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://localhost:5179',
    process.env.CLIENT_URL,
  ].filter((origin): origin is string => Boolean(origin)),
)

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true)
      return
    }
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.options(/.*/, cors(corsOptions))
app.use(helmet())
app.post('/api/v1/billing/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook)
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

app.use(
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
)

app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/billing', auth, billingRoutes)
app.use('/api/v1/chat', (req, _res, next) => {
  console.log(`[DEBUG] Chat router hit: ${req.method} ${req.path}`)
  next()
})
app.use('/api/v1/chat', chatRoutes)
app.use('/api/v1/checklist', auth, checklistRoutes)
app.use('/api/v1/dashboard', auth, dashboardRoutes)
app.use('/api/v1/exercises', auth, exerciseRoutes)
app.use('/api/v1/mood', auth, moodRoutes)
app.use('/api/v1/progress', auth, progressRoutes)
app.use('/api/v1/user', auth, userRoutes)
app.use('/api/v1/therapists', therapistRoutes)
app.use('/api/v1/appointments', auth, appointmentRoutes)

const normalizeLayerPath = (layer: any) => {
  if (!layer?.regexp) return ''
  const source = layer.regexp.source
  if (source === '^\\/?$') return ''
  return source
    .replace('^\\/?', '/')
    .replace('\\/?(?=\\/|$)', '')
    .replace(/\\\//g, '/')
}

const logRoutes = (stack: any[], prefix = '') => {
  stack.forEach((layer) => {
    if (layer.route?.path) {
      const methods = Object.keys(layer.route.methods)
        .map((method) => method.toUpperCase())
        .join(',')
      console.log(`${methods} ${prefix}${layer.route.path}`)
      return
    }

    if (layer.name === 'router' && layer.handle?.stack) {
      const nested = normalizeLayerPath(layer)
      logRoutes(layer.handle.stack, `${prefix}${nested}`)
    }
  })
}

console.log('Registered routes:')
const routerStack = (app as any).router?.stack ?? (app as any)._router?.stack
if (Array.isArray(routerStack)) {
  logRoutes(routerStack)
}


app.use(notFound)
app.use(errorHandler)

const port = Number(process.env.PORT) || 3001

const validateGeminiKey = async () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey.includes('placeholder')) {
    console.warn('⚠️  GEMINI_API_KEY not configured')
    return
  }

  try {
    const modelsToTry = [
      'gemini-2.0-flash-lite',
      'gemini-2.0-flash-001',
      'gemini-2.0-flash',
      'gemini-2.5-flash',
    ]

    let workingModel: string | null = null
    for (const model of modelsToTry) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: 'hi' }],
              },
            ],
          }),
        },
      )

      const data = (await response.json()) as any
      if (response.ok) {
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        console.log('✅ Gemini API working correctly')
        console.log(`   Working model: ${model}`)
        console.log('   Test response:', text?.slice(0, 50))
        workingModel = model
        break
      }

      console.warn(`⚠️  Model ${model} unavailable: ${data?.error?.message ?? 'Unknown error'}`)
      if (response.status !== 429) {
        console.error('   HTTP Status:', response.status)
        break
      }
    }

    if (!workingModel) {
      console.error('❌ Gemini API error: all fallback models failed')
    }
  } catch (error: any) {
    console.error('❌ Gemini network error:', error.message)
    console.warn('   Chat will use mock responses as fallback')
  }
}

app.listen(port, async () => {
  console.log(`Serenify server running on port ${port}`)
  console.log('\n=== ALL REGISTERED ROUTES ===')
  ;(app as any)._router?.stack?.forEach((middleware: any) => {
    if (middleware.route) {
      console.log(
        `${Object.keys(middleware.route.methods)[0].toUpperCase()} ${
          middleware.route.path
        }`,
      )
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          console.log(
            `  ${Object.keys(handler.route.methods)[0].toUpperCase()} ${
              handler.route.path
            }`,
          )
        }
      })
    }
  })
  console.log('==============================\n')
  await validateGeminiKey()
})

startChecklistResetJob()
