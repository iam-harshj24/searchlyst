import React from 'react';

/**
 * Catches render errors so a single bad route does not white-screen the whole app in production.
 */
export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, err: null };
    }

    static getDerivedStateFromError(err) {
        return { hasError: true, err };
    }

    componentDidCatch(err, info) {
        if (import.meta.env.DEV) {
            console.error('[ErrorBoundary]', err, info?.componentStack);
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 px-6 py-16 text-center bg-[#0a0a0a] text-white">
                    <p className="text-lg font-semibold">Something went wrong</p>
                    <p className="text-sm text-white/70 max-w-md">
                        Please refresh the page. If the problem continues, try signing out and back in.
                    </p>
                    <button
                        type="button"
                        className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10"
                        onClick={() => window.location.reload()}
                    >
                        Refresh
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
