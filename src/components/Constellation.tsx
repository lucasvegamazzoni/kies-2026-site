import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { forceCollide, forceLink, forceManyBody, forceSimulation, type SimulationNodeDatum } from 'd3-force'
import { HUB_ANCHORS, SESSIONS, SESSION_COLORS, WORLD_H, WORLD_W, imageFor } from '../data/sessions'
import type { Question, Session } from '../types'
import type { Selection } from '../App'

// Tile dimensions vary like the reference: mixed sizes and aspect ratios
const TILE_W = [74, 94, 80, 106, 86]
const TILE_ASPECT = [1, 0.8, 1.22]

const MAX_ZOOM = 3
const ZOOM_STEP = 1.35

// At overview zoom the map is fitted inside this padding so tiles never sit
// under the fixed corner chrome (tagline, credit, hint, zoom buttons)
const PAD = { top: 64, right: 30, bottom: 72, left: 30 }

interface HubNode extends SimulationNodeDatum {
  kind: 'hub'
  id: string
  session: Session
  sessionIndex: number
}

interface QNode extends SimulationNodeDatum {
  kind: 'q'
  id: string
  question: Question
  session: Session
  sessionIndex: number
  img: string
  tw: number
  th: number
}

type GNode = HubNode | QNode

interface QLink {
  source: QNode
  target: HubNode
  sessionIndex: number
  qid: string
}

function wrapTitle(title: string, max = 19): string[] {
  const words = title.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if (cur && (cur + ' ' + w).length > max) {
      lines.push(cur)
      cur = w
    } else {
      cur = cur ? cur + ' ' + w : w
    }
  }
  if (cur) lines.push(cur)
  return lines
}

function previewLines(t: string): string[] {
  if (t.length <= 46) return [t]
  const firstBreak = t.lastIndexOf(' ', 46)
  const first = t.slice(0, firstBreak)
  let second = t.slice(firstBreak + 1)
  if (second.length > 46) second = second.slice(0, 43).trimEnd() + '…'
  return [first, second]
}

function frac(n: number) {
  return n - Math.floor(n)
}

interface Props {
  counts: Record<string, number>
  onSelect: (s: Selection) => void
  onZoomChange?: (zoomed: boolean) => void
}

export default function Constellation({ counts, onSelect, onZoomChange }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [zoomK, setZoomK] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [viewport, setViewport] = useState<{ w: number; h: number } | null>(null)
  const zoomKRef = useRef(zoomK)
  const dragRef = useRef({ active: false, moved: false, startX: 0, startY: 0, panX: 0, panY: 0 })
  const draggedRef = useRef(false)

  const { hubs, qnodes, links, bounds } = useMemo(() => {
    const hubs: HubNode[] = SESSIONS.map((session, i) => {
      const x = HUB_ANCHORS[i][0] * WORLD_W
      const y = HUB_ANCHORS[i][1] * WORLD_H
      return { kind: 'hub' as const, id: session.id, session, sessionIndex: i, x, y, fx: x, fy: y }
    })
    const qnodes: QNode[] = []
    const links: QLink[] = []
    let idx = 0
    SESSIONS.forEach((session, si) => {
      const hub = hubs[si]
      session.questions.forEach((question, qi) => {
        const angle = (qi / session.questions.length) * Math.PI * 2 + si * 0.7
        const tw = TILE_W[idx % TILE_W.length]
        const th = Math.round(tw * TILE_ASPECT[idx % TILE_ASPECT.length])
        const node: QNode = {
          kind: 'q',
          id: question.id,
          question,
          session,
          sessionIndex: si,
          img: imageFor(question.id),
          tw,
          th,
          x: hub.fx! + Math.cos(angle) * 270,
          y: hub.fy! + Math.sin(angle) * 270,
        }
        qnodes.push(node)
        links.push({ source: node, target: hub, sessionIndex: si, qid: question.id })
        idx++
      })
    })

    forceSimulation<GNode>([...hubs, ...qnodes])
      .force(
        'link',
        forceLink<GNode, QLink>(links)
          .distance((_, i) => 300 + (i % 5) * 55)
          .strength(0.75),
      )
      .force(
        'charge',
        forceManyBody<GNode>().strength((d) => ((d as GNode).kind === 'hub' ? -900 : -40)),
      )
      .force(
        'collide',
        forceCollide<GNode>()
          .radius((d) => (d.kind === 'hub' ? 128 : Math.max((d as QNode).tw, (d as QNode).th) / 2 + 13))
          .iterations(2),
      )
      .stop()
      .tick(380)

    // Content bounding box: the overview must show everything (no panning there)
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const h of hubs) {
      minX = Math.min(minX, h.x! - 190)
      maxX = Math.max(maxX, h.x! + 190)
      minY = Math.min(minY, h.y! - 90)
      maxY = Math.max(maxY, h.y! + 90)
    }
    for (const n of qnodes) {
      minX = Math.min(minX, n.x! - n.tw / 2 - 18)
      maxX = Math.max(maxX, n.x! + n.tw / 2 + 18)
      minY = Math.min(minY, n.y! - n.th / 2 - 18)
      maxY = Math.max(maxY, n.y! + n.th / 2 + 18)
    }

    return { hubs, qnodes, links, bounds: { minX, maxX, minY, maxY } }
  }, [])

  useEffect(() => {
    const measure = () => {
      const el = svgRef.current
      if (!el) return
      const { width, height } = el.getBoundingClientRect()
      setViewport({ w: width, h: height })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    zoomKRef.current = zoomK
    onZoomChange?.(zoomK > 1.05)
  }, [zoomK, onZoomChange])

  // While zoomed in the wheel does nothing at all (no page scroll, no pan);
  // leaving the map requires zooming back out first.
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (zoomKRef.current > 1.01) e.preventDefault()
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [])

  const bw = bounds.maxX - bounds.minX
  const bh = bounds.maxY - bounds.minY
  const vw = viewport?.w ?? 1600
  const vh = viewport?.h ?? 1000
  const safeW = Math.max(200, vw - PAD.left - PAD.right)
  const safeH = Math.max(200, vh - PAD.top - PAD.bottom)
  const kBase = Math.min(safeW / bw, safeH / bh)
  const txBase = PAD.left + (safeW - bw * kBase) / 2 - bounds.minX * kBase
  const tyBase = PAD.top + (safeH - bh * kBase) / 2 - bounds.minY * kBase
  const k = kBase * zoomK
  const tx = (vw / 2) * (1 - zoomK) + zoomK * txBase + pan.x
  const ty = (vh / 2) * (1 - zoomK) + zoomK * tyBase + pan.y

  // Pan is clamped so the map edge never travels past the viewport edge;
  // at overview zoom the content fits, so the clamp collapses to (0,0)
  const clampPan = (px: number, py: number, zk: number) => {
    const kk = kBase * zk
    const maxX = Math.max(0, (bw * kk - vw) / 2 + 40)
    const maxY = Math.max(0, (bh * kk - vh) / 2 + 40)
    return { x: Math.min(maxX, Math.max(-maxX, px)), y: Math.min(maxY, Math.max(-maxY, py)) }
  }

  const applyZoom = (factor: number) => {
    const z = zoomK
    const nz = Math.min(MAX_ZOOM, Math.max(1, z * factor))
    setZoomK(nz)
    setPan((p) => clampPan((p.x * nz) / z, (p.y * nz) / z, nz))
  }

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (zoomK <= 1.01) return
    dragRef.current = { active: true, moved: false, startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y }
    setDragging(true)
  }

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = dragRef.current
    if (!d.active) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.moved && Math.abs(dx) + Math.abs(dy) > 6) {
      d.moved = true
      // capture only once a real drag starts, so clean clicks still reach the tiles
      svgRef.current?.setPointerCapture(e.pointerId)
    }
    if (d.moved) setPan(clampPan(d.panX + dx, d.panY + dy, zoomK))
  }

  const onPointerUp = () => {
    if (dragRef.current.moved) {
      draggedRef.current = true
      setTimeout(() => {
        draggedRef.current = false
      }, 0)
    }
    dragRef.current.active = false
    setDragging(false)
  }

  const selectNode = (n: QNode) => {
    if (draggedRef.current) return
    onSelect({ question: n.question, session: n.session, sessionIndex: n.sessionIndex })
  }

  const hoverIsHub = hover !== null && !hover.includes('-')
  const related = useMemo(() => {
    if (!hover) return null
    const set = new Set<string>([hover])
    if (hoverIsHub) {
      const hub = hubs.find((h) => h.id === hover)
      hub?.session.questions.forEach((q) => set.add(q.id))
    } else {
      const n = qnodes.find((q) => q.id === hover)
      if (n) set.add(n.session.id)
    }
    return set
  }, [hover, hoverIsHub, hubs, qnodes])

  const linkClass = (l: QLink) => {
    if (!hover) return 'link'
    const hot = hoverIsHub ? l.target.id === hover : l.qid === hover
    return hot ? 'link hot' : 'link dim'
  }
  const nodeClass = (base: string, id: string) => {
    if (!related || related.has(id)) return base
    return `${base} dim`
  }

  return (
    <>
      <svg
        ref={svgRef}
        className="constellation"
        style={{ cursor: zoomK > 1.01 ? (dragging ? 'grabbing' : 'grab') : 'default' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <g
          className="world"
          style={{ transform: `translate(${tx}px, ${ty}px) scale(${k})`, transition: dragging ? 'none' : undefined }}
        >
          <g>
            {links.map((l) => (
              <line
                key={l.qid}
                className={linkClass(l)}
                style={{ stroke: hover ? SESSION_COLORS[l.sessionIndex] : undefined }}
                x1={l.source.x}
                y1={l.source.y}
                x2={l.target.x}
                y2={l.target.y}
              />
            ))}
          </g>
          <g>
            {hubs.map((h) => {
              const lines = wrapTitle(h.session.title)
              const color = SESSION_COLORS[h.sessionIndex]
              return (
                <g
                  key={h.id}
                  className={nodeClass('hub', h.id)}
                  transform={`translate(${h.x},${h.y})`}
                  onMouseEnter={() => setHover(h.id)}
                  onMouseLeave={() => setHover(null)}
                >
                  <text className="hub-eyebrow" textAnchor="middle" y={-((lines.length - 1) / 2) * 40 - 34} fill={color}>
                    SESSION {String(h.session.no).padStart(2, '0')}
                  </text>
                  {lines.map((ln, i) => (
                    <text key={i} className="hub-title" textAnchor="middle" y={(i - (lines.length - 1) / 2) * 40 + 10}>
                      {ln}
                    </text>
                  ))}
                </g>
              )
            })}
          </g>
          <g>
            {qnodes.map((n, i) => {
              const color = SESSION_COLORS[n.sessionIndex]
              // Independent per-tile drift (from the reference recording: ~8-12px
              // amplitude, ~5-7s period, x/y out of phase for a wandering path)
              const floatStyle = {
                '--ax': `${7 + frac(i * 0.618) * 5}px`,
                '--ay': `${6 + frac(i * 0.414) * 5}px`,
                '--dx': `${2.4 + frac(i * 0.271) * 1.2}s`,
                '--dy': `${3.0 + frac(i * 0.887) * 1.4}s`,
                '--dlx': `${-frac(i * 0.732) * 6}s`,
                '--dly': `${-frac(i * 0.529) * 8}s`,
              } as CSSProperties
              const isHovered = hover === n.id
              const lines = isHovered ? previewLines(n.question.text) : []
              const votes = counts[n.id] ?? 0
              const badgeW = 30 + String(votes).length * 7
              const hw = n.tw / 2
              const hh = n.th / 2
              return (
                <g
                  key={n.id}
                  className={nodeClass('qnode', n.id)}
                  transform={`translate(${n.x},${n.y})`}
                  onMouseEnter={() => setHover(n.id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => selectNode(n)}
                >
                  <g className="float-x" style={floatStyle}>
                    <g className="float-y">
                      <g className="qnode-inner">
                        <clipPath id={`clip-${n.id}`}>
                          <rect x={-hw} y={-hh} width={n.tw} height={n.th} rx={2} />
                        </clipPath>
                        <image
                          href={`${import.meta.env.BASE_URL}art/${n.img}`}
                          x={-hw}
                          y={-hh}
                          width={n.tw}
                          height={n.th}
                          clipPath={`url(#clip-${n.id})`}
                          preserveAspectRatio="xMidYMid slice"
                        />
                        <rect
                          className="frame"
                          x={-hw}
                          y={-hh}
                          width={n.tw}
                          height={n.th}
                          rx={2}
                          style={{ stroke: isHovered ? color : undefined }}
                        />
                        {votes > 0 && (
                          <g className="badge" transform={`translate(${hw - 6},${-hh - 4})`}>
                            <rect x={-badgeW / 2} y={-9} width={badgeW} height={18} rx={9} />
                            <text textAnchor="middle" y={3.5} fill={color}>
                              ▲ {votes}
                            </text>
                          </g>
                        )}
                      </g>
                      {isHovered && (
                        <g className="qlabel">
                          {lines.map((ln, li) => (
                            <text key={li} className="qtext" textAnchor="middle" y={hh + 24 + li * 19}>
                              {ln}
                            </text>
                          ))}
                          <text className="qvotes" textAnchor="middle" fill={color} y={hh + 24 + lines.length * 19 + 3}>
                            ▲ {votes}
                          </text>
                        </g>
                      )}
                    </g>
                  </g>
                </g>
              )
            })}
          </g>
        </g>
      </svg>
      <div className="zoom-controls">
        <span>Zoom</span>
        <button onClick={() => applyZoom(ZOOM_STEP)} aria-label="Zoom in">
          +
        </button>
        <button onClick={() => applyZoom(1 / ZOOM_STEP)} aria-label="Zoom out">
          −
        </button>
      </div>
    </>
  )
}
