import { useEffect, useState } from 'react'
import Constellation from './components/Constellation'
import QuestionModal from './components/QuestionModal'
import { useVotes } from './hooks/useVotes'
import { SESSION_COLORS, imageFor } from './data/sessions'
import type { Question, Session } from './types'

export interface Selection {
  question: Question
  session: Session
  sessionIndex: number
}

// Scroll range (in viewport heights) over which the hero transitions into the map
const SCROLL_RANGE = 1.5

export default function App() {
  const [selected, setSelected] = useState<Selection | null>(null)
  const [mapActive, setMapActive] = useState(false)
  const [heroGone, setHeroGone] = useState(false)
  const [zoomed, setZoomed] = useState(false)
  const { counts, voted, toggle } = useVotes()

  useEffect(() => {
    const onScroll = () => {
      const max = window.innerHeight * SCROLL_RANGE
      const p = Math.min(1, window.scrollY / max)
      document.documentElement.style.setProperty('--p', String(p))
      setMapActive(p > 0.85)
      setHeroGone(p > 0.4)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const scrollToMap = () => window.scrollTo({ top: window.innerHeight * SCROLL_RANGE, behavior: 'smooth' })

  return (
    <>
      <div className="scroll-space" />
      <div className={`stage ${mapActive ? 'map-active' : ''} ${heroGone ? 'hero-gone' : ''} ${zoomed ? 'zoomed' : ''}`}>
        <Constellation counts={counts} onSelect={setSelected} onZoomChange={setZoomed} />

        <div className="word word-kies" aria-hidden="true">
          KIES
        </div>
        <div className="word word-2026" aria-hidden="true">
          2026
        </div>

        <div className="hero-copy">
          <p>
            Ten sessions. The questions that will shape them. Drawn up to keep every conversation sharp and specific
            for the education leaders, policy makers, capital allocators, and entrepreneurs shaping Asia's future.
            Every artwork on the map holds one question — click an image to reveal it, and upvote the ones you most
            want answered on stage.
          </p>
          <button className="cta" onClick={scrollToMap}>
            Explore the questions <span aria-hidden="true">↓</span>
          </button>
        </div>
        <button className="scroll-pill" onClick={scrollToMap}>
          Scroll <span aria-hidden="true">↓</span>
        </button>

        <div className="brand">
          <img src="/kies-logo.svg" alt="KIES 2026 — Kaizenvest & INSEAD Education Symposium" />
        </div>
        <div className="tagline">
          <strong>The Big Questions</strong>
          <span>Explore the map · Upvote what must be asked</span>
        </div>
        <div className="credit">
          <span>Presented by</span>
          <img src="/kaizenvest.png" alt="Kaizenvest" />
        </div>
        <div className="hint">Click an image to reveal its question · Zoom with + and − · When zoomed, drag to move</div>

        {selected && (
          <QuestionModal
            question={selected.question}
            session={selected.session}
            color={SESSION_COLORS[selected.sessionIndex]}
            image={imageFor(selected.question.id)}
            votes={counts[selected.question.id] ?? 0}
            hasVoted={voted.has(selected.question.id)}
            onToggle={() => toggle(selected.question.id)}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </>
  )
}
