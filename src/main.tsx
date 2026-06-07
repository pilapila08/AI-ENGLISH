import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import AppErrorBoundary from "./components/AppErrorBoundary";
import "./styles/index.css";

function SecureBridgeError() {
  return (
    <main className="grid min-h-screen place-items-center bg-mist p-6 text-ink">
      <section className="w-full max-w-md rounded-3xl border border-white bg-white p-8 text-center shadow-panel">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 font-black text-red-500">
          !
        </div>
        <h1 className="mt-5 text-xl font-bold">安全桥加载失败</h1>
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
