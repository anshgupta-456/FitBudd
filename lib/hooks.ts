"use client"

import { useSWRConfig } from "swr"

/** Revalidate every cached request whose path starts with one of the prefixes. */
export function useRefresh() {
  const { mutate } = useSWRConfig()
  return (...prefixes: string[]) =>
    mutate((key) => typeof key === "string" && prefixes.some((p) => key === p || key.startsWith(p)))
}
