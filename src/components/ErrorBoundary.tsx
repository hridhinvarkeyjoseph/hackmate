import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { failed: boolean }

/** Replaces a blank screen with a way back. Saved data is not touched. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Hackmate hit an error', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="crash-screen" role="alert">
        <h1>Something went wrong</h1>
        <p>Your hackathons are still saved on this device. Reloading usually fixes this.</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Reload Hackmate
        </button>
      </main>
    )
  }
}
