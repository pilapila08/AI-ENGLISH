import { app } from "electron";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";

export interface Scenario {
  id: string;
  name: string;
  description: string;
  userRole: string;
  aiRole: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  goals: string[];
  openingMessage: string;
  sampleQuestions: string[];
}

const defaultScenarios: Scenario[] = [
  {
    id: "interview",
    name: "英文面试",
    description: "模拟英文求职面试，练习介绍经历、项目与职业目标。",
    userRole: "求职候选人",
    aiRole: "技术面试官",
    difficulty: "intermediate",
    goals: ["清晰完成自我介绍", "描述项目经历", "自然回答追问"],
    openingMessage:
      "Hello! Thanks for joining us today. Could you tell me about yourself?",
    sampleQuestions: [
      "What project are you most proud of?",
      "Why are you interested in this role?",
    ],
  },
  {
    id: "restaurant",
    name: "餐厅点餐",
    description: "练习询问菜单、点餐和提出特殊需求。",
    userRole: "顾客",
    aiRole: "餐厅服务员",
    difficulty: "beginner",
    goals: ["询问菜品信息", "清楚表达点餐需求", "礼貌提出要求"],
    openingMessage:
      "Good evening! May I get you something to drink first?",
    sampleQuestions: ["What do you recommend?", "Could I have the bill, please?"],
  },
  {
    id: "meeting",
    name: "商务会议",
    description: "参与英文项目会议，练习表达观点和推动讨论。",
    userRole: "项目成员",
    aiRole: "会议主持人",
    difficulty: "advanced",
    goals: ["有条理地表达观点", "礼貌提出不同意见", "总结行动事项"],
    openingMessage:
      "Could you give us a quick update on your current progress?",
    sampleQuestions: [
      "What is the biggest risk right now?",
      "What should our next step be?",
    ],
  },
  {
    id: "airport",
    name: "机场出行",
    description: "模拟机场值机和问路，练习常见英文出行情境。",
    userRole: "旅客",
    aiRole: "机场工作人员",
    difficulty: "beginner",
    goals: ["完成值机", "询问登机信息", "描述行李问题"],
    openingMessage:
      "Good morning. May I see your passport and booking confirmation, please?",
    sampleQuestions: ["Where is my departure gate?", "Is the flight on time?"],
  },
  {
    id: "self_introduction",
    name: "自我介绍",
    description: "练习自然、有重点的英文自我介绍。",
    userRole: "自我介绍者",
    aiRole: "新认识的朋友",
    difficulty: "beginner",
    goals: ["介绍个人背景", "分享兴趣与目标", "自然延续对话"],
    openingMessage: "Hi! It is great to meet you. Could you introduce yourself?",
    sampleQuestions: [
      "What do you enjoy doing in your free time?",
      "What are you currently working on?",
    ],
  },
];

export function getDefaultScenarios(): Scenario[] {
  return defaultScenarios.map((scenario) => ({
    ...scenario,
    goals: [...scenario.goals],
    sampleQuestions: [...scenario.sampleQuestions],
  }));
}

function getScenarioConfigPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "config", "scenarios.yaml");
  }

  return path.join(process.cwd(), "config", "scenarios.yaml");
}

function isScenario(value: unknown): value is Scenario {
  if (!value || typeof value !== "object") {
    return false;
  }

  const scenario = value as Partial<Scenario>;

  return (
    typeof scenario.id === "string" &&
    typeof scenario.name === "string" &&
    typeof scenario.description === "string" &&
    typeof scenario.userRole === "string" &&
    typeof scenario.aiRole === "string" &&
    ["beginner", "intermediate", "advanced"].includes(
      scenario.difficulty ?? "",
    ) &&
    Array.isArray(scenario.goals) &&
    typeof scenario.openingMessage === "string" &&
    Array.isArray(scenario.sampleQuestions)
  );
}

export async function getScenarios(): Promise<Scenario[]> {
  try {
    const yamlContent = await readFile(getScenarioConfigPath(), "utf8");
    const parsedScenarios: unknown = parse(yamlContent);

    if (
      !Array.isArray(parsedScenarios) ||
      parsedScenarios.length === 0 ||
      !parsedScenarios.every(isScenario)
    ) {
      throw new Error("Scenario configuration has an invalid structure.");
    }

    return parsedScenarios;
  } catch (error) {
    console.error("[ScenarioService] Failed to load scenarios:", error);
    return getDefaultScenarios();
  }
}
