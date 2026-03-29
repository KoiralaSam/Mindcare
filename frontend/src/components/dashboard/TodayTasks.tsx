import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import type { WellnessQuizAPIResponse } from '../../api/wellnessQuiz'
import { postTaskComplete } from '../../api/taskComplete'
import { addCompletedTaskIndex, getCompletedTaskIndices } from '../../assessment/taskCompletions'
import { getVideoEmbedUrl } from '../../utils/videoEmbed'
import { SlideToComplete } from './SlideToComplete'

type Task = WellnessQuizAPIResponse['frontend_result']['tasks'][number]

type Props = {
  tasks: Task[]
  /** Wellness result timestamp — scopes which tasks are marked done in storage. */
  resultSavedAt: string
}

export function TodayTasks({ tasks, resultSavedAt }: Props) {
  const { email, patchUser } = useAuth()
  const [done, setDone] = useState<Set<number>>(() => getCompletedTaskIndices(resultSavedAt))
  const [submitting, setSubmitting] = useState<number | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    setDone(getCompletedTaskIndices(resultSavedAt))
  }, [resultSavedAt])

  useEffect(() => {
    const el = carouselRef.current
    if (!el) return
    const onScroll = () => {
      const w = el.clientWidth
      if (w <= 0) return
      const i = Math.round(el.scrollLeft / w)
      setActiveIndex(Math.min(tasks.length - 1, Math.max(0, i)))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [tasks.length])

  const scrollByPage = useCallback((delta: number) => {
    const el = carouselRef.current
    if (!el) return
    const w = el.clientWidth
    el.scrollBy({ left: delta * w, behavior: 'smooth' })
  }, [])

  const onSlideComplete = useCallback(
    async (index: number) => {
      if (!email?.trim()) throw new Error('Not signed in')
      setSubmitting(index)
      try {
        const res = await postTaskComplete(email)
        addCompletedTaskIndex(resultSavedAt, index)
        setDone((prev) => new Set([...prev, index]))
        patchUser({
          daily_ember: Number(res.daily_ember),
          streak: Number(res.streak),
        })
      } finally {
        setSubmitting(null)
      }
    },
    [email, resultSavedAt, patchUser],
  )

  if (tasks.length === 0) {
    return <p className="dash-tasks__empty">No tasks were included in this result yet.</p>
  }

  return (
    <div className="dash-tasks-v2">
      <h2 id="dash-tasks-heading" className="dash-tasks-v2__title">
        Today&apos;s tasks
      </h2>
      <p className="dash-tasks-v2__hint" id="dash-tasks-hint">
        Tap the left or right side of the task details, swipe, or use the side arrows. Numbers list every task.
      </p>
      <div className="dash-tasks-v2__carousel-wrap">
        <div className="dash-tasks-v2__frame">
          {tasks.length > 1 ? (
            <button
              type="button"
              className="dash-tasks-v2__side-arrow dash-tasks-v2__side-arrow--prev"
              aria-label="Previous task"
              disabled={activeIndex <= 0}
              onClick={() => scrollByPage(-1)}
            >
              ‹
            </button>
          ) : null}
          <div
            ref={carouselRef}
            className="dash-tasks-v2__swiper"
            role="region"
            aria-labelledby="dash-tasks-heading"
            aria-describedby="dash-tasks-hint"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                scrollByPage(1)
                e.preventDefault()
              } else if (e.key === 'ArrowLeft') {
                scrollByPage(-1)
                e.preventDefault()
              }
            }}
          >
            {tasks.map((task, i) => (
              <TaskSlide
                key={`${task.title}-${i}`}
                task={task}
                index={i}
                total={tasks.length}
                completed={done.has(i)}
                busy={submitting === i}
                onSlideComplete={() => onSlideComplete(i)}
                tapNavigate={
                  tasks.length > 1
                    ? (dir) => {
                        const el = carouselRef.current
                        if (!el) return
                        const w = el.clientWidth
                        if (w <= 0) return
                        const idx = Math.round(el.scrollLeft / w)
                        if (dir === -1 && idx <= 0) return
                        if (dir === 1 && idx >= tasks.length - 1) return
                        scrollByPage(dir)
                      }
                    : undefined
                }
              />
            ))}
          </div>
          {tasks.length > 1 ? (
            <button
              type="button"
              className="dash-tasks-v2__side-arrow dash-tasks-v2__side-arrow--next"
              aria-label="Next task"
              disabled={activeIndex >= tasks.length - 1}
              onClick={() => scrollByPage(1)}
            >
              ›
            </button>
          ) : null}
        </div>
        {tasks.length > 1 ? (
          <div className="dash-tasks-v2__pagebar" role="tablist" aria-label="Tasks">
            {tasks.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`Task ${i + 1} of ${tasks.length}`}
                className={`dash-tasks-v2__pagebtn${i === activeIndex ? ' dash-tasks-v2__pagebtn--active' : ''}`}
                onClick={() => {
                  const el = carouselRef.current
                  if (!el) return
                  const w = el.clientWidth
                  el.scrollTo({ left: i * w, behavior: 'smooth' })
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function TaskSlide({
  task,
  index,
  total,
  completed,
  busy,
  onSlideComplete,
  tapNavigate,
}: {
  task: Task
  index: number
  total: number
  completed: boolean
  busy: boolean
  onSlideComplete: () => Promise<void>
  tapNavigate?: (direction: -1 | 1) => void
}) {
  const embed = task.url ? getVideoEmbedUrl(task.url) : null
  const imageURL = typeof task.image_url === 'string' && task.image_url.trim() ? task.image_url.trim() : null
  const n = index + 1

  function onBodyClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!tapNavigate) return
    const target = e.target as HTMLElement
    if (target.closest('a, button, input, textarea, select, iframe')) return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const x = e.clientX - r.left
    const w = r.width
    if (w <= 0) return
    const pct = x / w
    if (pct < 0.34) {
      tapNavigate(-1)
    } else if (pct > 0.66) {
      tapNavigate(1)
    }
  }

  return (
    <section className="dash-tasks-slide" aria-label={`Task ${n} of ${total}`}>
      <header className="dash-tasks-slide__head">
        <span className="dash-tasks-slide__badge">
          {n} / {total}
        </span>
        <h2 className="dash-tasks-slide__title">{task.title}</h2>
      </header>
      <div
        className={`dash-tasks-slide__body${tapNavigate ? ' dash-tasks-slide__body--tapnav' : ''}`}
        onClick={tapNavigate ? onBodyClick : undefined}
      >
        <p className="dash-tasks-slide__desc">{task.description}</p>
        {embed ? (
          <>
            <div className="dash-task-details__video dash-tasks-slide__video">
              <iframe
                title={`Video for task ${n}: ${task.title}`}
                src={embed}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            {task.url ? (
              <p className="dash-task-details__external">
                <a className="dash-tasks__link" href={task.url} target="_blank" rel="noreferrer">
                  Video not loading? Open on YouTube
                </a>
              </p>
            ) : null}
          </>
        ) : task.url ? (
          <p className="dash-task-details__external">
            <a className="dash-tasks__link" href={task.url} target="_blank" rel="noreferrer">
              Open link
            </a>
          </p>
        ) : imageURL ? (
          <div className="dash-task-details__video dash-tasks-slide__video">
            <img className="dash-tasks-slide__image" src={imageURL} alt={`Task image for ${task.title}`} loading="lazy" />
          </div>
        ) : null}
      </div>
      <footer className="dash-tasks-slide__footer">
        <SlideToComplete completed={completed} busy={busy} onComplete={onSlideComplete} />
      </footer>
    </section>
  )
}
