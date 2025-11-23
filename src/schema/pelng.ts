import { z } from "zod";

export const PELNG_EXTRACTION_SYSTEM_PROMPT = `
You are an expert financial-document extraction AI specialized in Thai/English LNG terminal and EGAT invoices.
Return ONLY a valid JSON object that matches the provided schema. No extra keys, comments, or text.

DOCUMENT LANGUAGE: Thai and/or English
CURRENCY: THB unless specified otherwise

CORE RULES
1) Numbers:
   - Output pure numeric values (no commas, spaces, currency symbols).
   - Convert Thai numerals to Arabic numerals.
   - Preserve decimal points.

2) Units:
   - Quantities must match the unit requested by the schema:
     • For gas quantities use MMBTU (Million BTU / ล้านBTU).
   - Unit prices should be in THB per MMBTU (THB/MMBTU) unless clearly specified otherwise.

3) Field Matching Strategy:
   - Use the synonyms below to find each field reliably.
   - Prefer totals and summary sections when labels indicate combined or final amounts.
   - If the same label appears multiple times, choose the one most clearly labeled and closest to the relevant header or in the summary box.

4) Thai/English Terminology Hints (Synonyms and Variants):

   Station Service Fee (ค่าบริการสถานี):
   - TH: ค่าบริการสถานี, รวมจำนวนเงินค่าบริการส่วนต้นทุนคงที่กับค่าบริการต้นทุนผันแปร, รวมค่าบริการสถานี
   - EN: Station Service Fee, Terminal Service Fee, Sum of Fixed + Variable Service Fees

   Fixed-Cost Service (ค่าบริการส่วนต้นทุนคงที่):
   - TH labels (for each column):
     • ปริมาณ, จำนวน, ปริมาณก๊าซ (MMBTU/ล้านBTU)
     • ราคาต่อหน่วย, ราคาหน่วยละ (บาท/MMBTU)
     • จำนวนเงิน, มูลค่า, มูลค่าค่าบริการ (บาท)
   - EN: Fixed Cost Service - Quantity (MMBTU), Unit Price (THB/MMBTU), Amount (THB)

   Variable-Cost Service (ค่าบริการส่วนต้นทุนผันแปร):
   - TH labels (for each column):
     • ปริมาณ, จำนวน, ปริมาณก๊าซ (MMBTU/ล้านBTU)
     • ราคาต่อหน่วย, ราคาหน่วยละ (บาท/MMBTU)
     • จำนวนเงิน, มูลค่า, มูลค่าค่าบริการ (บาท)
   - EN: Variable Cost Service - Quantity (MMBTU), Unit Price (THB/MMBTU), Amount (THB)

   Total Amount before Tax [NOT Grand Total] (มูลค่ารวม ก่อนคิด Tax):
   - TH: มูลค่ารวม, ยอดรวมทั้งสิ้น, จำนวนเงินรวม, ยอดชำระ
   - EN: Grand Total, Total Amount, Amount Due

   RLNG Total Value (มูลค่า RLNG รวม):
   - TH: มูลค่า RLNG รวม, มูลค่ารวม RLNG, มูลค่า RLNG
   - EN: RLNG Total Value, Total RLNG Amount, RLNG Value

5) Context Awareness:
   - In tables, map columns like: Description | Quantity | Unit | Unit Price | Amount.
   - Totals often appear at the bottom/right or in a summary box.
   - If both before-VAT and after-VAT totals exist, pick the label that explicitly matches the schema name; otherwise select the document's main total.

6) Quality Checks (internal):
   - All money fields must be non-negative THB numbers.
   - Quantities must be non-negative and in MMBTU.
   - Unit prices must be THB per MMBTU (THB/MMBTU).

7) Output:
   - Return ONLY a JSON object matching the schema keys EXACTLY.
   - Do not add fields not present in the schema.
   - If a field is truly missing and optional, return null. For required fields, provide the best-supported value.

END OF INSTRUCTIONS.
`;

export const PELNGInvoiceSchema = z.object({
  // ค่าบริการสถานี = รวมจำนวนเงินค่าบริการส่วนต้นทุนคงที่ + ค่าบริการต้นทุนผันแปร (ยอดรวมส่วนบริการ)
  station_service_fee_thb: z
    .number()
    .nonnegative()
    .describe(
      "Station/Terminal Service Fee (THB), equals sum of fixed-cost and variable-cost service amounts | " +
        "ค่าบริการสถานี (บาท) = รวมจำนวนเงินค่าบริการส่วนต้นทุนคงที่ + ค่าบริการต้นทุนผันแปร"
    ),

  // Fixed-Cost Service (ค่าบริการส่วนต้นทุนคงที่)
  fixed_cost_quantity_mmbtu: z
    .number()
    .nonnegative()
    .describe(
      "Fixed-Cost Service Quantity (MMBTU) | ปริมาณค่าบริการส่วนต้นทุนคงที่ (หน่วย: MMBTU/ล้านBTU)"
    ),
  fixed_cost_unit_price_thb_per_mmbtu: z
    .number()
    .nonnegative()
    .describe(
      "Fixed-Cost Service Unit Price (THB/MMBTU) | ราคาต่อหน่วยค่าบริการส่วนต้นทุนคงที่ (บาท/MMBTU)"
    ),
  fixed_cost_amount_thb: z
    .number()
    .nonnegative()
    .describe(
      "Fixed-Cost Service Amount (THB) | จำนวนเงินค่าบริการส่วนต้นทุนคงที่ (บาท)"
    ),

  // Variable-Cost Service (ค่าบริการส่วนต้นทุนผันแปร)
  variable_cost_quantity_mmbtu: z
    .number()
    .nonnegative()
    .describe(
      "Variable-Cost Service Quantity (MMBTU) | ปริมาณค่าบริการส่วนต้นทุนผันแปร (หน่วย: MMBTU/ล้านBTU)"
    ),
  variable_cost_unit_price_thb_per_mmbtu: z
    .number()
    .nonnegative()
    .describe(
      "Variable-Cost Service Unit Price (THB/MMBTU) | ราคาต่อหน่วยค่าบริการส่วนต้นทุนผันแปร (บาท/MMBTU)"
    ),
  variable_cost_amount_thb: z
    .number()
    .nonnegative()
    .describe(
      "Variable-Cost Service Amount (THB) | จำนวนเงินค่าบริการส่วนต้นทุนผันแปร (บาท)"
    ),

  // มูลค่า RLNG รวม
  rlng_total_value_thb: z
    .number()
    .nonnegative()
    .describe("RLNG Total Value (THB) | มูลค่า RLNG รวม / มูลค่ารวม RLNG (บาท)"),

  // มูลค่ารวม (ยอดรวมทั้งสิ้นของเอกสาร หากมี)
  total_amount_thb: z
    .number()
    .nonnegative()
    .describe(
      "Total Amount (THB) [NOT Grand Total] | มูลค่ารวมก่อน Tax / จำนวนเงินก่อน Tax (บาท) "
    ),

  // Optional helpers
  currency: z
    .string()
    .default("THB")
    .describe("Currency code | รหัสสกุลเงิน (เช่น THB, USD)"),
  notes: z
    .string()
    .optional()
    .describe("Additional notes or remarks | หมายเหตุเพิ่มเติม"),
});

export type PELNGInvoice = z.infer<typeof PELNGInvoiceSchema>;
