import { google } from "@ai-sdk/google";
import { Effect } from "effect";

export class ModelProvider extends Effect.Service<ModelProvider>()(
  "Provider/Model",
  {
    effect: Effect.gen(function* () {
      const gemini = {
        "2.5-flash": google("gemini-2.5-flash"),
        "2.5-pro": google("gemini-2.5-pro"),
      };

      return {
        gemini,
      };
    }),
  }
) {}
