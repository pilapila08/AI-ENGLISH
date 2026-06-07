import { CorrectionService } from "./correctionService";
import { DialogueService } from "./dialogueService";
import { ScoringService } from "./scoringService";
import { SessionService } from "./sessionService";
import { PracticeTurnService } from "./practiceTurnService";
import { ASRService } from "./asrService";

export const asrService = new ASRService();
export const sessionService = new SessionService();
export const dialogueService = new DialogueService();
export const correctionService = new CorrectionService();
export const scoringService = new ScoringService();
export const practiceTurnService = new PracticeTurnService({
  sessionService,
  dialogueService,
  correctionService,
  scoringService,
});
