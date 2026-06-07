import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import AppErrorBoundary from "./components/AppErrorBoundary";
import "./styles/index.css";

function SecureBridgeError() {
  return (
    <main className="cockpit-shell grid min-h-screen place-items-center p-6 text-slate-100">
      <section className="glass-card w-full max-w-md p-8 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-red-300/15 bg-red-400/[0.08] font-black text-red-300">
          !
        </div>
        <p className="cockpit-label mt-5">Secure bridge offline</p>
        <h1 className="mt-2 text-xl font-bold">安全桥加载失败</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Electron preload 未能正常启动。请完全关闭客户端后重新运行 npm run dev。
        </p>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      {typeof window.speakCoachAPI === "undefined" ? <SecureBridgeError /> : <App />}
    </AppErrorBoundary>
  </StrictMode>,
);
