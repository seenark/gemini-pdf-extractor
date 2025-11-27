import { Effect } from "effect";
import Elysia, { t } from "elysia";
import { ExtractPDFService } from "../../extract-pdf.service";
import { elysiaPdf } from "../../helpers";
import { Runtime } from "../../runtime";
import { pttLpgSchemaAndPrompt } from "../../schema/ptt/lpg";

export const lpgRoutes = new Elysia().group("/lpg", (c) =>
  c.post(
    "/fuel-ratio",
    async ({ body }) => {
      const file = body.file;
      const arrBuf = await file.arrayBuffer();
      const buf = Buffer.from(arrBuf);

      const result = await Effect.all({
        svc: ExtractPDFService,
      }).pipe(
        Effect.andThen(({ svc }) =>
          svc.processInline(
            buf,
            pttLpgSchemaAndPrompt.fuelRatio.systemPrompt,
            pttLpgSchemaAndPrompt.fuelRatio.schema
          )
        ),
        Effect.andThen((d) => d),
        Runtime.runPromise
      );

      return result;
    },
    {
      body: t.Object({
        file: elysiaPdf,
      }),
      tags: ["PTT"],
    }
  )
);
