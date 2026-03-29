import { DashboardLayout } from '../components/dashboard/DashboardLayout'
import { TodayTasks } from '../components/dashboard/TodayTasks'
import { useWellnessFrontendResult } from '../assessment/useWellnessFrontendResult'

export function DashboardPage() {
  const frontend = useWellnessFrontendResult()
  const tasks = frontend?.tasks ?? []

  return (
    <DashboardLayout>
      <main className="dash-app__main dash-app__main--tasks-swiper">
        <div className="dash-app__main-inner dash-app__main-inner--tasks dash-app__main-inner--tasks-swiper">
          {frontend ? (
            <>
              <section className="dash-tasks-section" aria-labelledby="dash-tasks-heading">
                <TodayTasks tasks={tasks} resultSavedAt={frontend.savedAt} />
              </section>
              <p className="dash-app__disclaimer">
                Self-check only — not a diagnosis. If you are in crisis, use local emergency or crisis lines.
              </p>
            </>
          ) : (
            <div className="dash-app__empty">
              <p className="dash-app__empty-title">No results yet</p>
              <p className="dash-app__empty-text">
                Complete your wellbeing check-in to see Today&apos;s Tasks here.
              </p>
              <p className="dash-app__disclaimer dash-app__disclaimer--solo">
                Self-check only — not a diagnosis. Crisis? Use local emergency or crisis lines.
              </p>
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  )
}
