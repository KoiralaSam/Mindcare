import type { WellnessQuizAPIResponse } from '../../api/wellnessQuiz'
import { getVideoEmbedUrl } from '../../utils/videoEmbed'

type Task = WellnessQuizAPIResponse['frontend_result']['tasks'][number]

type Props = {
  tasks: Task[]
}

export function TodayTasks({ tasks }: Props) {
  if (tasks.length === 0) {
    return <p className="dash-tasks__empty">No tasks were included in this result yet.</p>
  }

  return (
    <div className="dash-tasks">
      <h2 id="dash-tasks-heading" className="dash-tasks__heading">
        Today&apos;s Tasks
      </h2>
      <ol className="dash-tasks__list dash-tasks__list--accordion">
        {tasks.map((task, i) => (
          <TodayTaskItem key={`${task.title}-${i}`} task={task} index={i} />
        ))}
      </ol>
    </div>
  )
}

function TodayTaskItem({ task, index }: { task: Task; index: number }) {
  const embed = task.url ? getVideoEmbedUrl(task.url) : null
  const n = index + 1

  return (
    <li>
      <details className="dash-task-details">
        <summary className="dash-task-details__summary">
          <span className="dash-tasks__num">{n}</span>
          <span className="dash-task-details__title">{task.title}</span>
          <span className="dash-task-details__chev" aria-hidden>
            ▾
          </span>
        </summary>
        <div className="dash-task-details__panel">
          <p className="dash-task-details__desc">{task.description}</p>
          {embed ? (
            <div className="dash-task-details__video">
              <iframe
                title={`Video for task ${n}: ${task.title}`}
                src={embed}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ) : task.url ? (
            <p className="dash-task-details__external">
              <a className="dash-tasks__link" href={task.url} target="_blank" rel="noreferrer">
                Open link
              </a>
            </p>
          ) : null}
        </div>
      </details>
    </li>
  )
}
