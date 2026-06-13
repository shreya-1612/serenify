import type { Request, Response } from 'express'
import { randomUUID } from 'crypto'
import prisma from '../utils/prisma'

const GEMINI_MODEL = 'gemini-2.0-flash-lite'
const GEMINI_MODELS = [
  GEMINI_MODEL,
  'gemini-2.0-flash-001',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
]

interface GeminiMessage {
  role: 'user' | 'model'
  parts: Array<{ text: string }>
}

const getMockResponse = (message: string): string => {
  const msg = message.toLowerCase()

  if (
    msg.includes('anxious') ||
    msg.includes('anxiety') ||
    msg.includes('worry') ||
    msg.includes('worried')
  ) {
    return "I hear you — anxiety can feel overwhelming. Try taking 3 slow deep breaths right now: inhale for 4 counts, hold for 4, exhale for 4. This activates your nervous system's calm response. You're not alone in this feeling 💚"
  }

  if (
    msg.includes('sad') ||
    msg.includes('depress') ||
    msg.includes('unhappy') ||
    msg.includes('cry')
  ) {
    return "I'm really glad you reached out. Feeling sad is completely valid, and it takes courage to acknowledge it. Be gentle with yourself today. Would you like to try a short grounding exercise, or would you prefer to just talk? I'm here either way 💙"
  }

  if (
    msg.includes('sleep') ||
    msg.includes('insomnia') ||
    msg.includes('tired') ||
    msg.includes('exhausted')
  ) {
    return 'Sleep struggles are so draining. Try this tonight: keep your room cool and dark, avoid screens 30 minutes before bed, and try the 4-7-8 breathing technique. You deserve restful sleep 🌙'
  }

  if (
    msg.includes('stress') ||
    msg.includes('overwhelm') ||
    msg.includes('too much') ||
    msg.includes('cant cope')
  ) {
    return 'When everything feels like too much, it helps to zoom in on just this moment. What is ONE small thing you can do in the next 5 minutes to feel a tiny bit better? Sometimes the smallest step is enough 🌿'
  }

  if (
    msg.includes('angry') ||
    msg.includes('frustrated') ||
    msg.includes('mad') ||
    msg.includes('rage')
  ) {
    return "Anger is a valid emotion — it often signals that something important to you has been affected. Take a moment to breathe before responding to anything. Would you like to talk about what's triggering this feeling? 🌬️"
  }

  if (
    msg.includes('lonely') ||
    msg.includes('alone') ||
    msg.includes('isolated') ||
    msg.includes('no one')
  ) {
    return "Loneliness is one of the hardest feelings. I want you to know that right now, in this moment, you're not alone — I'm here with you. Would it help to explore some ways to feel more connected? 🤝"
  }

  if (
    msg.includes('happy') ||
    msg.includes('good') ||
    msg.includes('great') ||
    msg.includes('better') ||
    msg.includes('amazing')
  ) {
    return "That genuinely makes me smile to hear! 😊 Hold onto that feeling. What's contributing to you feeling good today? Noticing and savoring positive moments is a powerful wellness practice."
  }

  if (
    msg.includes('calm') ||
    msg.includes('relax') ||
    msg.includes('breathe') ||
    msg.includes('meditat')
  ) {
    return "Let's find some calm together 🌿 Try this: close your eyes, take a slow breath in through your nose for 4 counts, hold gently for 2, then breathe out through your mouth for 6 counts. Repeat 3 times. How do you feel?"
  }

  if (
    msg.includes('help') ||
    msg.includes('support') ||
    msg.includes('need')
  ) {
    return "I'm here and I want to help. You've taken a brave step by reaching out. Can you tell me a bit more about what you're going through? The more you share, the better I can support you 💚"
  }

  if (
    msg.includes('therapy') ||
    msg.includes('therapist') ||
    msg.includes('professional')
  ) {
    return 'Seeking professional support is one of the most powerful things you can do for your mental health. Serenify has qualified therapists available — would you like me to help you find one that matches your needs? 🌟'
  }

  if (
    msg.includes('hi') ||
    msg.includes('hello') ||
    msg.includes('hey') ||
    msg.includes('hii')
  ) {
    return "Hello! 🌿 I'm Serenity, your wellness companion. I'm here to listen, support, and help you find calm. How are you feeling today?"
  }

  if (
    msg.includes('check') ||
    msg.includes('how are') ||
    msg.includes('daily')
  ) {
    return "Thank you for checking in — that's a great wellness habit! Take a moment to notice: How does your body feel right now? How is your emotional state? Even a quick self-check builds self-awareness over time 🌱"
  }

  if (
    msg.includes('vent') ||
    msg.includes('talk') ||
    msg.includes('listen')
  ) {
    return "I'm all ears and I have no judgment — only compassion. Please share whatever is on your mind. Sometimes just expressing our thoughts out loud (or in writing) brings surprising relief 💬"
  }

  const defaults = [
    "Thank you for sharing that with me. I want to make sure I understand — can you tell me a bit more about how you're feeling right now? I'm here to listen 💚",
    "I hear you. Whatever you're going through, you don't have to face it alone. I'm here with you in this moment 🌿",
    'That sounds like a lot to carry. I appreciate you trusting me with this. How long have you been feeling this way?',
    "You matter, and what you're feeling matters. Let's take this one breath at a time together 💙",
    "I'm glad you reached out today. Sometimes just putting words to our feelings is the first step toward healing. How can I best support you right now?",
  ]

  return defaults[Math.floor(Math.random() * defaults.length)]
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const callGeminiAPI = async (
  history: GeminiMessage[],
  newMessage: string,
  apiKey: string,
  retries = 3,
): Promise<string> => {
  const systemInstruction =
    'You are Serenity, a compassionate AI mental health companion in the Serenify wellness app. You provide warm, empathetic, and supportive responses. Keep responses under 150 words, warm and non-clinical. Never diagnose. Never give medical advice. If someone expresses suicidal thoughts, provide crisis helpline: iCall: 9152987821'

  const contents: GeminiMessage[] = [
    ...history,
    { role: 'user', parts: [{ text: newMessage }] },
  ]

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemInstruction }],
    },
    contents,
    generationConfig: {
      maxOutputTokens: 300,
      temperature: 0.7,
    },
  }

  let lastError: any

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    for (let attempt = 1; attempt <= retries; attempt += 1) {
      try {
        console.log(`[Gemini] Trying model: ${model}, attempt: ${attempt}`)

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        })

        const data = (await response.json()) as any

        if (!response.ok) {
          const errMsg = data?.error?.message || `HTTP ${response.status}`
          lastError = new Error(`[${model}] ${errMsg}`)

          if (response.status === 429) {
            console.warn(`[Gemini] Quota exceeded for ${model}, trying next model`)
            break
          }

          if (response.status === 400 || response.status === 403) {
            throw new Error(`Permanent error: ${errMsg}`)
          }

          if (attempt < retries) {
            console.log('[Gemini] Temporary error, retrying in 2s...')
            await sleep(2000)
            continue
          }

          break
        }

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (!text) {
          throw new Error('Empty response')
        }

        console.log(`[Gemini] ✅ Success with model: ${model}`)
        return text
      } catch (error: any) {
        lastError = error
        if (error.message?.startsWith('Permanent error')) {
          throw error
        }

        if (attempt < retries) {
          await sleep(2000)
        }
      }
    }
  }

  throw lastError ?? new Error('All Gemini models exhausted')
}

export const sendMessage = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const { message, sessionId } = req.body as {
    message: string
    sessionId?: string
  }

  console.log(
    `[Chat] New message from user ${userId} | session: ${sessionId || 'new'}`,
  )
  console.log('[Config] Gemini API key present:', !!process.env.GEMINI_API_KEY)

  if (!message || !message.trim()) {
    res.status(400).json({ error: 'Message cannot be empty' })
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not properly configured')
  }

  let session
  try {
    if (sessionId) {
      session = await prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
      })
    }

    if (!session) {
      session = await prisma.chatSession.create({
        data: { userId, title: message.slice(0, 50) },
      })
    }
  } catch (error: any) {
    console.error('Database error creating session:', error?.message ?? error)
    res.status(500).json({ error: 'Failed to create chat session' })
    return
  }

  let history: Array<{ role: 'USER' | 'ASSISTANT'; content: string }> = []
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
    })

    history = messages.map((item) => ({ role: item.role, content: item.content }))
  } catch (error: any) {
    console.error('Database error fetching history:', error?.message ?? error)
    res.status(500).json({ error: 'Failed to load chat history' })
    return
  }

  try {
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'USER',
        content: message,
      },
    })
  } catch (error: any) {
    console.error('Database error saving user message:', error?.message ?? error)
    res.status(500).json({ error: 'Failed to save message' })
    return
  }

  const geminiHistory: GeminiMessage[] = history.map((msg) => ({
    role: msg.role === 'USER' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }))

  let reply = ''
  let usingMock = false

  try {
    if (!apiKey) {
      throw new Error('Missing Gemini API key')
    }
    reply = await callGeminiAPI(geminiHistory, message, apiKey)
    console.log('[Chat] Real AI response received')
  } catch (geminiError: any) {
    console.warn(
      '[Chat] Gemini failed, using mock response:',
      geminiError.message?.slice(0, 80),
    )
    reply = getMockResponse(message)
    usingMock = true
  }

  try {
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'ASSISTANT',
        content: reply,
      },
    })
  } catch (error: any) {
    console.error('Database error saving assistant message:', error?.message ?? error)
    res.status(500).json({ error: 'Failed to save assistant response' })
    return
  }

  res.status(200).json({
    reply,
    sessionId: session.id,
    messageId: randomUUID(),
    ...(usingMock && process.env.NODE_ENV === 'development' && { _mock: true }),
  })
}

export const getSessions = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    })

    res.status(200).json(sessions)
  } catch (error: any) {
    console.error('Database error listing sessions:', error?.message ?? error)
    res.status(500).json({ error: 'Failed to load chat sessions' })
  }
}

export const getSession = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const sessionId = String(req.params.id)
  try {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    })

    if (!session) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    })

    res.status(200).json({ session, messages })
  } catch (error: any) {
    console.error('Database error fetching session:', error?.message ?? error)
    res.status(500).json({ error: 'Failed to load chat session' })
  }
}

export const deleteSession = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const sessionId = String(req.params.id)
  try {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    })

    if (!session) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    await prisma.$transaction([
      prisma.chatMessage.deleteMany({ where: { sessionId } }),
      prisma.chatSession.delete({ where: { id: sessionId } }),
    ])

    res.status(200).json({ message: 'Session deleted' })
  } catch (error: any) {
    console.error('Database error deleting session:', error?.message ?? error)
    res.status(500).json({ error: 'Failed to delete session' })
  }
}

export const testGemini = async (req: any, res: Response) => {
  console.log('=== TEST GEMINI ROUTE HIT ===')
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.json({ status: 'error', message: 'No API key' })
  }

  try {
    let lastError: any = null

    for (const model of GEMINI_MODELS) {
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: 'Say hello in exactly 3 words' }],
            },
          ],
        }),
      })

      const data = (await response.json()) as any

      if (response.ok) {
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        return res.json({
          status: 'success',
          model,
          response: text,
          keyPrefix: `${apiKey.slice(0, 10)}...`,
        })
      }

      lastError = {
        httpStatus: response.status,
        message: data?.error?.message || 'Unknown error',
        fullError: data?.error,
        model,
      }

      if (response.status === 429) {
        continue
      }

      return res.json({
        status: 'error',
        ...lastError,
      })
    }

    return res.json({
      status: 'error',
      ...lastError,
    })
  } catch (error: any) {
    return res.json({
      status: 'error',
      message: error.message,
      type: 'network_error',
    })
  }
}
