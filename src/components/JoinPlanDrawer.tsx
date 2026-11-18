import { CalendarDays, ListChecks, Users } from 'lucide-react'
import type { Hackathon } from '../types'
import { formatDate, formatRange } from '../lib/date'
import { Drawer } from './Drawer'

type Props = {
  plan: Hackathon
  onJoin: () => void
  onClose: () => void
}

export function JoinPlanDrawer({ plan, onJoin, onClose }: Props) {
  return (
    <Drawer onClose={onClose} label={`Join ${plan.name}`}>
      <div className="welcome">
        <span className="drawer-eyebrow">A teammate shared this plan</span>
        <h2>{plan.name}</h2>
        <p>Add it to your board. Your progress stays on your own device.</p>
        <ul className="join-facts">
          <li>
            <CalendarDays size={15} /> {formatRange(plan.startDate, plan.endDate)}, deadline{' '}
            {formatDate(plan.deadline)}
          </li>
          <li>
            <ListChecks size={15} /> {plan.tasks.length}{' '}
            {plan.tasks.length === 1 ? 'task' : 'tasks'} in the plan
          </li>
          <li>
            <Users size={15} /> Team of {plan.teamSize}
          </li>
        </ul>
        <div className="welcome__actions">
          <button className="btn btn-primary" onClick={onJoin}>
            Add to my board
          </button>
          <button className="btn btn-quiet" onClick={onClose}>
            Not now
          </button>
        </div>
      </div>
    </Drawer>
  )
}
