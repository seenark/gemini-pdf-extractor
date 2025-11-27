import { Duration, Effect } from "effect";
import Elysia, { t } from "elysia";
import { ExtractPDFService } from "../../extract-pdf.service";
import { elysiaPdf } from "../../helpers";
import { RedisService } from "../../redis.service";
import { Runtime } from "../../runtime";
import { pttLngSchemaAndPrompt } from "../../schema/ptt/lng";
import { queryModel, shouldCache } from "../../utils/verify-caching";

export const lngRoutes = new Elysia().group("/lng", (c) =>
  c
    .post(
      "/regas-sendout",
      async ({ body, query }) => {
        const file = body.file;
        const arrBuf = await file.arrayBuffer();
        const buf = Buffer.from(arrBuf);

        const result = await Effect.all({
          svc: ExtractPDFService,
          redis: RedisService,
        }).pipe(
          Effect.let("cacheFn", ({ redis }) =>
            redis.withCache({
              file: buf,
              expiresIn: Duration.seconds(query.cacheDuration),
            })
          ),
          Effect.andThen(({ svc, cacheFn }) => {
            const program = svc.processInline(
              buf,
              pttLngSchemaAndPrompt.regasSendout.systemPrompt,
              pttLngSchemaAndPrompt.regasSendout.schema
            )
            if (shouldCache(query)) {
              return cacheFn(program)
            }
            return program
          }
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
        query: queryModel,
        tags: ["PTT"],
      }
    )
    .post(
      "/regas-value",
      async ({ body, query }) => {
        const file = body.file;
        const arrBuf = await file.arrayBuffer();
        const buf = Buffer.from(arrBuf);

        const result = await Effect.all({
          svc: ExtractPDFService,
          redis: RedisService,
        }).pipe(
          Effect.let("cacheFn", ({ redis }) => redis.withCache({
            file: buf,
            expiresIn: Duration.seconds(query.cacheDuration)
          })),
          Effect.andThen(({ svc, cacheFn }) => {
            const program = svc.processInline(
              buf,
              pttLngSchemaAndPrompt.regasValue.systemPrompt,
              pttLngSchemaAndPrompt.regasValue.schema
            )
            if (shouldCache(query)) {
              return cacheFn(program)
            }
            return program
          }
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
        query: queryModel,
        tags: ["PTT"],
      }
    )
    .post(
      "/terminal-cost",
      async ({ body, query }) => {
        const file = body.file;
        const arrBuf = await file.arrayBuffer();
        const buf = Buffer.from(arrBuf);

        const result = await Effect.all({
          svc: ExtractPDFService,
          redis: RedisService,
        }).pipe(
          Effect.let("cacheFn", ({ redis }) => redis.withCache({
            file: buf,
            expiresIn: Duration.seconds(query.cacheDuration)
          })),
          Effect.andThen(({ svc, cacheFn }) => {
            const program = svc.processInline(
              buf,
              pttLngSchemaAndPrompt.terminalCost.systemPrompt,
              pttLngSchemaAndPrompt.terminalCost.schema
            )
            if (shouldCache(query)) {
              return cacheFn(program)
            }
            return program
          }
          ),
          Effect.andThen((results) => {
            let tariff_ld = 0;
            let tariff_lc = 0;
            if (Array.isArray(results)) {
              for (const item of results) {
                tariff_ld += item?.fixed_cost_baht ?? 0;
                tariff_lc += item?.variable_cost_baht ?? 0;
              }
            }
            return {
              results,
              tariff_ld,
              tariff_lc,
            };
          }),
          Effect.andThen((d) => d),
          Runtime.runPromise
        );

        return result;
      },
      {
        body: t.Object({
          file: elysiaPdf,
        }),
        query: queryModel,
        tags: ["PTT"],
      }
    )
);
