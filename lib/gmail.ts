import { createAdminClient } from '@/lib/supabase/admin'

const GMAIL_SETTINGS_KEY = 'gmail_oauth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me'

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

interface GmailTokens {
  refresh_token: string
  access_token?: string
  expires_at?: number // epoch ms
  email?: string
}

export async function saveGmailTokens(tokens: GmailTokens) {
  const admin = createAdminClient()
  await admin.from('platform_settings').upsert({
    key: GMAIL_SETTINGS_KEY,
    value: tokens,
    updated_at: new Date().toISOString(),
  })
}

export async function getGmailTokens(): Promise<GmailTokens | null> {
  const admin = createAdminClient()
  const { data } = await admin.from('platform_settings').select('value').eq('key', GMAIL_SETTINGS_KEY).single()
  return (data?.value as GmailTokens) ?? null
}

export async function isGmailConnected(): Promise<boolean> {
  const tokens = await getGmailTokens()
  return !!tokens?.refresh_token
}

/** Returns a valid access token, refreshing it if needed. */
async function getAccessToken(): Promise<string> {
  const tokens = await getGmailTokens()
  if (!tokens?.refresh_token) throw new Error('Gmail account not connected')

  const now = Date.now()
  if (tokens.access_token && tokens.expires_at && tokens.expires_at > now + 60_000) {
    return tokens.access_token
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    throw new Error(`Failed to refresh Gmail access token: ${await res.text()}`)
  }

  const data = await res.json()
  const updated: GmailTokens = {
    ...tokens,
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  }
  await saveGmailTokens(updated)
  return updated.access_token!
}

async function gmailFetch(path: string, init?: RequestInit) {
  const accessToken = await getAccessToken()
  const res = await fetch(`${GMAIL_API_BASE}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (!res.ok) {
    throw new Error(`Gmail API error (${path}): ${await res.text()}`)
  }
  return res.json()
}

export interface ThreadSummary {
  id: string
  snippet: string
  subject: string
  from: string
  date: string
  unread: boolean
}

function decodeHeaderValue(headers: { name: string; value: string }[], name: string): string {
  return headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''
}

/** List recent threads in the inbox. */
export async function listThreads(maxResults = 25): Promise<ThreadSummary[]> {
  const list = await gmailFetch(`/threads?maxResults=${maxResults}&labelIds=INBOX`)
  const threads = list.threads ?? []

  const detailed = await Promise.all(
    threads.map(async (t: { id: string }) => {
      const thread = await gmailFetch(`/threads/${t.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`)
      const lastMsg = thread.messages[thread.messages.length - 1]
      const headers = lastMsg.payload.headers as { name: string; value: string }[]
      return {
        id: thread.id,
        snippet: lastMsg.snippet ?? '',
        subject: decodeHeaderValue(headers, 'Subject') || '(no subject)',
        from: decodeHeaderValue(headers, 'From'),
        date: decodeHeaderValue(headers, 'Date'),
        unread: thread.messages.some((m: any) => m.labelIds?.includes('UNREAD')),
      }
    })
  )

  return detailed
}

export interface ThreadMessage {
  id: string
  from: string
  to: string
  date: string
  subject: string
  body: string
  isMe: boolean
}

function base64UrlDecode(data: string): string {
  const normalized = data.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(normalized, 'base64').toString('utf-8')
}

function extractBody(payload: any): string {
  if (payload.body?.data) return base64UrlDecode(payload.body.data)
  if (payload.parts) {
    const plain = payload.parts.find((p: any) => p.mimeType === 'text/plain')
    if (plain?.body?.data) return base64UrlDecode(plain.body.data)
    const html = payload.parts.find((p: any) => p.mimeType === 'text/html')
    if (html?.body?.data) return base64UrlDecode(html.body.data)
    for (const part of payload.parts) {
      const nested = extractBody(part)
      if (nested) return nested
    }
  }
  return ''
}

/** Get full thread with all messages. */
export async function getThread(threadId: string): Promise<{ messages: ThreadMessage[]; subject: string }> {
  const thread = await gmailFetch(`/threads/${threadId}?format=full`)
  const tokens = await getGmailTokens()
  const myEmail = tokens?.email?.toLowerCase()

  const messages: ThreadMessage[] = thread.messages.map((m: any) => {
    const headers = m.payload.headers as { name: string; value: string }[]
    const from = decodeHeaderValue(headers, 'From')
    return {
      id: m.id,
      from,
      to: decodeHeaderValue(headers, 'To'),
      date: decodeHeaderValue(headers, 'Date'),
      subject: decodeHeaderValue(headers, 'Subject'),
      body: extractBody(m.payload),
      isMe: !!myEmail && from.toLowerCase().includes(myEmail),
    }
  })

  // Mark thread as read
  await gmailFetch(`/threads/${threadId}/modify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
  }).catch(() => {})

  return { messages, subject: messages[messages.length - 1]?.subject ?? '(no subject)' }
}

function buildRawEmail(opts: { to: string; subject: string; body: string; inReplyTo?: string; references?: string }): string {
  const lines = [
    `To: ${opts.to}`,
    `Subject: ${opts.subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
  ]
  if (opts.inReplyTo) lines.push(`In-Reply-To: ${opts.inReplyTo}`)
  if (opts.references) lines.push(`References: ${opts.references}`)
  lines.push('', opts.body)

  const raw = lines.join('\r\n')
  return Buffer.from(raw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Reply to a thread. */
export async function sendReply(threadId: string, to: string, subject: string, body: string) {
  // Fetch the last message to get Message-ID for threading headers
  const thread = await gmailFetch(`/threads/${threadId}?format=metadata&metadataHeaders=Message-ID&metadataHeaders=References`)
  const lastMsg = thread.messages[thread.messages.length - 1]
  const headers = lastMsg.payload.headers as { name: string; value: string }[]
  const messageId = decodeHeaderValue(headers, 'Message-ID')
  const references = decodeHeaderValue(headers, 'References')

  const replySubject = subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`
  const raw = buildRawEmail({
    to,
    subject: replySubject,
    body,
    inReplyTo: messageId || undefined,
    references: [references, messageId].filter(Boolean).join(' ') || undefined,
  })

  return gmailFetch('/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw, threadId }),
  })
}
