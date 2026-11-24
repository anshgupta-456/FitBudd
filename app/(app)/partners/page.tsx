"use client"

import { MessageSquare } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { toast } from "sonner"
import useSWR from "swr"

import { PageHeader } from "@/components/app-shell"
import { Avatar, EmptyState, ErrorState, ListSkeleton, Tabs, Tag } from "@/components/ui/bits"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog"
import { Field, Textarea } from "@/components/ui/field"
import { api, errorMessage } from "@/lib/api"
import { ago, firstName, GOAL_LABEL, LEVEL_LABEL, TIME_LABEL } from "@/lib/format"
import { useRefresh } from "@/lib/hooks"
import type { Partner, PartnerRequest, PublicMember, Suggestion } from "@/lib/types"
import { cn } from "@/lib/utils"

type Tab = "suggested" | "requests" | "partners"

function MemberSummary({ m }: { m: PublicMember }) {
  const facts = [m.age ? `${m.age}` : null, m.city, LEVEL_LABEL[m.fitness_level], m.preferred_time ? TIME_LABEL[m.preferred_time] : null].filter(Boolean)
  return (
    <>
      <p className="text-xs text-muted-foreground">{facts.join(" · ")}</p>
      {m.goals.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {m.goals.map((g) => (
            <Tag key={g}>{GOAL_LABEL[g]}</Tag>
          ))}
        </div>
      )}
    </>
  )
}

function MatchScore({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2" title="How closely your city, level, goals and training time line up">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", value >= 60 ? "bg-primary" : "bg-foreground/40")} style={{ width: `${value}%` }} />
      </div>
      <span className="num text-xs text-muted-foreground">{value}%</span>
    </div>
  )
}

function Suggested() {
  const refresh = useRefresh()
  const { data, error, mutate } = useSWR<{ suggestions: Suggestion[] }>("/partners/suggestions")
  const [target, setTarget] = useState<Suggestion | null>(null)
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)

  async function send() {
    if (!target) return
    setBusy(true)
    try {
      const res = await api.post<{ status: "pending" | "accepted" }>("/partners/requests", { user_id: target.id, note: note.trim() || null })
      toast.success(res.status === "accepted" ? `You and ${firstName(target.name)} are now partners` : `Request sent to ${firstName(target.name)}`)
      setTarget(null)
      setNote("")
      refresh("/partners", "/inbox", "/conversations")
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (error) return <ErrorState error={error} onRetry={() => mutate()} />
  if (!data) return <ListSkeleton rows={5} />
  if (data.suggestions.length === 0)
    return <EmptyState title="You've seen everyone for now">Check back later, or add your city and goals to your profile for better matches.</EmptyState>

  return (
    <>
      <p className="mb-3 text-sm text-muted-foreground">
        Ranked by how well your city, level, goals and usual training time line up. Fill in your profile to improve matches.
      </p>
      <div className="divide-y rounded-lg border bg-surface">
        {data.suggestions.map((s) => (
          <article key={s.id} className="flex gap-4 px-4 py-4">
            <Avatar name={s.name} size={44} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                <h3 className="font-medium">{s.name}</h3>
                <MatchScore value={s.match} />
              </div>
              <MemberSummary m={s} />
              {s.bio && <p className="mt-2 text-sm leading-relaxed">{s.bio}</p>}
              {s.reasons.length > 0 && <p className="mt-2 text-xs text-success">{s.reasons.join(" · ")}</p>}
            </div>
            <div className="shrink-0">
              <Button size="sm" onClick={() => setTarget(s)}>
                Connect
              </Button>
            </div>
          </article>
        ))}
      </div>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        {target && (
          <DialogContent title={`Connect with ${firstName(target.name)}`} description="Once they accept you can message each other and add each other to workouts.">
            <Field label="Add a note" htmlFor="p-note" optional hint={`${note.length}/280`}>
              <Textarea
                id="p-note"
                maxLength={280}
                placeholder={`Hi ${firstName(target.name)}, I train ${target.preferred_time ? TIME_LABEL[target.preferred_time].toLowerCase() : "most days"} too. Want to…`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setTarget(null)}>
                Cancel
              </Button>
              <Button variant="primary" loading={busy} onClick={send}>
                Send request
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}

function Requests() {
  const refresh = useRefresh()
  const { data, error, mutate } = useSWR<{ incoming: PartnerRequest[]; outgoing: PartnerRequest[] }>("/partners/requests")
  const [busy, setBusy] = useState<string | null>(null)

  async function act(r: PartnerRequest, action: "accept" | "decline" | "withdraw") {
    setBusy(`${action}${r.id}`)
    try {
      if (action === "withdraw") await api.delete(`/partners/requests/${r.id}`)
      else await api.post(`/partners/requests/${r.id}/${action}`)
      if (action === "accept") toast.success(`You and ${firstName(r.user.name)} are now partners`)
      refresh("/partners", "/inbox", "/conversations")
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  if (error) return <ErrorState error={error} onRetry={() => mutate()} />
  if (!data) return <ListSkeleton rows={2} />

  return (
    <div className="space-y-8">
      <section>
        <h2 className="eyebrow mb-2">Waiting for you</h2>
        {data.incoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requests right now.</p>
        ) : (
          <div className="divide-y rounded-lg border bg-surface">
            {data.incoming.map((r) => (
              <article key={r.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row">
                <div className="flex min-w-0 flex-1 gap-4">
                  <Avatar name={r.user.name} size={44} />
                  <div className="min-w-0">
                    <h3 className="font-medium">
                      {r.user.name} <span className="text-xs font-normal text-muted-foreground">{ago(r.sent_at)}</span>
                    </h3>
                    <MemberSummary m={r.user} />
                    {r.note && <blockquote className="mt-2 border-l-2 pl-3 text-sm">{r.note}</blockquote>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2 pl-[60px] sm:pl-0">
                  <Button size="sm" variant="primary" loading={busy === `accept${r.id}`} onClick={() => act(r, "accept")}>
                    Accept
                  </Button>
                  <Button size="sm" variant="ghost" loading={busy === `decline${r.id}`} onClick={() => act(r, "decline")}>
                    Decline
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="eyebrow mb-2">Sent by you</h2>
        {data.outgoing.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing pending.</p>
        ) : (
          <div className="divide-y rounded-lg border bg-surface">
            {data.outgoing.map((r) => (
              <div key={r.id} className="flex items-center gap-4 px-4 py-3">
                <Avatar name={r.user.name} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{r.user.name}</p>
                  <p className="text-xs text-muted-foreground">Sent {ago(r.sent_at)}</p>
                </div>
                <Button size="sm" variant="quiet" loading={busy === `withdraw${r.id}`} onClick={() => act(r, "withdraw")}>
                  Withdraw
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Partners() {
  const refresh = useRefresh()
  const { data, error, mutate } = useSWR<{ partners: Partner[] }>("/partners")

  async function remove(p: Partner) {
    if (!window.confirm(`Remove ${p.name} as a partner? You won't be able to message each other.`)) return
    try {
      await api.delete(`/partners/${p.id}`)
      refresh("/partners", "/conversations")
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  if (error) return <ErrorState error={error} onRetry={() => mutate()} />
  if (!data) return <ListSkeleton rows={2} />
  if (data.partners.length === 0) return <EmptyState title="No partners yet">Send a request from the Suggested tab. When someone accepts, they&apos;ll show up here.</EmptyState>

  return (
    <div className="divide-y rounded-lg border bg-surface">
      {data.partners.map((p) => (
        <article key={p.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start">
          <div className="flex min-w-0 flex-1 gap-4">
            <Avatar name={p.name} size={44} />
            <div className="min-w-0">
              <h3 className="font-medium">{p.name}</h3>
              <MemberSummary m={p} />
              {p.bio && <p className="mt-2 text-sm text-muted-foreground">{p.bio}</p>}
            </div>
          </div>
          <div className="flex shrink-0 gap-2 pl-[60px] sm:pl-0">
            <Button size="sm" asChild>
              <Link href={`/messages?with=${p.id}`}>
                <MessageSquare /> Message
              </Link>
            </Button>
            <Button size="sm" variant="quiet" onClick={() => remove(p)}>
              Remove
            </Button>
          </div>
        </article>
      ))}
    </div>
  )
}

function PartnersPage() {
  const router = useRouter()
  const params = useSearchParams()
  const tab = (params.get("tab") as Tab) || "suggested"
  const requests = useSWR<{ incoming: PartnerRequest[] }>("/partners/requests")
  const partners = useSWR<{ partners: Partner[] }>("/partners")

  return (
    <>
      <PageHeader eyebrow="People" title="Training partners" description="People near you who train at your level. Connect, then message to plan a session." />
      <Tabs
        className="mb-6"
        value={tab}
        onChange={(t) => router.replace(t === "suggested" ? "/partners" : `/partners?tab=${t}`, { scroll: false })}
        tabs={[
          { value: "suggested", label: "Suggested" },
          { value: "requests", label: "Requests", badge: requests.data?.incoming.length },
          { value: "partners", label: `Your partners${partners.data ? ` (${partners.data.partners.length})` : ""}` },
        ]}
      />
      {tab === "suggested" && <Suggested />}
      {tab === "requests" && <Requests />}
      {tab === "partners" && <Partners />}
    </>
  )
}

export default function Page() {
  return (
    <Suspense>
      <PartnersPage />
    </Suspense>
  )
}
