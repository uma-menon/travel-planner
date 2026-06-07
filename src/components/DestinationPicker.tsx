"use client"

import * as React from "react"
import { City, Country, State, type ICity } from "country-state-city"
import { X, MapPin, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type Destination = {
  id: string
  label: string
}

type Props = {
  destinations: Destination[]
  setDestinations: React.Dispatch<React.SetStateAction<Destination[]>>
}

const MAX_DESTINATIONS = 5
const MAX_RESULTS = 50

// Module-level caches — populated once in the browser, reused across renders
let cachedCities: ICity[] | null = null
let countryNames: Map<string, string> | null = null
let stateNames: Map<string, string> | null = null

function ensureCaches() {
  if (!countryNames) {
    countryNames = new Map(Country.getAllCountries().map(c => [c.isoCode, c.name]))
  }
  if (!stateNames) {
    stateNames = new Map(State.getAllStates().map(s => [`${s.isoCode}-${s.countryCode}`, s.name]))
  }
  if (!cachedCities) {
    cachedCities = City.getAllCities()
  }
}

function searchCities(query: string): Destination[] {
  ensureCaches()
  const q = query.toLowerCase()
  const results: Destination[] = []
  for (const city of cachedCities!) {
    if (results.length >= MAX_RESULTS) break
    if (!city.name.toLowerCase().startsWith(q)) continue
    const country = countryNames!.get(city.countryCode) ?? city.countryCode
    const state = stateNames!.get(`${city.stateCode}-${city.countryCode}`)
    const label = [city.name, state, country].filter(Boolean).join(", ")
    results.push({ id: `${city.name}-${city.stateCode}-${city.countryCode}`, label })
  }
  return results
}

export function DestinationPicker({ destinations, setDestinations }: Props) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const results = React.useMemo(
    () => (query.length >= 2 ? searchCities(query) : []),
    [query]
  )

  const selectedIds = React.useMemo(
    () => new Set(destinations.map(d => d.id)),
    [destinations]
  )

  const toggle = (dest: Destination) => {
    setDestinations(prev => {
      if (prev.some(d => d.id === dest.id)) return prev.filter(d => d.id !== dest.id)
      if (prev.length >= MAX_DESTINATIONS) return prev
      return [...prev, dest]
    })
  }

  const remove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDestinations(prev => prev.filter(d => d.id !== id))
  }

  const atMax = destinations.length >= MAX_DESTINATIONS

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
      <div
        role="combobox"
        aria-expanded={open}
        className={cn(
          "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border px-3 py-2"
        )}
      >
          {destinations.length === 0 ? (
            <span className="text-muted-foreground">Search destinations...</span>
          ) : (
            destinations.map(dest => (
              <Badge
                key={dest.id}
                variant="secondary"
                className="h-auto gap-1 py-0.5 pr-0.5 text-xs"
              >
                {dest.label}
                <button
                  type="button"
                  className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                  onClick={e => remove(dest.id, e)}
                  aria-label={`Remove ${dest.label}`}
                >
                  <X className="size-2.5" />
                </button>
              </Badge>
            ))
          )}
          <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
        </div>
      </PopoverTrigger>

      <PopoverContent style={{ width: "var(--radix-popover-trigger-width)" }} className="p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type a city name..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {query.length < 2 ? (
              <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>
            ) : results.length === 0 ? (
              <CommandEmpty>No destinations found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {results.map(dest => {
                  const selected = selectedIds.has(dest.id)
                  return (
                    <CommandItem
                      key={dest.id}
                      value={dest.id}
                      data-checked={selected}
                      disabled={atMax && !selected}
                      onSelect={() => toggle(dest)}
                    >
                      <MapPin className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{dest.label}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </CommandList>

          {atMax && (
            <p className="border-t px-3 py-2 text-center text-xs text-muted-foreground">
              Maximum {MAX_DESTINATIONS} destinations selected
            </p>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
