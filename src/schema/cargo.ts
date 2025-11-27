import { z } from "zod";

export const LNGCargoSchemaFlat = z.object({
  // Voyage/Shipment Details
  seller: z
    .string()
    .describe(
      "Seller / Seller Name / Supplier / ผู้ขาย / ผู้จำหน่าย / คู่สัญญาขาย; ชื่อบริษัทที่ขาย LNG ในส่วนข้อมูลเที่ยวเรือ"
    ),
  payment_due_date: z
    .string()
    .describe(
      "Payment Due / Due Date / Payment Terms / กำหนดชำระเงิน / วันครบกำหนดชำระ; ส่งวันที่ตามที่พบในเอกสารต้นฉบับโดยไม่ต้องแปลงเป็น ISO"
    ),
  vessel_name: z
    .string()
    .describe(
      "Vessel / Vessel Name / Ship Name / ชื่อเรือ / เรือที่ขนส่ง ในส่วนข้อมูลเที่ยวเรือ"
    ),
  voyage_load_port: z
    .string()
    .describe(
      "Loading Port / Load Port / Port of Loading / Origin Port / ท่าเรือต้นทาง / ท่าเรือบรรทุก / ท่าเรือต้นทางการขนส่ง"
    ),
  energy_megajoules: z
    .number()
    .describe(
      "Quantity in MMBTU / Unloaded Quantity / Total Energy / ปริมาณ (ล้านบีทียู) ที่ส่งมอบ หน่วย MMBTU"
    ),
  unit_price_mmbtu: z
    .number()
    .describe(
      "Unit Price USD/MMBTU / LNG Price DES / Ex-Ship Price / ราคา USD ต่อ MMBTU / ราคาต่อหน่วยพลังงาน ในส่วนการคำนวณราคา"
    ),
  amount_usd: z
    .number()
    .describe(
      "Net Invoice Amount USD / Total Invoice USD / Invoice Value / มูลค่าสุทธิเป็นดอลลาร์ / ยอดรวมในใบแจ้งหนี้ก่อนรวมค่าใช้จ่ายอื่น"
    ),
  voyage_total_amount_incl_gst: z
    .number()
    .optional()
    .describe(
      "Grand Total including GST/VAT / Final Total / มูลค่ารวมทั้งหมดรวมภาษีมูลค่าเพิ่ม / ยอดรวมสุทธิสุดท้าย; หากเอกสารไม่ระบุให้ข้ามได้"
    ),

  // Unloading/Quality
  hhv_volume: z
    .number()
    .optional()
    .describe(
      "HHV / GHV / Higher Heating Value / Gross Heating Value / ค่าความร้อนสูงสุด (เช่น BTU/Scf); ดึงเฉพาะตัวเลข ในส่วนคุณภาพหรือการขนถ่าย"
    ),

  // Quantity/Delivery
  mass_kilograms: z
    .number()
    .optional()
    .describe(
      "Net Delivered (Metric Tons, MT only) / ปริมาณส่งมอบสุทธิเป็นหน่วยตันเมตริกเท่านั้น; หากเอกสารให้หลายหน่วย ให้เลือกค่าที่เป็น Metric Tons (MT)"
    ),

  // Survey/Inspection
  survey_fee_before_tax: z
    .number()
    .optional()
    .describe(
      "Surveyor Fee excluding VAT / Survey Fee before tax / Inspection Fee / ค่าตรวจสอบสินค้า (ไม่รวมภาษี); ดึงยอดรวมค่า Survey Fee และ Analysis ที่อยู่บนบรรทัด 'Value Added Tax' (ในภาพคือค่าที่อยู่ในกรอบสีแดง)"
    ),

  // Exchange rate
  exchange_rate_usd_to_thb: z
    .number()
    .optional()
    .describe(
      "FX rate 1 USD = ? THB / อัตราแลกเปลี่ยน ดอลลาร์สหรัฐต่อบาทไทย (เช่น 1 USD = 32.4975 THB); ดึงเฉพาะตัวเลขฝั่ง THB ต่อ 1 USD"
    ),

  // Customs/Import Services - ONLY final page totals marked with 'รวมทั้งสิ้น' or equivalent
  customs_clearance_services: z
    .array(
      z.object({
        description: z
          .string()
          .optional()
          .describe(
            "ONLY the exact label for the final total line: 'รวมทั้งสิ้น' / 'Total' / 'Grand Total' / or similar final summary label found on the page"
          ),
        final_cost: z
          .number()
          .describe(
            "The FINAL TOTAL amount shown at 'รวมทั้งสิ้น' or equivalent summary line; NOT individual line items or sub-totals"
          ),
        currency: z
          .string()
          .optional()
          .describe("Currency (THB/USD/etc.) / สกุลเงิน"),
        reference_no: z
          .string()
          .optional()
          .describe(
            "Invoice Number / Reference / Bill No. / เลขที่บิล / เลขที่อ้างอิง (ถ้ามี)"
          ),
      })
    )
    .describe(
      "Array of customs clearance FINAL TOTALS only (e.g., 'รวมทั้งสิ้น' lines). Do NOT include individual line items, breakdowns, or sub-amounts. Only extract the final aggregated total for each page or invoice section."
    ),
  closing_date: z
    .string()
    .describe(
      "Closing Date / End of Unloading Date / วันที่สิ้นสุดการขนถ่ายสินค้า; ส่งวันที่ตามที่พบในเอกสารต้นฉบับโดยไม่ต้องแปลงเป็น ISO"
    ),
  total_tax_amount: z
    .number()
    .describe(
      "Taxable Base Amount / Total Taxable Amount / ยอดรวมฐานภาษีที่นำไปคำนวณภาษี; ดึงค่าจากบรรทัด 'Total Taxable Amount' (ในภาพคือ 34,181.13 ที่ถูกขีดเส้นใต้)"
    ),
});

export type LNGCargoFlat = z.infer<typeof LNGCargoSchemaFlat>;

export const CARGO_SYSTEM_PROMPT = `
You are a specialized data extraction assistant for LNG cargo shipping documents. Extract structured information into the provided schema. Documents may be in English, Thai, or mixed.

---
## EXTRACTION RULES:
1) Language: Handle Thai (ภาษาไทย) and English. Do not translate values; capture as shown.
2) Numbers: Remove commas and units; extract numeric values only.
3) Dates: **Extract dates EXACTLY as they appear in the source document. Do NOT attempt to convert to ISO (YYYY-MM-DD) format.**
4) Currency: Keep numeric values separate from currency symbols.
5) **NO CALCULATION: Do NOT perform any arithmetic or calculation for any field. Only extract values directly displayed in the document.**
6) **DATA SOURCE INTEGRITY: For all fields, the model MUST strictly use the numeric value explicitly and clearly displayed in the document.**

---
## FIELD-SPECIFIC INSTRUCTIONS:
- seller_name: Company selling LNG (labels may include Seller/Supplier/ผู้ขาย/ผู้จำหน่าย/คู่สัญญา).
- payment_due_date: Payment due/due date/กำหนดชำระ. **Extract date in the format seen (e.g., "20-Aug-25").**
- vessel_name: Vessel/Ship/ชื่อเรือ.
- voyage_load_port: Loading Port/Port of Loading/ท่าเรือต้นทาง.
- voyage_quantity_mmbtu: Energy quantity in MMBTU (MMBtu, million BTU, etc.). Extract the MMBTU figure.
- voyage_price_usd_per_mmbtu: Unit Price USD/MMBTU.
- voyage_net_amount_usd: Net Invoice Amount USD.
- voyage_total_amount_incl_gst: Final grand total including GST/VAT if explicitly shown; otherwise omit.

- **hhv_volume**: HHV / GHV / Higher Heating Value. Extract the numeric value from the 'HIGHER HEATING VALUE (VOLUME)' line in Section 4. DISCHARGE INFORMATION.

- quantity_net_delivered: Return NET DELIVERED strictly in Metric Tons (MT).

- survey_fee_before_tax: Surveyor/Inspection fee before tax (exclude VAT). Extract the total sum of Inspection/Survey fees and Analysis fees which is located immediately above the 'Value Added Tax' line.

- exchange_rate_usd_to_thb: Extract FX rate as the numeric THB per 1 USD. If multiple rates exist, prefer the BOT announced selling rate on unloading/settlement date.

- closing_date: Extract the 'TO' date from the 'DATE FROM TO' range, which represents the End of Unloading/Closing Date. **Extract date in the format seen in the document (e.g., "05-Aug-2025").**

- **total_tax_amount**: Extract the **Total Taxable Amount** (ยอดรวมฐานภาษี) from the row labeled **'Total Taxable Amount'** in the summary table.

CUSTOMS CLEARANCE SERVICES (ARRAY) - CRITICAL RULES:
⚠️ ONLY extract FINAL TOTAL lines (e.g., "รวมทั้งสิ้น", "Total", "Grand Total", "Net Total").
⚠️ DO NOT extract individual line items, sub-amounts, or breakdowns.
⚠️ Look for the FINAL AGGREGATED SUM that represents the complete cost for that section/page.
⚠️ The "description" field should contain ONLY the exact label of the final total line.

---
## GENERAL:
- Only extract values explicitly present in the document; do not guess.
- If a field is not found, leave it undefined/null per schema behavior.

OUTPUT: Return only valid JSON conforming to the schema. Do not include explanations or markdown.
`;