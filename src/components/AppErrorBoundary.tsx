import { Component, type ErrorInfo, type ReactNode } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  failed: boolean;
}

export default class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[Renderer] Unexpected UI error:", error, info);
  }

  render() {
    if (!this.state.failed) {
      return this.props.children;
    }

    return (
      <main className="cockpit-shell grid min-h-screen place-items-center p-6 text-slate-100">
        <section className="glass-card w-full max-w-md p-8 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-red-300/15 bg-red-400/[0.08] font-black text-red-300">
            !
          </div>
          <p className="cockpit-label mt-5">界面恢复</p>
          <h1 className="mt-2 text-xl font-bold">训练界面暂时无法显示</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            某个界面组件遇到异常。本地练习历史不会丢失，可以重新加载客户端继续使用。
          </p>
          <button
            className="mt-5 rounded-xl border border-cyan-300/20 bg-gradient-to-r from-violet-500/70 to-cyan-500/50 px-5 py-3 text-sm font-bold text-white"
            onClick={() => window.location.reload()}
            type="button"
          >
            重新加载
          </button>
        </section>
      </main>
    );
  }
}
