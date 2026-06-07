import { CorrectionService } from "./correctionService";
import { DialogueService } from "./dialogueService";
import { ScoringService } from "./scoringService";
import { SessionService } from "./sessionService";

export const sessionService = new SessionService();
export const dialogueService = new DialogueService();
export const correctionService = new CorrectionService();
export const scoringService = new ScoringService();
