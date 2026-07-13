import { useEffect, type CSSProperties } from 'react'
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

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ '--accent': color } as CSSProperties} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <img className="modal-img" src={`/art/${image}`} alt="" />
        <div className="modal-eyebrow">
          Session {String(session.no).padStart(2, '0')} · {session.title}
        </div>
        <p className="modal-question">{question.text}</p>
        <div className="vote-row">
          <button className={`vote-btn ${hasVoted ? 'voted' : ''}`} onClick={onToggle}>
            <span aria-hidden="true">▲</span> {hasVoted ? 'Upvoted' : 'Upvote'}
          </button>
          <span className="vote-count">
            {votes} {votes === 1 ? 'vote' : 'votes'}
          </span>
        </div>
      </div>
    </div>
  )
}
