import { useEffect, type CSSProperties } from 'react'
import { artMetaFor } from '../data/sessions'
import type { Question, Session } from '../types'

interface Props {
  question: Question
  session: Session
  color: string
  image: string
  votes: number
  hasVoted: boolean
  onToggle: () => void
  onClose: () => void
}

export default function QuestionModal({ question, session, color, image, votes, hasVoted, onToggle, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const art = artMetaFor(image)

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ '--accent': color } as CSSProperties} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="modal-art" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}art/${image})` }} />

        <div className="modal-body">
          <div className="modal-eyebrow">
            Session {String(session.no).padStart(2, '0')} · {session.title}
          </div>
          <p className="modal-question">{question.text}</p>

          <button className={`vote-btn ${hasVoted ? 'voted' : ''}`} onClick={onToggle}>
            <span aria-hidden="true">▲</span> {votes}{' '}
            {hasVoted ? 'Upvoted' : 'Upvote this question'}
          </button>

          {art && (
            <div className="modal-source">
              <div className="modal-source-title">{art.title}</div>
              <div className="modal-source-meta">
                {art.artist} · {art.tradition} tradition · {art.licence}
                {art.source && (
                  <>
                    {' · '}
                    <a href={art.source} target="_blank" rel="noopener noreferrer">
                      Source
                    </a>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
