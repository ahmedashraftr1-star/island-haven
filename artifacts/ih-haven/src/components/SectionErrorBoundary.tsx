import { Component, type ReactNode } from "react";

/**
 * Guards a lazily-loaded section subtree. If a code-split chunk fails to load
 * (network blip, stale deploy) or a section throws while rendering, this keeps
 * the rest of the page alive instead of blanking it — the page must NEVER go
 * dark on a single section failure. Renders a quiet, non-intrusive fallback.
 */
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /**
   * When this value changes, the boundary clears its error and re-renders the
   * children. Pass the current route so navigating away from a crashed page
   * recovers instead of showing the fallback until a full reload.
   */
  resetKey?: unknown;
}
interface State {
  hasError: boolean;
  prevResetKey: unknown;
}

export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, prevResetKey: this.props.resetKey };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  // Clear the error the moment resetKey changes (e.g. a route change), so a
  // crash in one section/route never traps the user until reload.
  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey !== state.prevResetKey) {
      return { hasError: false, prevResetKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error: unknown) {
    // Surface for diagnostics without crashing the app.
    console.error("[SectionErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
