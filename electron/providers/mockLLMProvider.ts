import type { LLMChatInput, LLMProvider } from "./llmProvider";

const replies: Record<string, string[]> = {
  interview: [
    "Thanks. Could you describe one backend project you are most proud of?",
    "That is helpful. What was the biggest challenge, and how did you solve it?",
    "Great. Why are you interested in this role?",
  ],
  restaurant: [
    "Certainly. Would you like to hear today's recommended main course?",
    "That sounds good. Would you like any side dishes or drinks with it?",
    "Of course. Do you have any allergies or dietary requirements?",
  ],
  meeting: [
    "Thanks for the update. What is the biggest risk to the current timeline?",
    "That makes sense. What support do you need from the team?",
    "Understood. Could you summarize the next action item?",
  ],
  airport: [
    "Thank you. Are you checking in any bags today?",
    "Your flight is on schedule. Would you like directions to the departure gate?",
    "Certainly. Do you need any help with your boarding pass?",
  ],
  self_introduction: [
    "Nice to meet you. What do you enjoy doing in your free time?",
    "That sounds interesting. What are you currently learning or working on?",
    "Thanks for sharing. What would you like to improve this year?",
  ],
};

export class MockLLMProvider implements LLMProvider {
  async chat({ scenario, history }: LLMChatInput): Promise<string> {
    const scenarioReplies = replies[scenario.id] ?? [
      `Thanks for sharing. Could you tell me more from your perspective as ${scenario.userRole}?`,
    ];
    const userTurnCount = history.filter((message) => message.role === "user").length;
    const replyIndex = Math.max(0, userTurnCount - 1) % scenarioReplies.length;

    await new Promise((resolve) => setTimeout(resolve, 450));

    return scenarioReplies[replyIndex];
  }
}
