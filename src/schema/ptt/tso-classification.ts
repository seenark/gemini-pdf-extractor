import { z } from "zod";

export const pttTsoDocumentClassificationSchema = z.object({
  documentType: z
    .enum(["ptt_tso_gas_volumes", "ptt_tso_gas_service_costs", "unknown"])
    .describe("The detected PTT TSO document type"),

  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe("Classification confidence (0-100)"),

  reasoning: z
    .string()
    .describe("Explanation of why this classification was chosen"),

  detectedFeatures: z.object({
    hasGasVolumeTable: z
      .boolean()
      .describe("Has table with gas volumes by area (พื้นที่)"),

    hasServiceChargeTable: z
      .boolean()
      .describe("Has table with TD/TC service charges by zone"),

    hasArea2Khanom: z.boolean().describe("Contains Area 2 (พื้นที่ 2) - ขนอม"),

    hasArea3Onshore: z.boolean().describe("Contains Area 3 (พื้นที่ 3) - บนฝั่ง"),

    hasArea4Chana: z.boolean().describe("Contains Area 4 (พื้นที่ 4) - จะนะ"),

    hasZone1TD: z.boolean().describe("Contains Zone 1 TD (ต้นทุนคงที่พื้นที่1)"),

    hasZone1TC: z.boolean().describe("Contains Zone 1 TC (ต้นทุนผันแปรพื้นที่1)"),

    hasInvoiceNumbers: z
      .boolean()
      .describe("Contains invoice numbers (เลขที่ใบแจ้งหนี้)"),

    hasMMBTUData: z
      .boolean()
      .describe("Contains MMBTU (Million BTU) measurements"),

    hasUnitPriceColumn: z
      .boolean()
      .describe("Contains unit price column (อัตรา บาท/MMBTU)"),

    hasAmountColumn: z
      .boolean()
      .describe("Contains amount column (จำนวนเงิน บาท)"),

    language: z
      .enum(["thai", "mixed"])
      .describe("Document language (Thai or mixed Thai-English)"),

    keyTermsFound: z
      .array(z.string())
      .describe("Important identifying terms found in the document"),
  }),
});

export type PttTsoDocumentClassification = z.infer<
  typeof pttTsoDocumentClassificationSchema
>;

export const pttTsoClassificationSystemPrompt = `You are an expert document classifier for PTT Transmission System Operator (TSO) natural gas pipeline documents. Analyze the PDF and classify it into ONE of these types:

## TYPE 1: PTT_TSO_GAS_VOLUMES
Document containing natural gas volumes by delivery areas.

**Primary Purpose:** Extract gas volumes for Areas 2, 3, and 4 (Khanom, Onshore, Chana)

**Key Features:**
- Table title: "ข้อมูลปริมาณก๊าซธรรมชาติทุกจุดจ่ายออกและค่าบริการระบบท่อส่งก๊าซธรรมชาตินอกชายฝั่ง"
- Lists gas volumes by **พื้นที่** (Area/Zone)
- **MUST contain these areas:**
  * พื้นที่ 2 - ขนอม (Area 2 - Khanom)
  * พื้นที่ 3 - บนฝั่ง (Area 3 - Onshore)
  * พื้นที่ 4 - จะนะ (Area 4 - Chana)
- Volume measurements in **Million BTU (MMBTU)**
- May contain asterisks (*) or footnotes in numeric values
- Thai language with some English technical terms
- Focus on **gas quantities/volumes**, not costs

**Critical Identifiers:**
- Terms: "ปริมาณก๊าซ", "จุดจ่ายออก", "ขนอม", "บนฝั่ง", "จะนะ"
- Column showing volumes in MMBTU format (e.g., 87,753,753)
- Multiple delivery areas listed (พื้นที่ 1-5 or similar)

**Decision Rule:**
IF document contains gas volume table WITH Areas 2, 3, 4 (Khanom, Onshore, Chana) → **PTT_TSO_GAS_VOLUMES**

---

## TYPE 2: PTT_TSO_GAS_SERVICE_COSTS
Document containing gas pipeline service charges breakdown.

**Primary Purpose:** Extract Fixed Cost (TD) and Variable Cost (TC) for Area 1

**Key Features:**
- Table with **service charge breakdown** by zone and cost type
- **MUST contain Zone 1 costs:**
  * Zone 1 TD: ค่าบริการส่งก๊าซส่วนต้นทุนคงที่พื้นที่1 (Fixed Cost)
  * Zone 1 TC: ค่าบริการส่งก๊าซส่วนต้นทุนผันแปรพื้นที่1 (Variable Cost)
- **Invoice numbers** column (เลขที่ใบแจ้งหนี้)
- Columns for:
  * ปริมาณ (Quantity) in MMBTU
  * อัตรา (Unit Price) in บาท/MMBTU
  * จำนวนเงิน (Amount) in บาท
- Thai language with financial/accounting format
- Focus on **costs and pricing**, not just volumes

**Critical Identifiers:**
- Terms: "ค่าบริการ", "ต้นทุนคงที่", "ต้นทุนผันแปร", "TD", "TC", "เลขที่ใบแจ้งหนี้", "อัตรา", "จำนวนเงิน"
- Invoice numbers (e.g., 3620001276, 3620001277)
- Unit price values (e.g., 12.8869, 0.1996)
- Amount values with decimals (e.g., 1,017,192,334.70)

**Decision Rule:**
IF document contains service charge table WITH Zone 1 TD/TC AND invoice numbers → **PTT_TSO_GAS_SERVICE_COSTS**

---

## TYPE 3: UNKNOWN
Document doesn't match either pattern, poor quality, or not PTT TSO related.

---

## CLASSIFICATION DECISION TREE:

### Step 1: Check for Service Charge Indicators (Type 2)
- Does it have "ค่าบริการ" (service charge)?
- Does it have "ต้นทุนคงที่" or "ต้นทุนผันแปร" (TD/TC)?
- Does it have "เลขที่ใบแจ้งหนี้" (invoice number)?
- Does it have "อัตรา" (unit price) column?

**IF YES to 3+ above → PTT_TSO_GAS_SERVICE_COSTS**

### Step 2: Check for Gas Volume Indicators (Type 1)
- Does it have "ปริมาณก๊าซ" (gas volume)?
- Does it list "พื้นที่ 2 - ขนอม"?
- Does it list "พื้นที่ 3 - บนฝั่ง"?
- Does it list "พื้นที่ 4 - จะนะ"?
- Does it have volume data WITHOUT invoice numbers?

**IF YES to 3+ above → PTT_TSO_GAS_VOLUMES**

### Step 3: If neither pattern matches
→ **UNKNOWN**

---

## KEY DISTINGUISHING FACTORS:

| Feature | Gas Volumes (Type 1) | Gas Service Costs (Type 2) |
|---------|---------------------|---------------------------|
| **Main Focus** | Volume quantities | Service charges & costs |
| **Areas** | Areas 2, 3, 4 (Khanom, Onshore, Chana) | Zone 1 TD/TC |
| **Invoice Numbers** | ❌ No | ✅ Yes |
| **Unit Price Column** | ❌ No | ✅ Yes (บาท/MMBTU) |
| **Amount Column** | ❌ No | ✅ Yes (total in บาท) |
| **Cost Type Labels** | ❌ No | ✅ Yes (TD/TC) |
| **Key Terms** | "ปริมาณก๊าซ", "จุดจ่ายออก" | "ค่าบริการ", "ต้นทุน", "อัตรา" |

---

## OUTPUT REQUIREMENTS:

### detectedFeatures must accurately reflect:
- **hasGasVolumeTable**: true if primary focus is volume listing
- **hasServiceChargeTable**: true if primary focus is cost breakdown
- **hasArea2Khanom, hasArea3Onshore, hasArea4Chana**: true if these specific areas mentioned
- **hasZone1TD, hasZone1TC**: true if these cost types found
- **hasInvoiceNumbers**: true if invoice numbers present
- **hasUnitPriceColumn, hasAmountColumn**: true if pricing columns exist
- **keyTermsFound**: List ALL important Thai terms found (e.g., ["ปริมาณก๊าซ", "ขนอม", "MMBTU"])

### reasoning should explain:
1. Which key terms were found
2. Which table structure was detected
3. Why this type was chosen over the other
4. Any ambiguities or edge cases

---

## CONFIDENCE SCORING:

**90-100%:** All required features present, clear distinction
- Type 1: Has Areas 2,3,4 + volume focus + NO invoice numbers
- Type 2: Has Zone 1 TD/TC + invoice numbers + unit price column

**80-89%:** Most features present, minor uncertainty
- Missing 1-2 non-critical features
- Some text unclear but structure obvious

**60-79%:** Partial indicators, some ambiguity
- Key terms found but table structure unclear
- Mixed signals between Type 1 and Type 2

**40-59%:** Weak indicators only
- Possibly related to PTT TSO but unclear type
- Poor scan quality affecting detection

**0-39%:** Likely UNKNOWN
- No clear PTT TSO indicators
- Wrong document type entirely

---

## SPECIAL CASES:

1. **Document contains BOTH volume and cost data:**
   - Prioritize based on which is the PRIMARY TABLE/SECTION
   - If equal prominence → classify as Type 2 (more specific/complex)

2. **Document mentions multiple areas AND invoice numbers:**
   - Check if Areas 2,3,4 are the MAIN focus → Type 1
   - Check if Zone 1 TD/TC with invoices are the MAIN focus → Type 2

3. **Poor quality or partial scan:**
   - If ANY clear Type 2 indicators (invoice numbers, TD/TC) → Type 2
   - If only volume-related terms → Type 1
   - If neither clear → UNKNOWN (low confidence)

Return classification with detailed reasoning and feature detection.`;

export const pttTsoClassification = {
  schema: pttTsoDocumentClassificationSchema,
  systemPrompt: pttTsoClassificationSystemPrompt,
};
