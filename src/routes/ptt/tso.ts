/** biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: <explanation> */
import { Effect } from "effect";
import Elysia, { t } from "elysia";
import { ExtractPDFService } from "../../extract-pdf.service";
import { elysiaPdf } from "../../helpers";
import { Runtime } from "../../runtime";
import { pttTSOSchemaAndPrompt } from "../../schema/ptt/tso";
import { pttTsoClassification } from "../../schema/ptt/tso-classification";

export const tsoRoutes = new Elysia().group("/tso", (c) =>
  c
    .post(
      "/any",
      async ({ body }) => {
        const file = body.file;
        const arrBuf = await file.arrayBuffer();
        const buf = Buffer.from(arrBuf);

        const program = Effect.gen(function* () {
          const svc = yield* ExtractPDFService;

          const { confidence, documentType, ...rest } =
            yield* svc.processInline(
              buf,
              pttTsoClassification.systemPrompt,
              pttTsoClassification.schema
            );
          console.log({ rest, confidence, documentType });

          if (documentType === "ptt_tso_gas_volumes" && confidence > 90) {
            return yield* svc
              .processInline(
                buf,
                pttTSOSchemaAndPrompt.gasAmount.systemPrompt,
                pttTSOSchemaAndPrompt.gasAmount.schema
              )
              .pipe(
                Effect.andThen(
                  ({
                    volumeArea2KhanomMMBTU,
                    volumeArea3OnshoreMMBTU,
                    volumeArea4ChanaMMBTU,
                  }) => {
                    const sum =
                      volumeArea2KhanomMMBTU +
                      volumeArea3OnshoreMMBTU +
                      volumeArea4ChanaMMBTU;
                    return {
                      volumeArea2KhanomMMBTU,
                      volumeArea3OnshoreMMBTU,
                      volumeArea4ChanaMMBTU,
                      volumeArea234: sum,
                    };
                  }
                )
              );
          }

          if (documentType === "ptt_tso_gas_service_costs" && confidence > 90) {
            return yield* svc
              .processInline(
                buf,
                pttTSOSchemaAndPrompt.gasCost.systemPrompt,
                pttTSOSchemaAndPrompt.gasCost.schema
              )
              .pipe(
                Effect.andThen((results) => {
                  let fix_cost_quantity = 0;
                  let fix_cost_price = 0;
                  let variable_cost_price = 0;
                  let sum_of_fix_and_variable_cost = 0;

                  for (const item of results) {
                    if (item.cost_type === "fixed_cost_td") {
                      fix_cost_quantity += item.quantity_mmbtu;
                      fix_cost_price += item.unit_price_baht_mmbtu;
                      sum_of_fix_and_variable_cost += item.amount_baht;
                    } else if (item.cost_type === "variable_cost_tc") {
                      variable_cost_price += item.unit_price_baht_mmbtu;
                      sum_of_fix_and_variable_cost += item.amount_baht;
                    }
                  }
                  return {
                    fix_cost_quantity,
                    fix_cost_price,
                    variable_cost_price,
                    sum_of_fix_and_variable_cost,
                  };
                })
              );
          }

          if (documentType === "unknown") {
            return {
              message: "Unknown document type",
            };
          }
        });

        const result = await Runtime.runPromise(program);

        return result;
      },
      {
        body: t.Object({
          file: elysiaPdf,
        }),
        tags: ["PTT"],
      }
    )
    .post(
      "/gas-amount",
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
              pttTSOSchemaAndPrompt.gasAmount.systemPrompt,
              pttTSOSchemaAndPrompt.gasAmount.schema
            )
          ),
          Effect.andThen(
            ({
              volumeArea2KhanomMMBTU,
              volumeArea3OnshoreMMBTU,
              volumeArea4ChanaMMBTU,
            }) => {
              const sum =
                volumeArea2KhanomMMBTU +
                volumeArea3OnshoreMMBTU +
                volumeArea4ChanaMMBTU;
              return {
                volumeArea234: sum,
              };
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
        tags: ["PTT"],
      }
    )
    .post(
      "/gas-cost",
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
              pttTSOSchemaAndPrompt.gasCost.systemPrompt,
              pttTSOSchemaAndPrompt.gasCost.schema
            )
          ),
          Effect.andThen((results) => {
            let fix_cost_quantity = 0;
            let fix_cost_price = 0;
            let variable_cost_price = 0;
            let sum_of_fix_and_variable_cost = 0;

            for (const item of results) {
              if (item.cost_type === "fixed_cost_td") {
                fix_cost_quantity += item.quantity_mmbtu;
                fix_cost_price += item.unit_price_baht_mmbtu;
                sum_of_fix_and_variable_cost += item.amount_baht;
              } else if (item.cost_type === "variable_cost_tc") {
                variable_cost_price += item.unit_price_baht_mmbtu;
                sum_of_fix_and_variable_cost += item.amount_baht;
              }
            }
            return {
              fix_cost_quantity,
              fix_cost_price,
              variable_cost_price,
              sum_of_fix_and_variable_cost,
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
        tags: ["PTT"],
      }
    )
);
