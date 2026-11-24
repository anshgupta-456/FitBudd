"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { ExternalLink, Search } from "lucide-react"
import { useDeferredValue, useState } from "react"
import useSWR from "swr"

import { PageHeader } from "@/components/app-shell"
import { Chips, EmptyState, ErrorState, ListSkeleton, Rating, Tag } from "@/components/ui/bits"
import { Button } from "@/components/ui/button"
import { SheetContent } from "@/components/ui/dialog"
import { Input, Select } from "@/components/ui/field"
import { qs } from "@/lib/api"
import { useUser } from "@/lib/auth"
import { CITIES, rupees } from "@/lib/format"
import type { Gym } from "@/lib/types"

const PRICE_CAPS = [
  { value: "", label: "Any price" },
  { value: "2500", label: "Up to ₹2,500 / month" },
  { value: "3500", label: "Up to ₹3,500 / month" },
  { value: "5000", label: "Up to ₹5,000 / month" },
]

function GymDetail({ gym }: { gym: Gym }) {
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${gym.name}, ${gym.address}, ${gym.city}`)}`
  return (
    <div className="space-y-6 p-5">
      <div>
        <p className="text-sm text-muted-foreground">
          {gym.area}, {gym.city}
        </p>
        <div className="mt-2 flex items-center gap-4">
          <Rating value={gym.rating} count={gym.review_count} />
          <span className="num text-sm">
            <span className="font-medium">{rupees(gym.price_per_month)}</span>
            <span className="text-muted-foreground"> / month</span>
          </span>
        </div>
        {gym.description && <p className="mt-4 text-sm leading-relaxed">{gym.description}</p>}
      </div>

      <dl className="grid grid-cols-[120px_1fr] gap-y-2.5 border-t pt-5 text-sm">
        <dt className="text-muted-foreground">Weekdays</dt>
        <dd className="num">{gym.hours.weekdays}</dd>
        <dt className="text-muted-foreground">Weekends</dt>
        <dd className="num">{gym.hours.weekends}</dd>
        {gym.women_only_hours && (
          <>
            <dt className="text-muted-foreground">Women only</dt>
            <dd className="num">{gym.women_only_hours}</dd>
          </>
        )}
        <dt className="text-muted-foreground">Day pass</dt>
        <dd className="num">{gym.day_pass ? rupees(gym.day_pass) : "Members only"}</dd>
        <dt className="text-muted-foreground">Address</dt>
        <dd>{gym.address}</dd>
      </dl>

      <div className="border-t pt-5">
        <h3 className="eyebrow mb-2">Equipment</h3>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          {gym.equipment.map((e) => (
            <li key={e} className="flex gap-2">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground" />
              {e}
            </li>
          ))}
        </ul>
      </div>

      {gym.classes.length > 0 && (
        <div className="border-t pt-5">
          <h3 className="eyebrow mb-2">Classes included</h3>
          <div className="flex flex-wrap gap-1.5">
            {gym.classes.map((c) => (
              <Tag key={c}>{c}</Tag>
            ))}
          </div>
        </div>
      )}

      <div className="border-t pt-5">
        <h3 className="eyebrow mb-2">Amenities</h3>
        <div className="flex flex-wrap gap-1.5">
          {gym.amenities.map((a) => (
            <Tag key={a} tone="outline">
              {a}
            </Tag>
          ))}
        </div>
      </div>

      <Button asChild className="w-full">
        <a href={maps} target="_blank" rel="noreferrer">
          Directions <ExternalLink />
        </a>
      </Button>
    </div>
  )
}

export default function GymsPage() {
  const user = useUser()
  const [city, setCity] = useState(() => CITIES.find((c) => c.toLowerCase() === user.city?.toLowerCase()) ?? "")
  const [search, setSearch] = useState("")
  const q = useDeferredValue(search.trim())
  const [maxPrice, setMaxPrice] = useState("")
  const [amenities, setAmenities] = useState<string[]>([])
  const [womenHours, setWomenHours] = useState(false)
  const [sort, setSort] = useState("rating")
  const [selected, setSelected] = useState<Gym | null>(null)

  const { data, error, mutate } = useSWR<{ gyms: Gym[]; filters: { cities: string[]; amenities: string[] } }>(
    `/gyms${qs({ city, q, max_price: maxPrice, amenity: amenities, women_only_hours: womenHours, sort })}`,
    { keepPreviousData: true },
  )

  const toggleAmenity = (a: string) => setAmenities((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]))
  const amenityOptions = ["Showers", "Parking", "Steam room", "Pool", "Personal training", "Physio room", "Creche"]

  return (
    <>
      <PageHeader eyebrow="Book" title="Gyms" description="Monthly memberships and day passes near you, with what each place actually has on the floor." />

      <div className="mb-6 space-y-3">
        <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-[minmax(0,1fr)_160px_208px_160px]">
          <div className="relative sm:col-span-3 xl:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name or area" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search gyms" />
          </div>
          <Select value={city} onChange={(e) => setCity(e.target.value)} aria-label="City">
            <option value="">All cities</option>
            {(data?.filters.cities ?? CITIES).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} aria-label="Price">
            {PRICE_CAPS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="rating">Top rated</option>
            <option value="price">Lowest price</option>
            <option value="name">Name</option>
          </Select>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chips
            label="Women-only hours"
            options={[{ value: "women", label: "Women-only hours" }]}
            value={womenHours ? ["women"] : []}
            onChange={() => setWomenHours((v) => !v)}
          />
          <span className="mx-1 w-px self-stretch bg-border" />
          <Chips label="Amenities" options={amenityOptions.map((a) => ({ value: a, label: a }))} value={amenities} onChange={toggleAmenity} />
        </div>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={() => mutate()} />
      ) : !data ? (
        <ListSkeleton rows={5} />
      ) : data.gyms.length === 0 ? (
        <EmptyState
          title="No gyms match"
          action={
            <Button
              onClick={() => {
                setAmenities([])
                setMaxPrice("")
                setWomenHours(false)
                setSearch("")
              }}
            >
              Clear filters
            </Button>
          }
        >
          Try removing a filter or two.
        </EmptyState>
      ) : (
        <>
          <p className="mb-2 text-xs text-muted-foreground">{data.gyms.length} gyms</p>
          <div className="divide-y rounded-lg border bg-surface">
            {data.gyms.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelected(g)}
                className="grid w-full gap-x-6 gap-y-2 px-4 py-4 text-left hover:bg-muted/40 sm:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-baseline gap-x-2 font-medium">
                    {g.name}
                    <span className="text-sm font-normal text-muted-foreground">
                      {g.area}
                      {!city && `, ${g.city}`}
                    </span>
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{g.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {g.women_only_hours && <Tag tone="accent">Women-only hours</Tag>}
                    {g.amenities.slice(0, 4).map((a) => (
                      <Tag key={a} tone="outline">
                        {a}
                      </Tag>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-6 sm:flex-col sm:items-end sm:gap-1.5">
                  <p className="num text-sm">
                    <span className="font-medium">{rupees(g.price_per_month)}</span>
                    <span className="text-muted-foreground"> / mo</span>
                  </p>
                  <Rating value={g.rating} count={g.review_count} />
                  <p className="num text-xs text-muted-foreground">{g.hours.weekdays}</p>
                </div>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Listings are sample data for the demo.</p>
        </>
      )}

      <DialogPrimitive.Root open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && (
          <SheetContent title={selected.name}>
            <GymDetail gym={selected} />
          </SheetContent>
        )}
      </DialogPrimitive.Root>
    </>
  )
}
