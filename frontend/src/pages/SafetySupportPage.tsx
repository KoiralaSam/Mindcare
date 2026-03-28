import { Link } from 'react-router-dom'

export function SafetySupportPage() {
  return (
    <main className="shell shell--wide">
      <section className="panel">
        <h1 className="title title--sm">Safety & support</h1>
        <p className="lede">Crisis resources and support copy belong here.</p>
        <Link to="/dashboard" className="btn btn--primary">
          Dashboard
        </Link>
      </section>
    </main>
  )
}
