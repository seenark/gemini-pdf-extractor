import { Duration, Effect } from "effect";
import Elysia, { t } from "elysia";
import { ExtractPDFService } from "../../extract-pdf.service";
import { elysiaPdf } from "../../helpers";
import { RedisService } from "../../redis.service";
import { Runtime } from "../../runtime";
import { pttLpgSchemaAndPrompt } from "../../schema/ptt/lpg";
import { queryModel, shouldCache } from "../../utils/verify-caching";

export const lpgRoutes = new Elysia().group("/lpg", (c) =>
  c.post(
    "/fuel-ratio",
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
            pttLpgSchemaAndPrompt.fuelRatio.systemPrompt,
            pttLpgSchemaAndPrompt.fuelRatio.schema
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
);
