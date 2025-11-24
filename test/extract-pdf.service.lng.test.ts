// import path from "node:path";
// import { Effect } from "effect";
// import { describe, expect, it } from "vitest";
// import { ExtractPDFService } from "../src/extract-pdf.service";
// import { readFileAndSize } from "../src/helpers";
// import { Runtime } from "../src/runtime";
// import { pttLngSchemaAndPrompt } from "../src/schema/ptt/lng";

// const files = {
//     ptt: {
//         lng: {
//             regasSendout: path.join(__dirname, "PTT/PTT LNG PELNG.pdf"),
//         },
//     },
// };

// describe("extract invoice", () => {
//     // Regas Sendout

//     it("should extract regas sendout data", async () => {
//         const { file } = await readFileAndSize(files.ptt.lng.regasSendout);
//         const program = Effect.all({
//             svc: ExtractPDFService,
//         }).pipe(
//             Effect.andThen(({ svc }) =>
//                 svc.processInline(
//                     file,
//                     pttLngSchemaAndPrompt.regasSendout.systemPrompt,
//                     pttLngSchemaAndPrompt.regasSendout.schema
//                 )
//             ),
//             Effect.tap((data) => Effect.log("data", data)),
//             Effect.tapError((error) => Effect.logError("error -->", error.error))
//         );
//         const result = await Runtime.runPromise(program);

//         expect(result.total_regas_sendout).toEqual(16_007_718.629);
//     });

//     //   Regas Value

//     it("should extract regas value data", async () => {
//         const { file } = await readFileAndSize(files.ptt.lng.regasSendout);
//         const program = Effect.all({
//             svc: ExtractPDFService,
//         }).pipe(
//             Effect.andThen(({ svc }) =>
//                 svc.processInline(
//                     file,
//                     pttLngSchemaAndPrompt.regasValue.systemPrompt,
//                     pttLngSchemaAndPrompt.regasValue.schema
//                 )
//             ),
//             Effect.tap((data) => Effect.log("data", data)),
//             Effect.tapError((error) => Effect.logError("error -->", error.error))
//         );
//         const result = await Runtime.runPromise(program);

//         expect(result.total_regas_value).toEqual(5_447_307_387.79);
//     });

//     // Terminal Cost

//     it("should extract terminal cost data", async () => {
//         const { file } = await readFileAndSize(files.ptt.lng.regasSendout);
//         const program = Effect.all({
//             svc: ExtractPDFService,
//         }).pipe(
//             Effect.andThen(({ svc }) =>
//                 svc.processInline(
//                     file,
//                     pttLngSchemaAndPrompt.terminalCost.systemPrompt,
//                     pttLngSchemaAndPrompt.terminalCost.schema
//                 )
//             ),
//             Effect.andThen((results) => {
//                 let tariff_ld = 0;
//                 let tariff_lc = 0;
//                 if (Array.isArray(results)) {
//                     for (const item of results) {
//                         tariff_ld += item?.fixed_cost_baht ?? 0;
//                         tariff_lc += item?.variable_cost_baht ?? 0;
//                     }
//                 }
//                 return {
//                     tariff_ld,
//                     tariff_lc,
//                 };
//             }),
//             Effect.tap((data) => Effect.log("data", data)),
//             Effect.tapError((error) => Effect.logError("error -->", error.error))
//         );
//         const result = await Runtime.runPromise(program);

//         expect(result.tariff_ld).toEqual(863_268_358.4);
//         expect(result.tariff_lc).toEqual(13_840_273.85);
//     });
// });


export { }