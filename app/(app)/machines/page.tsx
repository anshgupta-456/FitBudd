"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import { PageHeader } from "@/components/app-shell"
import { Chips, Tag } from "@/components/ui/bits"
import { Button } from "@/components/ui/button"
import { SheetContent } from "@/components/ui/dialog"
import { MACHINES, type Machine } from "@/lib/machines"

function Section({ title, items, ordered }: { title: string; items: string[]; ordered?: boolean }) {
  const List = ordered ? "ol" : "ul"
  return (
    <div>
      <h3 className="eyebrow mb-2">{title}</h3>
      <List className="space-y-2 text-sm leading-relaxed">
        {items.map((item, i) => (
          <li key={item} className="flex gap-3">
            {ordered ? (
              <span className="num w-4 shrink-0 font-mono text-xs leading-6 text-muted-foreground">{i + 1}</span>
            ) : (
              <span className="mt-2.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
            )}
            <span>{item}</span>
          </li>
        ))}
      </List>
    </div>
  )
}

function MachineDetail({ m }: { m: Machine }) {
  return (
    <div>
      <div className="relative aspect-[3/2] bg-muted">
        <Image src={m.image} alt={m.name} fill sizes="512px" className="object-cover" />
      </div>
      <div className="space-y-6 p-5">
        <div>
          <p className="text-sm leading-relaxed">{m.summary}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {m.muscles.map((x) => (
              <Tag key={x}>{x}</Tag>
            ))}
          </div>
        </div>
        <Section title="Set up" items={m.setup} />
        <Section title="How to do it" items={m.steps} ordered />
        <Section title="Cues" items={m.cues} />
        <Section title="Common mistakes" items={m.mistakes} />
        <div className="rounded border bg-surface-2 p-3 text-sm">
          <span className="font-medium">Where to start: </span>
          {m.starting}
        </div>
      </div>
    </div>
  )
}

export default function MachinesPage() {
  const [category, setCategory] = useState<"all" | Machine["category"]>("all")
  const [selected, setSelected] = useState<Machine | null>(null)
  const list = MACHINES.filter((m) => category === "all" || m.category === category)

  return (
    <>
      <PageHeader
        eyebrow="Technique"
        title="Machine guide"
        description="How to set up and use the machines you'll find in most gyms, and the mistakes worth avoiding."
        actions={
          <Button asChild>
            <Link href="/form-check">Check your form with the camera</Link>
          </Button>
        }
      />
      <Chips
        label="Category"
        className="mb-5"
        options={[
          { value: "all", label: "All" },
          { value: "strength", label: "Strength" },
          { value: "cardio", label: "Cardio" },
        ]}
        value={category}
        onChange={setCategory}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((m) => (
          <button
            key={m.slug}
            type="button"
            onClick={() => setSelected(m)}
            className="group overflow-hidden rounded-lg border bg-surface text-left transition-colors hover:border-border-strong"
          >
            <div className="relative aspect-[3/2] overflow-hidden bg-muted">
              <Image
                src={m.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 340px, (min-width: 640px) 50vw, 100vw"
                className="object-cover grayscale-[35%] transition duration-300 group-hover:scale-[1.02] group-hover:grayscale-0"
              />
            </div>
            <div className="p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-display text-xl font-semibold">{m.name}</h2>
                <span className="text-xs capitalize text-muted-foreground">{m.category}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{m.summary}</p>
            </div>
          </button>
        ))}
      </div>

      <DialogPrimitive.Root open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && (
          <SheetContent title={selected.name}>
            <MachineDetail m={selected} />
          </SheetContent>
        )}
      </DialogPrimitive.Root>
    </>
  )
}
