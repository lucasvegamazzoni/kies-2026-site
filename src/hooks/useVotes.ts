import { useCallback, useEffect, useRef, useState } from 'react'
import { castVote, fetchCounts, loadVotedSet, retractVote, saveVotedSet } from '../lib/supabase'

const POLL_MS = 15000

export function useVotes() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [voted, setVoted] = useState<Set<string>>(() => loadVotedSet())
  const votedRef = useRef(voted)

  useEffect(() => {
    let stopped = false
    const refresh = async () => {
      const c = await fetchCounts()
      if (!stopped && c) setCounts(c)
    }
    refresh()
    const timer = setInterval(refresh, POLL_MS)
    const onVisible = () => {
      if (!document.hidden) refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      stopped = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const toggle = useCallback(async (qid: string) => {
    const had = votedRef.current.has(qid)
    const apply = (has: boolean, delta: number) => {
      const next = new Set(votedRef.current)
      if (has) next.add(qid)
      else next.delete(qid)
      votedRef.current = next
      saveVotedSet(next)
      setVoted(next)
      setCounts((p) => ({ ...p, [qid]: Math.max(0, (p[qid] ?? 0) + delta) }))
    }
    apply(!had, had ? -1 : 1) // optimistic
    try {
      if (had) await retractVote(qid)
      else await castVote(qid)
    } catch (e) {
      console.warn('vote failed, reverting:', e)
      apply(had, had ? 1 : -1)
    }
  }, [])

  return { counts, voted, toggle }
}
