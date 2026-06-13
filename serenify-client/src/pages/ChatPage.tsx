import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import type { AxiosError } from 'axios'
import {
  Loader2,
  MessageCirclePlus,
  Send,
  Trash2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import type { ChatMessage, ChatReply, ChatSession, ChatSessionResponse } from '../types/chat'

const starterChips = [
  "I'm feeling anxious 😰",
  'Help me calm down 🌬️',
  'I need to vent 💬',
  'Daily check-in ✨',
  "I can't sleep 😴",
]

const formatTime = (dateString: string) =>
  new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateString))

const formatTimeAgo = (dateString: string) => {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} min ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

type ChatErrorPayload = {
  error?: string
  message?: string
}

export default function ChatPage() {
  const queryClient = useQueryClient()
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const typingTimeout = useRef<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const sessionsQuery = useQuery<ChatSession[]>({
    queryKey: ['chat-sessions'],
    queryFn: async () => {
      const { data } = await api.get('/chat/sessions')
      const sessions = Array.isArray(data) ? data : data.sessions || []
      return sessions as ChatSession[]
    },
  })

  const sendMutation = useMutation({
    mutationFn: async (payload: { message: string; sessionId?: string }) => {
      const { data } = await api.post<ChatReply>('/chat/message', payload)
      return data
    },
    onSuccess: (data) => {
      const newMessage: ChatMessage = {
        id: data.messageId,
        role: 'ASSISTANT',
        content: data.reply,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, newMessage])
      setActiveSessionId(data.sessionId)
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['chat-session', data.sessionId] })
      setIsTyping(false)
    },
    onError: (error: unknown) => {
      const typedError = error as AxiosError<ChatErrorPayload>
      setIsTyping(false)
      setMessages((prev) => {
        const updated = [...prev]
        const lastUserIdx = [...updated].reverse().findIndex((item) => item.role === 'USER')
        if (lastUserIdx !== -1) {
          const actualIdx = updated.length - 1 - lastUserIdx
          updated[actualIdx] = { ...updated[actualIdx], failed: true }
        }
        return updated
      })

      const status = typedError.response?.status
      const errorMessage =
        typedError.response?.data?.error ||
        typedError.response?.data?.message ||
        typedError.message ||
        'Unknown error'

      console.error('Chat error details:', {
        status,
        errorMessage,
        fullResponse: typedError.response?.data,
      })

      if (status === 429) {
        toast.error("You've reached your hourly limit")
        setRateLimited(true)
        if (typingTimeout.current) window.clearTimeout(typingTimeout.current)
        typingTimeout.current = window.setTimeout(() => {
          setRateLimited(false)
        }, 60 * 60 * 1000)
        return
      }

      if (status === 500) {
        toast.error(errorMessage || 'AI service temporarily unavailable')
        return
      }

      if (status === 401) {
        toast.error('Session expired. Please log in again.')
        return
      }

      toast.error(errorMessage || 'Unable to send message')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await api.delete(`/chat/sessions/${sessionId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
      setActiveSessionId(null)
      setMessages([])
    },
  })

  const openSession = async (sessionId: string) => {
    setActiveSessionId(sessionId)
    setIsPanelOpen(false)
    try {
      const data = await queryClient.fetchQuery({
        queryKey: ['chat-session', sessionId],
        queryFn: async () => {
          const response = await api.get<ChatSessionResponse>(`/chat/sessions/${sessionId}`)
          return response.data
        },
        staleTime: 0,
      })
      setMessages(data.messages)
    } catch {
      toast.error('Unable to load this conversation')
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = (content: string) => {
    if (!content.trim() || rateLimited || isTyping) return
    const trimmed = content.trim()
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'USER',
      content: trimmed,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    setMessage('')
    setIsTyping(true)
    sendMutation.mutate({
      message: trimmed,
      sessionId: activeSessionId ?? undefined,
    })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend(message)
    }
  }

  const isEmpty = messages.length === 0
  const sessionList = sessionsQuery.data ?? []
  const sessionsLoading = sessionsQuery.isLoading
  const counter = useMemo(() => `${message.length}/500`, [message.length])
  const canSend = Boolean(message.trim()) && !isTyping && !rateLimited

  const handleClearChat = () => {
    if (activeSessionId) {
      deleteMutation.mutate(activeSessionId)
      return
    }
    setMessages([])
  }

  return (
    <div className="min-h-[100vh] bg-[var(--bg-primary)] p-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[280px_1fr]">
        <aside
          className={`h-[calc(100vh-48px)] flex-col rounded-[20px] border border-[var(--border-color)] bg-[var(--sidebar-bg)] p-4 shadow-[var(--card-shadow)] ${
            isPanelOpen ? 'flex' : 'hidden'
          } lg:flex`}
        >
          <div className="mb-3 flex items-center justify-between lg:hidden">
            <span className="text-sm font-semibold text-[var(--text-primary)]">Sessions</span>
            <button
              type="button"
              onClick={() => setIsPanelOpen(false)}
              className="rounded-full border border-[var(--border-color)] px-3 py-1 text-xs text-[var(--text-secondary)]"
            >
              Close
            </button>
          </div>
          <div className="mb-5 rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-mint)] text-base text-white">🌿</span>
              Serenity AI
            </div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Your mindful companion</p>
          </div>

          <button
            type="button"
            className="mb-4 flex w-full items-center justify-between rounded-full bg-[var(--accent-mint)] px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]"
            onClick={() => {
              setActiveSessionId(null)
              setMessages([])
            }}
            aria-label="Start new chat"
          >
            New Chat
            <MessageCirclePlus size={16} />
          </button>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {sessionsLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`session-skeleton-${index}`}
                  className="h-14 rounded-[16px] bg-[var(--bg-card)] animate-pulse"
                />
              ))
            ) : sessionList.length === 0 ? (
              <div className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4 text-center text-sm text-[var(--text-muted)]">
                <p className="text-base">💬</p>
                <p className="mt-2 font-semibold">Start your first conversation</p>
                <p className="mt-1 text-xs">A gentle check-in is a great place to begin.</p>
              </div>
            ) : (
              sessionList.map((session) => (
                <div
                  key={session.id}
                  className={`group rounded-[16px] border-l-4 px-3 py-3 transition hover:-translate-y-[1px] hover:shadow-[var(--card-shadow)] ${
                    activeSessionId === session.id
                      ? 'border-[var(--accent-mint)] bg-[var(--bg-card)]'
                      : 'border-transparent bg-[var(--bg-card)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      className="flex-1 text-left"
                      onClick={() => {
                        void openSession(session.id)
                      }}
                    >
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {session.title}
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                        {formatTimeAgo(session.createdAt)}
                      </p>
                    </button>
                    <button
                      type="button"
                      aria-label="Delete chat session"
                      className="opacity-0 transition group-hover:opacity-100"
                      onClick={() => deleteMutation.mutate(session.id)}
                    >
                      <Trash2 size={14} className="text-rose-500" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <p className="mt-4 text-center text-[11px] text-[var(--text-muted)]">
            All conversations are private 🔒
          </p>
        </aside>

        <section className="flex h-[calc(100vh-48px)] flex-col rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--card-shadow)]">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-lavender)] text-base text-white">
                🌿
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Serenity
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Mental wellness companion
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPanelOpen(true)}
                  aria-label="Open sessions"
                  className="rounded-full border border-[var(--border-color)] px-3 py-1 text-xs text-[var(--text-secondary)] lg:hidden"
                >
                  Sessions
                </button>
              <span className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Online
              </span>
              <button
                type="button"
                onClick={handleClearChat}
                aria-label="Clear conversation"
                className="rounded-full border border-[var(--border-color)] px-3 py-1 text-xs text-[var(--text-secondary)]"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
            {isEmpty && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent-mint)] text-3xl text-white">
                  🌿
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
                  Hello, I'm Serenity 🌿
                </h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Your safe space to talk, reflect, and find calm
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {starterChips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleSend(chip)}
                      className="rounded-full bg-[var(--bg-secondary)] px-4 py-2 text-xs font-semibold text-[var(--accent-mint)] shadow-sm transition hover:scale-[1.02] hover:shadow-[var(--card-shadow-hover)]"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex ${
                  item.role === 'USER' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div className="flex max-w-[70%] items-end gap-2">
                  {item.role === 'ASSISTANT' && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-lavender)] text-xs text-white">
                      🌿
                    </div>
                  )}
                  <div>
                    <div
                      className={`rounded-[20px] px-4 py-3 text-sm shadow-sm ${
                        item.role === 'USER'
                          ? 'rounded-br-[4px] bg-[linear-gradient(135deg,_#3BBFA3,_#2DA58B)] text-white'
                          : 'rounded-bl-[4px] bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                      }`}
                    >
                      {item.content}
                    </div>
                    <div className="mt-1 text-[10px] text-[var(--text-muted)]">
                      {formatTime(item.createdAt)}
                    </div>
                    {item.failed && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#E85D75',
                          marginTop: '4px',
                          textAlign: 'right',
                        }}
                      >
                        ⚠️ Failed to send ·{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setMessages((prev) => prev.filter((msg) => msg.id !== item.id))
                            handleSend(item.content)
                          }}
                          style={{
                            color: '#3BBFA3',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '11px',
                            textDecoration: 'underline',
                          }}
                        >
                          Retry
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-lavender)] text-xs text-white">
                  🌿
                </div>
                <div className="rounded-[20px] rounded-bl-[4px] bg-[var(--bg-secondary)] px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((dot) => (
                      <motion.span
                        key={`dot-${dot}`}
                        className="h-2 w-2 rounded-full bg-[var(--accent-lavender)]"
                        animate={{ y: [0, -4, 0] }}
                        transition={{
                          duration: 0.9,
                          repeat: Infinity,
                          delay: dot * 0.15,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-[var(--text-muted)]">
                  Serenity is thinking...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-[var(--border-color)] bg-[var(--bg-secondary)] px-6 py-4">
            <div className="flex items-end gap-3">
              <div className="flex w-full flex-col">
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value.slice(0, 500))}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  placeholder="Share what's on your mind..."
                  className="w-full resize-none rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] shadow-sm"
                  disabled={isTyping || rateLimited}
                />
                <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>
                    {rateLimited
                      ? "You've reached your hourly limit"
                      : 'Serenity is here to listen, not to judge 💚'}
                  </span>
                  <span>{counter}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSend(message)}
                disabled={!canSend}
                aria-label="Send message"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,_#3BBFA3,_#2DA58B)] text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isTyping ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
