import type { CSSProperties } from 'react'
import { SESSIONS, SESSION_COLORS, imageFor } from '../data/sessions'
import type { Question, Session } from '../types'
import type { Selection } from '../App'

interface Props {
  counts: Record<string, number>
  voted: Set<string>
  onToggle: (id: string) => void
  onSelect: (sel: Selection) => void
}

// Phone view: the constellation is dropped in favour of a scrollable list of
// session sections. Tapping the artwork opens the full panel (art + source);
// upvoting is inline for quick one-thumb voting.
export default function MobileList({ counts, voted, onToggle, onSelect }: Props) {
  return (
    <div className="mlist">
      <header className="mlist-hero">
        <img
          className="mlist-logo"
          src={`${import.meta.env.BASE_URL}kies-logo.svg`}
          alt="KIES 2026 — Kaizenvest & INSEAD Education Symposium"
        />
        <h1 className="mlist-title">The Big Questions</h1>
        <p className="mlist-intro">
          Ten sessions and the questions that will shape them. Tap an artwork to see it full, and upvote the
          questions you most want answered on stage.
        </p>
      </header>

      {SESSIONS.map((session: Session, i: number) => (
        <section className="mlist-session" key={session.id}>
          <div className="mlist-session-head" style={{ '--accent': SESSION_COLORS[i] } as CSSProperties}>
            <span className="mlist-session-no">Session {String(session.no).padStart(2, '0')}</span>
            <h2 className="mlist-session-title">{session.title}</h2>
          </div>

          {session.questions.map((q: Question) => {
            const image = imageFor(q.id)
            const votes = counts[q.id] ?? 0
            const hasVoted = voted.has(q.id)
            return (
              <div className="mcard" key={q.id} style={{ '--accent': SESSION_COLORS[i] } as CSSProperties}>
                <button
                  className="mcard-thumb"
                  style={{ backgroundImage: `url(${import.meta.env.BASE_URL}art/${image})` }}
                  onClick={() => onSelect({ question: q, session, sessionIndex: i })}
                  aria-label="View artwork and source"
                />
                <div className="mcard-main">
                  <p className="mcard-q">{q.text}</p>
                  <div className="mcard-actions">
                    <button
                      className={`vote-btn ${hasVoted ? 'voted' : ''}`}
                      onClick={() => onToggle(q.id)}
                    >
                      <span aria-hidden="true">▲</span> {votes} {hasVoted ? 'Upvoted' : 'Upvote'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </section>
      ))}

      <footer className="mlist-foot">
        <img
          src={`${import.meta.env.BASE_URL}kaizenvest.png`}
          alt="Kaizenvest"
          className="mlist-foot-logo"
        />
        <span>Kaizenvest &amp; INSEAD Education Symposium 2026</span>
      </footer>
    </div>
  )
}
