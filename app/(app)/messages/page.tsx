"use client"

import { format, isSameDay, parseISO } from "date-fns"
import { ArrowLeft, SendHorizontal } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import useSWR from "swr"

import { Avatar, EmptyState, ErrorState, Skeleton } from "@/components/ui/bits"
import { Button } from "@/components/ui/button"
import { api, errorMessage } from "@/lib/api"
import { useUser } from "@/lib/auth"
import { ago, dayLabel, firstName, LEVEL_LABEL } from "@/lib/format"
import { useRefresh } from "@/lib/hooks"
import type { Conversation, Message, PublicMember } from "@/lib/types"
import { cn } from "@/lib/utils"

function ConversationList({ active }: { active: number | null }) {
  const { data, error } = useSWR<{ conversations: Conversation[] }>("/conversations", { refreshInterval: 10_000 })
  if (error) return <div className="p-3"><ErrorState error={error} /></div>
  if (!data)
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    )
  if (data.conversations.length === 0)
    return (
      <p className="p-4 text-sm text-muted-foreground">
        You can message people once they&apos;re your partners.{" "}
        <Link href="/partners" className="text-foreground underline underline-offset-2">
          Find partners
        </Link>
      </p>
    )
  return (
    <ul className="divide-y">
      {data.conversations.map((c) => (
        <li key={c.partner.id}>
          <Link
            href={`/messages?with=${c.partner.id}`}
            scroll={false}
            className={cn("flex items-center gap-3 px-4 py-3 hover:bg-muted/50", active === c.partner.id && "bg-muted")}
          >
            <Avatar name={c.partner.name} size={36} />
            <div className="min-w-0 flex-1">
              <p className="flex items-baseline justify-between gap-2">
                <span className={cn("truncate text-sm", c.unread ? "font-semibold" : "font-medium")}>{c.partner.name}</span>
                {c.last_message && <span className="shrink-0 text-2xs text-muted-foreground">{ago(c.last_message.sent_at)}</span>}
              </p>
              <p className={cn("truncate text-xs", c.unread ? "text-foreground" : "text-muted-foreground")}>
                {c.last_message ? c.last_message.body : "No messages yet. Say hi."}
              </p>
            </div>
            {c.unread > 0 && (
              <span className="num rounded-full bg-primary px-1.5 text-2xs font-semibold leading-[18px] text-primary-foreground">{c.unread}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function Thread({ partnerId }: { partnerId: number }) {
  const me = useUser()
  const refresh = useRefresh()
  const { data, error, mutate } = useSWR<{ partner: PublicMember; messages: Message[] }>(`/messages/${partnerId}`, {
    refreshInterval: 4000,
  })
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)
  const count = data?.messages.length ?? 0

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" })
    // Opening the thread marks messages read, so the unread badges need updating.
    if (count) refresh("/inbox", "/conversations")
  }, [count, partnerId])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const body = draft.trim()
    if (!body) return
    setSending(true)
    try {
      const { message } = await api.post<{ message: Message }>(`/messages/${partnerId}`, { body })
      setDraft("")
      mutate((cur) => (cur ? { ...cur, messages: [...cur.messages, message] } : cur), { revalidate: false })
      refresh("/conversations")
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  if (error) return <div className="p-6"><ErrorState error={error} /></div>
  if (!data) return <div className="flex-1" />

  const { partner, messages } = data
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Link href="/messages" className="-ml-1 rounded p-1 hover:bg-muted md:hidden" aria-label="Back to conversations">
          <ArrowLeft className="size-4" />
        </Link>
        <Avatar name={partner.name} size={32} />
        <div className="min-w-0">
          <p className="text-sm font-medium">{partner.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[partner.city, LEVEL_LABEL[partner.fitness_level], partner.last_active_at ? `active ${ago(partner.last_active_at)}` : null].filter(Boolean).join(" · ")}
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            No messages yet. Suggest a time and place to train with {firstName(partner.name)}.
          </p>
        ) : (
          <ol className="space-y-1.5">
            {messages.map((m, i) => {
              const mine = m.sender_id === me.id
              const prev = messages[i - 1]
              const newDay = !prev || !isSameDay(parseISO(prev.sent_at), parseISO(m.sent_at))
              const grouped = prev && !newDay && prev.sender_id === m.sender_id
              return (
                <li key={m.id}>
                  {newDay && (
                    <p className="my-4 text-center text-2xs uppercase tracking-wide text-muted-foreground">{dayLabel(parseISO(m.sent_at))}</p>
                  )}
                  <div className={cn("flex", mine ? "justify-end" : "justify-start", !grouped && i > 0 && "pt-2")}>
                    <div
                      className={cn(
                        "max-w-[78%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm",
                        mine ? "bg-foreground text-background" : "bg-muted text-foreground",
                      )}
                      title={format(parseISO(m.sent_at), "d MMM yyyy, HH:mm")}
                    >
                      {m.body}
                      <span className={cn("ml-2 inline-block translate-y-0.5 text-2xs", mine ? "text-background/55" : "text-muted-foreground")}>
                        {format(parseISO(m.sent_at), "HH:mm")}
                      </span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
        <div ref={bottom} />
      </div>

      <form onSubmit={send} className="flex items-end gap-2 border-t p-3">
        <textarea
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              e.currentTarget.form?.requestSubmit()
            }
          }}
          placeholder={`Message ${firstName(partner.name)}`}
          aria-label="Message"
          maxLength={2000}
          className="max-h-32 min-h-[36px] flex-1 resize-none rounded border border-input bg-surface px-3 py-2 text-sm focus:border-foreground focus:outline-none"
        />
        <Button type="submit" variant="primary" size="icon" loading={sending} disabled={!draft.trim()} aria-label="Send">
          {!sending && <SendHorizontal />}
        </Button>
      </form>
    </div>
  )
}

function MessagesPage() {
  const params = useSearchParams()
  const withId = Number(params.get("with")) || null

  return (
    <div className="-mb-10">
      <h1 className="mb-6 font-display text-[34px] font-semibold leading-none sm:text-[40px]">Messages</h1>
      <div className="grid h-[calc(100vh-200px)] min-h-[420px] overflow-hidden rounded-lg border bg-surface md:grid-cols-[300px_minmax(0,1fr)]">
        <aside className={cn("min-h-0 overflow-y-auto border-r", withId && "hidden md:block")}>
          <ConversationList active={withId} />
        </aside>
        <section className={cn("min-h-0", !withId && "hidden md:block")}>
          {withId ? (
            <Thread key={withId} partnerId={withId} />
          ) : (
            <EmptyState className="m-6 border-none" title="Pick a conversation">
              Messages with your training partners show up here.
            </EmptyState>
          )}
        </section>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense>
      <MessagesPage />
    </Suspense>
  )
}
