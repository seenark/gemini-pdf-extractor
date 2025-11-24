// import path from "node:path";
// import { Effect } from "effect";
// import { describe, expect, it } from "vitest";
// import { ExtractPDFService } from "../src/extract-pdf.service";
// import { readFileAndSize } from "../src/helpers";
// import { Runtime } from "../src/runtime";
// import { pttLpgSchemaAndPrompt } from "../src/schema/ptt/lpg";

// const files = {
//   ptt: {
//     lpg: {
//       fuelRatio: path.join(
//         __dirname,
//         "PTT/สรุปสัดส่วน LPG เชื้อเพลิง เดือน สค.68.pdf"
//       ),
//     },
//   },
// };

// describe("extract invoice", () => {
//   // === TSO Gas Anoount ===

//   it("should extract invoice data", async () => {
//     const { file } = await readFileAndSize(files.ptt.lpg.fuelRatio);
//     const program = Effect.all({
//       svc: ExtractPDFService,
//     }).pipe(
//       Effect.andThen(({ svc }) =>
//         svc.processInline(
//           file,
//           pttLpgSchemaAndPrompt.fuelRatio.systemPrompt,
//           pttLpgSchemaAndPrompt.fuelRatio.schema
//         )
//       ),
//       Effect.tap((data) => Effect.log("data", data)),
//       Effect.tapError((error) => Effect.logError("error -->", error.error))
//     );
//     const result = await Runtime.runPromise(program);

//       expect(result.fuel_ratio).toEqual(0.3244);
//   });
// });

export { };