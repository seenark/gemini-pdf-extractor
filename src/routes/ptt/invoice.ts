import { Duration, Effect } from "effect";
import Elysia, { t } from "elysia";
import { ExtractPDFService } from "../../extract-pdf.service";
import { elysiaPdf } from "../../helpers";
import { RedisService } from "../../redis.service";
import { Runtime } from "../../runtime";
import { pttTotalDemandGulfSchemaAndPrompt } from "../../schema/ptt/invoice-total-demand-gulf";
import { queryModel, shouldCache } from "../../utils/verify-caching";

export const invoiceRoutes = new Elysia().group("/invoice", (c) =>
  c.post(
    "/total-demand-gulf",
    async ({ body, query }) => {
      const file = body.file;
      const arrBuf = await file.arrayBuffer();
      const buf = Buffer.from(arrBuf);

      const result = await Effect.all({
        svc: ExtractPDFService,
        redisSvc: RedisService,
      }).pipe(
        Effect.let("cacheFn", ({ redisSvc }) =>
          redisSvc.withCache({
            file: buf,
            expiresIn: Duration.minutes(1),
          })
        ),
        Effect.andThen(({ svc, cacheFn }) => {
          const program = svc.processInline(
            buf,
            pttTotalDemandGulfSchemaAndPrompt.totalDemandGulf.systemPrompt,
            pttTotalDemandGulfSchemaAndPrompt.totalDemandGulf.schema
          )
          if (shouldCache(query)) {
            return cacheFn(program)
          }
          return program
        }
        ),
        Effect.andThen((data) => ({
          ...data,
          total_demand_gulf:
            data.gpd_glng_shipper_total_mmbtu +
            data.gsrc_glng_shipper_total_mmbtu +
            data.spps_glng_shipper_total_mmbtu,
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
