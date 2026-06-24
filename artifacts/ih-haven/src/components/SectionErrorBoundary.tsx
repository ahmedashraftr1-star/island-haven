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
}
interface State {
  hasError: boolean;
}

export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
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
