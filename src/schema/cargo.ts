import { z } from "zod";

export const CargoSystemPrompt = `
    You are an expert information extractor for LNG import invoices and customs-related Thai-English documents. Your goal is to produce consistent JSON that matches a provided Zod schema, with reliable field mapping across varying formats.

    Data domain and context:
    - Documents may be bilingual (Thai/English), contain tables, headers, notes, and footers.
    - Key sections include: invoice price (DES/Ex-Ship), quantities (MMBTU, Metric Tons), quality (GHV/HHV), due dates, import costs, exchange rates, and customs totals.
    - Values may appear in summaries (รวม), line items, or notes (หมายเหตุ).
    - VAT may or may not be explicitly shown; do not compute VAT if not stated.

    Number normalization rules:
    - Remove thousands separators (commas and thin spaces).
    - Convert Thai numerals ๐๑๒๓๔๕๖๗๘๙ to Arabic 0123456789.
    - Preserve decimal points; do not change decimal precision.
    - Return numbers as plain strings without units unless the schema expects free text.
    - Do not infer or calculate missing numbers; extract only explicitly printed values.

    Date handling:
    - Accept DD-MMM-YY (e.g., 17-Sep-25), DD/MM/YYYY, YYYY-MM-DD, Thai Buddhist Era formats.
    - If unambiguous, convert to ISO 8601 (YYYY-MM-DD). If ambiguous, return the original as printed.

    Units and terminology:
    - MMBTU synonyms: MMBtu, MMBTU, ล้าน BTU, ล้านบีทียู.
    - Metric Tons synonyms: MT, Metric Tons, ตันเมตริก, ตัน.
    - Price terms: DES, LNG (Ex-Ship), ราคาเนื้อ LNG, Price USD/MMBtu.
    - Quality terms: HHV, GHV, BTU/Scf, ค่าความร้อน.
    - Due date: Due Date, Payment Due, วันที่ครบกำหนดชำระ.
    - Exchange rate: อัตราแลกเปลี่ยนขาย, Average Selling Rates, บาท/USD, (1 USD = x THB).
    - Customs totals: รวมเงินทั้งสิ้น (กรมศุลกากร), Grand Total (Customs).
    - Loading port: Loading Port, Port of Loading, ท่าเรือต้นทาง.

    Context awareness and table reading:
    - Prefer explicit labeled fields (e.g., 'Due Date:', 'Vessel Name:').
    - For quantities, select the MMBTU value when both MMBTU and Metric Tons appear.
    - For totals in THB, prefer summary lines that combine LNG price and import costs (e.g., 'รวมค่าเนื้อ LNG และค่าใช้จ่ายนำเข้า').
    - For analysis fees, extract the printed amount(s) specifically labeled as Surveyor/Lab/Analysis. If a combined total excluding VAT is printed, use that. Only output VAT-inclusive totals if explicitly stated.
    - When multiple candidates exist, choose the most specific, context-appropriate label near the target field.

    Validation logic to apply mentally (do not compute new values):
    - Numbers must be numeric strings after normalization with optional decimal part.
    - Dates should be ISO if confidently parseable; otherwise return the original.
    - Arrays should contain unique entries in document order; do not deduplicate if order conveys meaning.
    - Keep currency domains correct: USD items remain USD; THB items remain THB.

    Quality checklist before finalizing:
    - Are all required fields present? If a field truly does not appear, return an empty string or empty array as applicable.
    - Do all numbers obey normalization rules (no commas, decimals preserved)?
    - Are units excluded where number-only is required?
    - Did you avoid inferring or calculating values?
    - For analysis totals with VAT: only output if explicitly specified as VAT-inclusive.

    Output format requirements:
    - Output must exactly match the Zod schema keys and types.
    - Use strings for numbers; arrays for multiple customs totals.
    - Do not include extra keys, comments, or units.
    - Maintain JSON cleanliness; no trailing text, explanations, or nulls.

    Thai-English mapping and synonym list (non-exhaustive):
    - รวมจำนวน LNG นำเข้า ล้าน BTU ประจำเดือน -> Monthly LNG total (MMBTU), Quantity Unloaded total, ยอดรวม MMBTU
    - วันที่ครบกำหนดชำระ -> Due Date, Payment Due
    - ชื่อเรือ -> Vessel Name, Ship, Carrier
    - ท่าเรือต้นทาง -> Loading Port, Port of Loading
    - ปริมาณ (MMBTU) -> Quantity MMBTU, Quantity Unloaded
    - ราคา (USD/MMBtu) -> LNG (Ex-Ship), DES Price
    - ยอดเงิน (USD) -> Amount, Invoice Amount
    - ยอดรวม (บาท) -> Grand Total THB, รวมค่าเนื้อ LNG และค่าใช้จ่ายนำเข้า
    - ค่าความร้อน -> GHV/HHV BTU/Scf
    - น้ำหนักสุทธิ (ตันเมตริก) -> Metric Tons, MT
    - ค่าตรวจวิเคราะห์ -> Surveyor Fee, Lab Test, Analysis
    - รวมเงินทั้งสิ้น (กรมศุลกากร) -> Customs Grand Total
    - อัตราขาย (บาท/USD) -> FX Sell Rate THB per USD

    If any field is absent, output an empty string (or empty array for customs totals). Never invent values.

    `;

export const CargoSchema = z.object({
  // รวมจำนวน LNG นำเข้า ล้าน BTU ประจำเดือน
  monthly_lng_total_mmbtu: z
    .string()
    .describe(
      "EN: Monthly total LNG imported in million BTU (MMBTU) for the statement period. Extract the summed figure (รวมจำนวน LNG นำเข้า ล้าน BTU ประจำเดือน). Accept variants like 'Quantity Unloaded', 'Total MMBTU', 'ยอดรวม MMBTU', 'รวมปริมาณ', or totals shown near monthly summary. Normalize numbers: remove thousands separators, convert Thai numerals (๐-๙) to Arabic, preserve decimals. Return plain number string without units.\nTH: ปริมาณรวม LNG ที่นำเข้า (หน่วย MMBTU) สำหรับประจำเดือน/งวดรายงาน (เช่น รวมจำนวน LNG นำเข้า ล้าน BTU ประจำเดือน). อาจพบในคำว่า 'Quantity Unloaded', 'Total MMBTU', 'ยอดรวม MMBTU', 'รวมปริมาณ'. แปลงตัวเลขไทยเป็นอารบิก ลบเครื่องหมายคั่นหลัก พักจุดทศนิยมไว้ ส่งคืนเฉพาะตัวเลขไม่รวมหน่วย."
    ),

  // payment due
  payment_due_date: z
    .string()
    .describe(
      "EN: Payment due date as printed (e.g., 'Due Date: 17-Sep-25'). Accept DD-MMM-YY, DD/MM/YYYY, YYYY-MM-DD, Thai date formats with Buddhist Era. Convert to ISO 8601 date (YYYY-MM-DD) if clear; otherwise return the original string. Synonyms: 'Due', 'Payment Due', 'วันที่ครบกำหนดชำระ'.\nTH: วันที่ครบกำหนดชำระเงิน (เช่น 'Due Date: 17-Sep-25'). ยอมรับรูปแบบวันที่หลายแบบ รวม พ.ศ. หากแปลงได้ให้คืนรูปแบบ ISO (YYYY-MM-DD) มิฉะนั้นคืนตามเอกสาร. คำพ้อง: 'Due', 'Payment Due', 'วันที่ครบกำหนดชำระ'."
    ),

  // vessel name
  vessel_name: z
    .string()
    .describe(
      "EN: Vessel name (e.g., 'Vessel Name: CELSIUS GALAPAGOS'). Synonyms: 'Ship', 'Carrier', 'เรือ', 'ชื่อเรือ'. Return the exact string as printed.\nTH: ชื่อเรือ (เช่น 'Vessel Name: CELSIUS GALAPAGOS'). คำพ้อง: 'เรือ', 'ชื่อเรือ', 'Ship', 'Carrier'. คืนค่าตามที่พิมพ์ในเอกสาร."
    ),

  // load port
  loading_port: z
    .string()
    .describe(
      "EN: Loading/Load Port where LNG was loaded (e.g., 'Loading Port: CORPUS CHRISTI LNG TERMINAL / GREGORY, TEXAS, USA'). Synonyms: 'Load Port', 'Port of Loading', 'ท่าเรือต้นทาง'. Preserve full text.\nTH: ท่าเรือต้นทาง/ท่าเรือที่บรรทุก (เช่น 'Loading Port: ...'). คำพ้อง: 'Load Port', 'Port of Loading', 'ท่าเรือต้นทาง'. เก็บข้อความเต็มตามเอกสาร."
    ),

  // quantity MMBTU
  quantity_mmbtu: z
    .string()
    .describe(
      "EN: Quantity in MMBTU (e.g., 'Quantity Unloaded 3,727,474 MMBTU'). Choose the explicit MMBTU value. If multiple appear, prefer the line-item or header 'Quantity Unloaded'. Normalize number: remove commas, convert Thai numerals, preserve decimals. Return numeric string only.\nTH: ปริมาณหน่วย MMBTU (เช่น 'Quantity Unloaded 3,727,474 MMBTU'). หากมีหลายค่า ให้เลือกค่าที่ชี้ชัดว่าเป็นปริมาณถ่ายลง/นำเข้า. ส่งคืนเฉพาะตัวเลข ไม่รวมหน่วย และจัดรูปแบบตัวเลขตามกติกา."
    ),

  // price
  price_usd_per_mmbtu: z
    .string()
    .describe(
      "EN: LNG price per MMBTU in USD (e.g., 'LNG (Ex-Ship) 12.8111 USD/MMbtu' or 'Invoice ราคา LNG (DES) 12.8111 USD/Mmbtu'). Synonyms: 'Price (DES)', 'LNG (Ex-Ship)', 'ราคาเนื้อ LNG', 'DES Price'. Return numeric string only.\nTH: ราคา LNG ต่อ MMBTU หน่วย USD (เช่น 'LNG (Ex-Ship) 12.8111 USD/MMbtu' หรือ 'ราคา LNG (DES)'). คำพ้อง: 'DES', 'ราคาเนื้อ', 'Invoice ราคา LNG'. คืนเฉพาะตัวเลข."
    ),

  // net amount (e.g., Amount in USD)
  net_amount_usd: z
    .string()
    .describe(
      "EN: Net invoice amount in USD before local import add-ons (e.g., 'Amount 47,753,042.16 USD'). Synonyms: 'Amount', 'Invoice Amount', 'ยอดเงิน USD'. Return numeric string only.\nTH: ยอดสุทธิใบแจ้งหนี้เป็น USD ก่อนบวกค่าใช้จ่ายนำเข้าในประเทศ (เช่น 'Amount 47,753,042.16 USD'). คำพ้อง: 'Amount', 'ยอดเงิน', 'Invoice Amount'. คืนเฉพาะตัวเลข."
    ),

  // total amount (THB) combining LNG + import costs
  total_amount_thb: z
    .string()
    .describe(
      "EN: Total in THB including LNG value plus import costs (e.g., 'รวมค่าเนื้อ LNG และค่าใช้จ่ายนำเข้า 1,551,903,132.34'). Prefer the summary line that combines both. Return numeric string only (THB). Synonyms: 'Grand Total', 'รวมทั้งสิ้น (บาท)'.\nTH: ยอดรวมเป็นบาทที่รวมราคาเนื้อ LNG กับค่าใช้จ่ายนำเข้า (เช่น 'รวมค่าเนื้อ LNG และค่าใช้จ่ายนำเข้า 1,551,903,132.34'). เลือกบรรทัดสรุปรวมทั้งสองส่วน. คืนเฉพาะตัวเลข (บาท)."
    ),

  // higher heating value (BTU/Scf)
  higher_heating_value_btu_per_scf: z
    .string()
    .describe(
      "EN: Higher Heating Value (HHV) a.k.a. GHV in BTU/Scf (e.g., 'Quality - GHV 1,031.12 BTU/Scf'). Synonyms: 'GHV', 'HHV', 'ค่าความร้อนสูงสุด'. Return numeric string only.\nTH: ค่าความร้อนเชิงปริมาณสูง (HHV/GHV) หน่วย BTU/Scf (เช่น 'GHV 1,031.12 BTU/Scf'). คำพ้อง: 'GHV', 'HHV', 'ค่าความร้อน'. คืนเฉพาะตัวเลข."
    ),

  // net delivered (Metric Tons)
  net_delivered_metric_tons: z
    .string()
    .describe(
      "EN: Delivered quantity in Metric Tons if available (e.g., '71,121.478 Metric Tons'). Synonyms: 'Quantity (MT)', 'Tonnage', 'น้ำหนักสุทธิ (ตันเมตริก)'. Return numeric string only.\nTH: ปริมาณส่งมอบหน่วยตันเมตริก (เช่น '71,121.478 Metric Tons'). คำพ้อง: 'น้ำหนักสุทธิ', 'ปริมาณ (ตัน)', 'MT'. คืนเฉพาะตัวเลข."
    ),

  // analysis amount without VAT (Surveyor + Lab, etc.) in THB
  analysis_amount_without_vat_thb: z
    .string()
    .describe(
      "EN: Analysis-related fees total in THB excluding VAT (e.g., 'Surveyor Fee และ ค่า Lab Test ... 19,164.750 บาท'). If separate lines, sum only analysis-related items (Surveyor, Lab) excluding VAT. If VAT not shown, return the subtotal number printed. Numeric string only.\nTH: ค่าตรวจวิเคราะห์ (เช่น Surveyor, Lab) ไม่รวม VAT หน่วยบาท หากมีหลายบรรทัดให้รวมเฉพาะที่เกี่ยวกับการวิเคราะห์ คืนเฉพาะตัวเลข."
    ),

  // analysis amount with VAT (total) in THB
  analysis_amount_with_vat_thb: z
    .string()
    .describe(
      "EN: Analysis-related fees including VAT in THB, if the document provides a VAT-inclusive total. If not explicitly available, return the best explicit total that states VAT included for analysis. Numeric string only; do not calculate.\nTH: ค่าตรวจวิเคราะห์รวม VAT (บาท) หากเอกสารระบุยอดรวมรวมภาษีแล้ว ให้ดึงค่านั้น หากไม่ระบุชัดเจนให้ดึงยอดรวมที่บอกว่ารวม VAT เท่านั้น ห้ามคำนวณเอง คืนเฉพาะตัวเลข."
    ),

  // รวมเงินทั้งสิ้น จากกรมศุลกากร (array uncertain)
  customs_grand_totals_thb: z
    .array(z.string())
    .describe(
      "EN: Array of 'Grand Total' amounts (THB) from Thai Customs documents or sections labelled 'รวมเงินทั้งสิ้น' from customs-related pages. Support multi-page captures; include all occurrences as numeric strings without units. Synonyms: 'รวมเงินทั้งสิ้น', 'Grand Total (Customs)'.\nTH: รายการจำนวนเงิน 'รวมเงินทั้งสิ้น' จากเอกสาร/ส่วนของกรมศุลกากร (หลายหน้าได้) เก็บทุกค่าที่พบเป็นอาร์เรย์ของสตริงตัวเลข ไม่รวมหน่วย."
    ),

  // exchange rate อัตราขาย (1 USD = ? THB)
  fx_sell_rate_thb_per_usd: z
    .string()
    .describe(
      "EN: Exchange rate Sell (THB per USD), e.g., '32.4975 บาท/USD', 'อัตราแลกเปลี่ยนขาย', 'Average Selling Rates', '(1 USD = x THB)'. Return numeric string only.\nTH: อัตราแลกเปลี่ยน (อัตราขาย) บาทต่อดอลลาร์ เช่น '32.4975 บาท/USD', 'Average Selling Rates', '(1 USD = x THB)'. คืนเฉพาะตัวเลข."
    ),
});
