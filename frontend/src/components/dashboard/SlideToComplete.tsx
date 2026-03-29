import { useCallback, useEffect, useRef, useState } from 'react'

type Props = {
  completed: boolean
  busy?: boolean
  onComplete: () => Promise<void>
}

const THRESHOLD = 0.82

export function SlideToComplete({ completed, busy, onComplete }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLButtonElement>(null)
  const [offset, setOffset] = useState(0)
  const [maxOffset, setMaxOffset] = useState(0)
  /** Keeps knob at the end after threshold until parent sets `completed` or API fails. */
  const [committed, setCommitted] = useState(false)
  const drag = useRef({ active: false, startX: 0, startOffset: 0, max: 0 })

  const measure = useCallback(() => {
    const track = trackRef.current
    const knob = knobRef.current
    if (!track || !knob) return
    const m = Math.max(0, track.clientWidth - knob.offsetWidth)
    drag.current.max = m
    setMaxOffset(m)
  }, [])

  useEffect(() => {
    measure()
    const ro = new ResizeObserver(() => measure())
    if (trackRef.current) ro.observe(trackRef.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  const snapBack = useCallback(() => {
    setCommitted(false)
    setOffset(0)
  }, [])

  useEffect(() => {
    if (completed) {
      setCommitted(false)
    }
  }, [completed])

  /** True while the knob must stay at the end: local commit or parent save in flight (survives remount / maxOffset glitches). */
  const lockedToEnd = committed || busy

  function onPointerDown(e: React.PointerEvent) {
    if (completed || busy || committed) return
    const track = trackRef.current
    const knob = knobRef.current
    if (!track || !knob) return
    const m = Math.max(0, track.clientWidth - knob.offsetWidth)
    drag.current.max = m
    setMaxOffset(m)
    drag.current.active = true
    drag.current.startX = e.clientX
    drag.current.startOffset = offset
    knobRef.current?.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current.active || completed || busy || committed) return
    const m = drag.current.max
    const dx = e.clientX - drag.current.startX
    let next = drag.current.startOffset + dx
    if (next < 0) next = 0
    if (next > m) next = m
    setOffset(next)
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!drag.current.active) return
    drag.current.active = false
    try {
      knobRef.current?.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    if (completed || busy || committed) return
    const m = drag.current.max
    if (m <= 0) return
    const dx = e.clientX - drag.current.startX
    let final = drag.current.startOffset + dx
    if (final < 0) final = 0
    if (final > m) final = m
    setOffset(final)

    if (final / m >= THRESHOLD) {
      setCommitted(true)
      setOffset(m)
      void (async () => {
        try {
          await onComplete()
        } catch {
          snapBack()
        }
      })()
    } else {
      snapBack()
    }
  }

  const progress = maxOffset > 0 ? (lockedToEnd ? 1 : offset / maxOffset) : lockedToEnd ? 1 : 0
  const atEnd = lockedToEnd || progress >= THRESHOLD

  if (completed) {
    return (
      <div className="slide-complete slide-complete--done" role="status" aria-label="Task completed">
        <div className="slide-complete__track slide-complete__track--completed">
          <div className="slide-complete__progress slide-complete__progress--full" aria-hidden />
          <div className="slide-complete__hint slide-complete__hint--done">Completed · embers added</div>
          <div className="slide-complete__knob slide-complete__knob--done" aria-hidden>
            <span aria-hidden>✦</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`slide-complete${busy ? ' slide-complete--busy' : ''}${atEnd ? ' slide-complete--at-end' : ''}`}
      ref={trackRef}
    >
      <div className="slide-complete__track">
        <div
          className="slide-complete__progress"
          style={{ width: `${progress * 100}%` }}
          aria-hidden
        />
        <div className="slide-complete__hint" style={{ opacity: Math.max(0, 1 - progress * 0.98) }}>
          {busy ? 'Saving…' : 'Slide to complete →'}
        </div>
        <button
          ref={knobRef}
          type="button"
          className={`slide-complete__knob${atEnd ? ' slide-complete__knob--at-end' : ''}${lockedToEnd ? ' slide-complete__knob--locked-end' : ''}`}
          disabled={busy || committed}
          style={lockedToEnd ? undefined : { transform: `translate(${offset}px, -50%)` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label="Drag to complete task"
        >
          <span aria-hidden>✦</span>
        </button>
      </div>
    </div>
  )
}
