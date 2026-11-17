const pad = (value: number) => String(value).padStart(2, '0')

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

export function startOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function daysBetween(from: Date, to: Date): number {
  const utcFrom = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  const utcTo = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((utcTo - utcFrom) / 86_400_000)
}

export function daysUntil(value: string): number {
  return daysBetween(startOfDay(new Date()), startOfDay(parseDate(value)))
}

export function formatDate(
  value: string,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
): string {
  return parseDate(value).toLocaleDateString('en-US', options)
}

export function formatRange(start: string, end: string): string {
  const startDate = parseDate(start)
  const endDate = parseDate(end)
  const sameMonth =
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear()
  const sameYear = startDate.getFullYear() === endDate.getFullYear()

  if (sameMonth) {
    return `${startDate.toLocaleDateString('en-US', { month: 'short' })} ${startDate.getDate()}–${endDate.getDate()}, ${endDate.getFullYear()}`
  }

  if (sameYear) {
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${endDate.getFullYear()}`
  }

  return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

export function deadlineLabel(value: string): string {
  const days = daysUntil(value)
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  if (days > 1) return `Due in ${days} days`
  return `Deadline passed ${Math.abs(days)}d ago`
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12)
}

export function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1, 12)
  const weekday = (first.getDay() + 6) % 7
  const start = addDays(first, -weekday)
  return Array.from({ length: 42 }, (_, index) => addDays(start, index))
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function dateInRange(day: Date, start: string, end: string): boolean {
  const target = startOfDay(day).getTime()
  return (
    target >= startOfDay(parseDate(start)).getTime() &&
    target <= startOfDay(parseDate(end)).getTime()
  )
}

export function timeGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function statusSlug(status: string): string {
  return status.toLowerCase().replace(/\s+/g, '-')
}

/** Time left until the start (00:00) or end (23:59:59) of a calendar day. */
export function countdown(target: string, edge: 'start' | 'end' = 'start') {
  const now = new Date()
  const targetDate = startOfDay(parseDate(target))
  if (edge === 'end') targetDate.setHours(23, 59, 59, 999)
  const diff = Math.max(0, targetDate.getTime() - now.getTime())
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  return { days, hours, minutes }
}
