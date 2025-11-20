import path from "node:path";
import { Effect } from "effect";
import { describe, it } from "vitest";
import { ExtractPDFService } from "../src/extract-pdf.service";
import { readFileAndSize } from "../src/helpers";
import { Runtime } from "../src/runtime";
import { CargoSchema, CargoSystemPrompt } from "../src/schema/cargo";

const files = {
  egat: path.join(__dirname, "Invoice_EGAT.pdf"),
  pelng: path.join(__dirname, "PELNG_EGAT.pdf"),
  cargo2: path.join(__dirname, "EGAT_Cargo2.pdf"),
};

describe("extract invoice", () => {
  // it("should extract invoice data", async () => {
  //   const { file } = await readFileAndSize(files.egat);

  //   const program = Effect.all({
  //     svc: ExtractPDFService,
  //   }).pipe(
  //     Effect.andThen(({ svc }) =>
  //       svc.processInline(file, InvoiceSystemPrompt, InvoiceSchema)
  //     ),
  //     Effect.tap((data) => Effect.log("data", data)),
  //     Effect.tapError((error) => Effect.logError("error -->", error.error))
  //   );

  //   const object = await Runtime.runPromise(program);

  //   expect(object.quantity).eq(4_964_035);
  //   expect(object.unitPriceTHBPerMMBTU).eq(433.7759);
  //   expect(object.subtotalTHB).eq(2_153_278_749.76);
  //   expect(object.vatTHB).eq(150_729_512.48);
  //   expect(object.totalTHB).eq(2_304_008_262.24);
  //   expect(object.currency).eq("THB");
  //   expect(object.vatRate).eq(0.07);
  // });

  // it("should ok with PELNG pdf", async () => {
  //   const { file } = await readFileAndSize(files.pelng);

  //   const program = Effect.all({
  //     svc: ExtractPDFService,
  //   }).pipe(
  //     Effect.andThen(({ svc }) =>
  //       svc.processInline(
  //         file,
  //         PELNG_EXTRACTION_SYSTEM_PROMPT,
  //         PELNGInvoiceSchema
  //       )
  //     ),
  //     Effect.tap((data) => Effect.log("data", data)),
  //     Effect.tapError((error) => Effect.logError("error -->", error.error))
  //   );

  //   const object = await Runtime.runPromise(program);

  //   expect(object.stationServiceFeeTHB).eq(119_909_458.92);
  //   expect(object.fixedCostQuantityMMBTU).eq(6_510_000);
  //   expect(object.fixedCostUnitPriceTHBPerMMBTU).eq(17.7598);
  //   expect(object.fixedCostAmountTHB).eq(115_616_298);
  //   expect(object.variableCostQuantityMMBTU).eq(4_965_488);
  //   expect(object.variableCostUnitPriceTHBPerMMBTU).eq(0.8646);
  //   expect(object.variableCostAmountTHB).eq(4_293_160.92);
  //   expect(object.rlngTotalValueTHB).eq(2_033_999_638.4);
  //   expect(object.totalAmountTHB).eq(128_303_121.04);
  //   expect(object.currency).eq("THB");
  //   expect(object.notes).eq(
  //     "ไม่ต้องหักภาษี ณ ที่จ่ายเนื่องจากได้รับการส่งเสริมจาก BOI (บัตรส่งเสริม เลขที่ 67-1448-1-00-1-2)"
  //   );
  // });

  it("should ok with cargo pdf", async () => {
    const { file } = await readFileAndSize(files.pelng);

    const program = Effect.all({
      svc: ExtractPDFService,
    }).pipe(
      Effect.andThen(({ svc }) =>
        svc.processInline(file, CargoSystemPrompt, CargoSchema)
      ),
      Effect.tap((data) => Effect.log("data", data)),
      Effect.tapError((error) => Effect.logError("error -->", error.error))
    );

    const object = await Runtime.runPromise(program);
    console.log({ object });
  });
});
