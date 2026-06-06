import type { LLMChatInput, LLMMessage } from "../providers/llmProvider";

export class PromptService {
  buildMessages({ scenario, history, userInput }: LLMChatInput): LLMMessage[] {
    const systemPrompt = [
      `You are acting as ${scenario.aiRole} in an English speaking practice scenario called "${scenario.name}".`,
      `The learner is acting as ${scenario.userRole}.`,
      `Scenario description: ${scenario.description}`,
      `Practice goals: ${scenario.goals.join("; ")}`,
      "Reply naturally in English and stay in character.",
      "Keep each reply concise: one to three sentences.",
      "Ask a relevant follow-up question to keep the conversation moving.",
      "Do not provide long grammar corrections during the conversation.",
    ].join("\n");

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    ];
    const lastMessage = messages.at(-1);

    if (lastMessage?.role !== "user" || lastMessage.content !== userInput) {
      messages.push({ role: "user", content: userInput });
    }

    return messages;
  }
}
