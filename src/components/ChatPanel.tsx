import type { ChatMessage, Scenario } from "../types";

interface ChatPanelProps {
  scenario: Scenario;
  messages: ChatMessage[];
}

function ChatPanel({ scenario, messages }: ChatPanelProps) {
  return (
    <section className="flex min-h-0 flex-col rounded-3xl bg-white shadow-panel">
      <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            当前练习
          </p>
          <h2 className="mt-1 text-xl font-semibold">{scenario.name}</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-500">{scenario.description}</p>
        </div>
        <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-brand">
          {scenario.aiRole}
        </span>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
        {messages.map((message) => {
          const isUser = message.role === "user";

          return (
            <div
              className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              key={message.id}
            >
              {!isUser && (
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-xs font-bold text-white">
                  AI
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  isUser
                    ? "rounded-br-md bg-slate-900 text-white"
                    : "rounded-bl-md bg-slate-100 text-slate-700"
                }`}
              >
                <p>{message.content}</p>
                <p
                  className={`mt-1 text-[11px] ${
                    isUser ? "text-slate-400" : "text-slate-400"
                  }`}
                >
                  {isUser ? "你" : scenario.aiRole}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ChatPanel;
