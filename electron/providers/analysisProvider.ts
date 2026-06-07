export interface AnalysisMessage {
  role: "system" | "user";
  content: string;
}

export interface AnalysisProvider {
  analyze(messages: AnalysisMessage[]): Promise<string>;
}
