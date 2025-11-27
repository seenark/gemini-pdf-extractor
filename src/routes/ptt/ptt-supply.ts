import { Duration, Effect } from "effect";
import Elysia, { t } from "elysia";
import { ExtractPDFService } from "../../extract-pdf.service";
import { elysiaPdf } from "../../helpers";
import { Runtime } from "../../runtime";
import { pttSupplySchemaAndPrompt } from "../../schema/ptt/ptt-supply";
import { RedisService } from "../../redis.service";
import { queryModel, shouldCache } from "../../utils/verify-caching";

export const pttSupplyRoutes = new Elysia().group("/supply", (c) =>
  c.post(
    "/yadana",
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
                  pttSupplySchemaAndPrompt.yadana.systemPrompt,
                  pttSupplySchemaAndPrompt.yadana.schema
              )
              if (shouldCache(query)) {
                  return cacheFn(program)
              }
              return program
          }

        ),
        Effect.andThen((results) => ({
            occurred_quantities_mmbtu:
            results.moge_quantity_mmbtu + results.pttepi_quantity_mmbtu,
          overall_payment: results.overall_payment_due_usd,
        })),
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
  ).post(
      "/yetagun",
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
                      pttSupplySchemaAndPrompt.yetagun.systemPrompt,
                      pttSupplySchemaAndPrompt.yetagun.schema
                  )
                  if (shouldCache(query)) {
                      return cacheFn(program)
                  }
                  return program
              }
              ),
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
  ).post(
      "/zawtika",
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
                      pttSupplySchemaAndPrompt.zawtika.systemPrompt,
                      pttSupplySchemaAndPrompt.zawtika.schema
                  )
                  if (shouldCache(query)) {
                      return cacheFn(program)
                  }
                  return program
              }
              ),
              Effect.andThen((results) => ({
                  occurred_quantities_mmbtu:
                      results.moge_quantity_mmbtu + results.pttepi_quantity_mmbtu,
                  overall_payment: results.moge_payment_usd + results.pttepi_payment_usd,
              })),
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
