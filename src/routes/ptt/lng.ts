import { Effect } from "effect";
import Elysia, { t } from "elysia";
import { ExtractPDFService } from "../../extract-pdf.service";
import { elysiaPdf } from "../../helpers";
import { Runtime } from "../../runtime";
import { pttLngSchemaAndPrompt } from "../../schema/ptt/lng";

export const lngRoutes = new Elysia().group("/lng", (c) =>
  c.post(
    "/regas-sendout",
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
            pttLngSchemaAndPrompt.regasSendout.systemPrompt,
            pttLngSchemaAndPrompt.regasSendout.schema
          )
        ),
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
  ).post(
      "/regas-value",
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
                      pttLngSchemaAndPrompt.regasValue.systemPrompt,
                      pttLngSchemaAndPrompt.regasValue.schema
                  )
              ),
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
  ).post(
      "/terminal-cost",
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
                      pttLngSchemaAndPrompt.terminalCost.systemPrompt,
                      pttLngSchemaAndPrompt.terminalCost.schema
                  )
              ),
              Effect.andThen((results) => {
                  let tariff_ld = 0
                  let tariff_lc = 0
                  if (Array.isArray(results)) {
                      for (const item of results) {
                          tariff_ld += item?.fixed_cost_baht ?? 0;
                          tariff_lc += item?.variable_cost_baht ?? 0;
                      }
                  }
                  return {
                      tariff_ld,
                      tariff_lc
                  }

              }),
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
