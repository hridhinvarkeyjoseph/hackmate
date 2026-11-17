import type { Status } from '../types'
import { statusSlug } from '../lib/date'

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`status-pill status-${statusSlug(status)}`}>
      <span className="status-dot" aria-hidden="true" />
      {status}
    </span>
  )
}
