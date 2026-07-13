import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined

// Null when env is missing: the app then runs in local-only mode.
export const supabase = url && key ? createClient(url, key) : null

const DEVICE_KEY = 'kies2026-device-id'
const VOTED_KEY = 'kies2026-voted'

export function deviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

export function loadVotedSet(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(VOTED_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

export function saveVotedSet(s: Set<string>) {
  localStorage.setItem(VOTED_KEY, JSON.stringify([...s]))
}

export async function fetchCounts(): Promise<Record<string, number> | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('get_vote_counts')
  if (error) {
    console.warn('fetching vote counts failed:', error.message)
    return null
  }
  const out: Record<string, number> = {}
  for (const row of data as { question_id: string; votes: number }[]) {
    out[row.question_id] = Number(row.votes)
  }
  return out
}

export async function castVote(q: string) {
  if (!supabase) return
  const { error } = await supabase.rpc('cast_vote', { q, device: deviceId() })
  if (error) throw error
}

export async function retractVote(q: string) {
  if (!supabase) return
  const { error } = await supabase.rpc('retract_vote', { q, device: deviceId() })
  if (error) throw error
}
