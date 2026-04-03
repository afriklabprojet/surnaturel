import useSWR, { type SWRConfiguration } from "swr"

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error(`Erreur ${r.status}`)
  return r.json()
})

export function useFetch<T = unknown>(
  url: string | null,
  options?: SWRConfiguration
) {
  const { data, error, isLoading, mutate } = useSWR<T>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      ...options,
    }
  )

  return { data, error, loading: isLoading, mutate }
}
