import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getDevContext } from '@/lib/dev/context'
import { isGmailConnected, getThread } from '@/lib/gmail'
import { ChevronLeft, Inbox } from 'lucide-react'
import { ReplyForm } from './ReplyForm'

export default async function SupportThreadPage({ params }: { params: { id: string } }) {
  const devCtx = await getDevContext()
  if (!devCtx?.isDeveloper) redirect('/owner')

  if (!(await isGmailConnected())) redirect('/owner/support')

  let thread
  try {
    thread = await getThread(params.id)
  } catch {
    notFound()
  }

  const lastMessage = thread.messages[thread.messages.length - 1]
  const replyTo = lastMessage.from.match(/<(.+)>/)?.[1] ?? lastMessage.from

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/owner/support" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-hospopilot-mid" />
            <h1 className="text-lg font-display font-semibold text-hospopilot-ink">{thread.subject}</h1>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {thread.messages.map(message => (
          <div
            key={message.id}
            className={`rounded-2xl border p-4 space-y-2 ${message.isMe ? 'bg-hospopilot-mid/5 border-hospopilot-mid/20' : 'bg-white border-black/[0.06]'}`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-hospopilot-ink">{message.from}</p>
              <p className="text-xs text-gray-400 shrink-0">
                {new Date(message.date).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <p className="text-sm text-hospopilot-ink/80 whitespace-pre-wrap">{message.body}</p>
          </div>
        ))}
      </div>

      <ReplyForm threadId={params.id} to={replyTo} subject={thread.subject} />
    </div>
  )
}
