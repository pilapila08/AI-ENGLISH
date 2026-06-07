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
      <main className="grid min-h-screen place-items-center bg-mist p-6 text-ink">
        <section className="w-full max-w-md rounded-3xl border border-white bg-white p-8 text-center shadow-panel">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 font-black text-red-500">
            !
          </div>
          <h1 className="mt-5 text-xl font-bold">界面暂时无法显示</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            某个界面组件遇到了异常。练习历史仍保存在本地，可以重新加载客户端继续使用。
          </p>
          <button
            className="mt-5 rounded-2xl bg-brand px-5 py-3 text-sm font-bold text-white"
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
