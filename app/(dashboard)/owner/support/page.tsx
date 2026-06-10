import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getDevContext } from '@/lib/dev/context'
import { isGmailConnected, listThreads } from '@/lib/gmail'
import { Inbox, Mail, MailOpen, RefreshCw } from 'lucide-react'

function parseFrom(from: string): string {
  const match = from.match(/^(.*?)\s*<.*>$/)
  return match ? match[1].replace(/"/g, '').trim() : from
}

export default async function SupportInboxPage({ searchParams }: { searchParams: { error?: string; connected?: string } }) {
  const devCtx = await getDevContext()
  if (!devCtx?.isDeveloper) redirect('/owner')

  const connected = await isGmailConnected()

  if (!connected) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <Inbox className="h-10 w-10 text-gray-300 mx-auto" />
        <h1 className="text-xl font-semibold text-hospopilot-ink">Connect your support inbox</h1>
        <p className="text-sm text-hospopilot-ink/50">
          Connect the Gmail account that receives your support emails to view and reply to them here.
        </p>
        {searchParams.error && (
          <p className="text-sm text-red-600">
            Connection failed ({searchParams.error}). {searchParams.error === 'no_refresh_token' && 'Try removing HospoPilot access from your Google account security settings, then reconnect.'}
          </p>
        )}
        <a
          href="/api/auth/gmail/connect"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-hospopilot-gold hover:bg-yellow-600 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Mail className="h-4 w-4" /> Connect Gmail
        </a>
      </div>
    )
  }

  const threads = await listThreads(25)

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-hospopilot-mid" />
            <h1 className="text-2xl font-display font-semibold text-hospopilot-ink">Support Inbox</h1>
          </div>
          <p className="text-sm text-hospopilot-ink/50 mt-0.5">Recent support emails — click to view and reply</p>
        </div>
        <Link href="/owner/support" className="inline-flex items-center gap-1.5 text-xs font-semibold text-hospopilot-mid hover:text-hospopilot-deep">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
        {threads.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-gray-400">No messages in the inbox.</p>
        )}
        {threads.map(thread => (
          <Link
            key={thread.id}
            href={`/owner/support/${thread.id}`}
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <span className={`inline-flex items-center justify-center h-9 w-9 rounded-lg shrink-0 ${thread.unread ? 'bg-hospopilot-mid/10 text-hospopilot-mid' : 'bg-gray-100 text-gray-400'}`}>
              {thread.unread ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm truncate ${thread.unread ? 'font-semibold text-hospopilot-ink' : 'font-medium text-hospopilot-ink/80'}`}>
                {parseFrom(thread.from)}
              </p>
              <p className="text-xs text-gray-500 truncate">{thread.subject} — {thread.snippet}</p>
            </div>
            <p className="text-xs text-gray-400 shrink-0">
              {new Date(thread.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
