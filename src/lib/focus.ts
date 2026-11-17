/**
 * Remembers the element that opened a panel so focus can return there on
 * close. A module-level slot is enough: only one drawer is open at a time.
 */
let trigger: HTMLElement | null = null

export function rememberTrigger(): void {
  trigger = (document.activeElement as HTMLElement | null) ?? null
}

export function consumeTrigger(): HTMLElement | null {
  const element = trigger
  trigger = null
  return element
}
