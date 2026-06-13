export type ChatSession = {
  id: string
  title: string
  createdAt: string
}

export type ChatMessage = {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  createdAt: string
  failed?: boolean
}

export type ChatSessionResponse = {
  session: ChatSession
  messages: ChatMessage[]
}

export type ChatReply = {
  reply: string
  sessionId: string
  messageId: string
  userMessageId: string
}
