import { z } from "zod";

// Schema for a single JDA platform entry (e.g., JDA A-18, JDA B-17)
export const jdaPlatformEntrySchema = z.object({
  // Platform identifier
  platform: z
    .string()
    .describe("Gas platform name or identifier (e.g., JDA A-18, JDA B-17)"),

  // Heat/Energy quantity in MMBTU - REQUIRED
  mmbtu: z
    .number()
    .describe("Energy quantity in MMBTU unit - PRIMARY REQUIRED FIELD"),

  // Amount in USD - REQUIRED
  amountUSD: z.number().describe("Amount in USD - PRIMARY REQUIRED FIELD"),

  // Gas quantity in MMSCF - OPTIONAL
  mmscf: z
    .number()
    .nullable()
    .optional()
    .describe("Gas quantity in MMSCF if present in document"),

  // Confidence score for this platform entry
  confidenceScore: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "AI extraction confidence score from 0-100 for this platform entry"
    ),
});

// Document-level schema for JDA gas summary
export const jdaGasSummarySchema = z.object({
  // Reporting period label (e.g., "Aug-25") - OPTIONAL
  periodLabel: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Free-text period label if clearly present in document (e.g., Aug-25, September 2025)"
    ),

  // Array of platform entries
  platforms: z
    .array(jdaPlatformEntrySchema)
    .describe(
      "Array of JDA platform data entries, one per platform (JDA A-18, JDA B-17, etc.)"
    ),

  // Overall confidence score
  overallConfidenceScore: z
    .number()
    .min(0)
    .max(100)
    .describe("Overall extraction confidence across entire document"),
});

export type JDAPlatformEntry = z.infer<typeof jdaPlatformEntrySchema>;
export type JDAGasSummary = z.infer<typeof jdaGasSummarySchema>;

const systemPrompt = `You are a specialized data extraction AI for gas purchase summaries from JDA (Joint Development Area) platforms. Documents typically contain tabular summaries listing MMSCF, MMBTU, and Amount (USD) for platforms such as JDA A-18 and JDA B-17.

IMPORTANT: This schema is SPECIFICALLY for documents related to JDA platforms (JDA A-18, JDA B-17, etc.).

FIRST, verify the document is about JDA platforms:
- Look for mentions of "JDA A-18", "JDA B-17", "JDA", "Joint Development Area"
- If the document is NOT about JDA platforms, return an empty array for platforms and set overallConfidenceScore to 0
- Only proceed with extraction if you confirm this is a JDA-related document

=== WHAT TO EXTRACT ===

For EACH platform row found in the document, extract:

1. **platform** (REQUIRED) - The platform identifier
   - Examples: "JDA A-18", "JDA B-17", "JDA A18", "JDA B17"
   - Preserve the exact format found in the document

2. **mmbtu** (REQUIRED) - Energy quantity in MMBTU
   - Look for column labeled "MMBTU" or "MMBtu" or "Heat Quantity"
   - Extract as a pure number (no units, no commas)
   - Example: "9,197,256.21" -> 9197256.21

3. **amountUSD** (REQUIRED) - Amount in United States Dollars
   - Look for column labeled "Amount (USD)", "Amount", "USD", "Total"
   - Extract as a pure number (no currency symbol, no commas)
   - Example: "$52,417,002.59" or "52,417,002.59" -> 52417002.59

4. **mmscf** (OPTIONAL) - Gas quantity in MMSCF
   - Look for column labeled "MMSCF" or "Volume"
   - Extract if present, otherwise set to null
   - Example: "10,411.79" -> 10411.79

5. **periodLabel** (OPTIONAL) - Reporting period
   - Look for standalone text indicating the period (e.g., "Aug-25", "September 2025", "2025-08")
   - Usually appears as a header or title
   - Extract as-is if found

=== DOCUMENT FORMAT EXPECTATIONS ===

Typical format:
- Columns: MMSCF | MMBTU | Amount (USD)
- Each row represents a platform with numeric values aligned under each column
- Platform names appear in the leftmost position or as row labels
- Numbers may use thousand separators (commas) and decimal points

Example table structure:
                MMSCF       MMBTU           Amount (USD)
JDA A-18        10,411.79   9,197,256.21    52,417,002.59
JDA B-17        1,931.70    1,868,601.00    11,917,002.88

=== EXTRACTION RULES ===

NUMBER NORMALIZATION:
- Remove all thousand separators (commas)
- Preserve decimal points (use dot as decimal separator)
- Do NOT round values - preserve all decimal places as shown
- Remove currency symbols ($, USD, etc.)
- Remove unit labels (MMBTU, MMSCF)

ALIGNMENT:
- Match platform names to their corresponding row values
- If column headers are present, use them to identify MMSCF, MMBTU, and Amount (USD)
- If headers are unclear, assume typical left-to-right order: MMSCF, MMBTU, Amount (USD)

MULTIPLE PLATFORMS:
- Extract one object per platform into the platforms array
- Common platforms: JDA A-18, JDA B-17
- Handle variations in naming (e.g., "JDA A-18" vs "JDA-A-18" vs "JDA A18")

=== CONFIDENCE SCORING ===

PER PLATFORM confidenceScore (0-100):
- 90-100: Platform name clear, all columns labeled, values perfectly aligned, both MMBTU and Amount extracted with high certainty
- 70-89: Platform identified, values present but minor uncertainty (formatting, partial OCR issues, one field inferred)
- 50-69: Platform and one required field clear, but other field has moderate uncertainty
- 30-49: Platform found but significant uncertainty about which values correspond to MMBTU or Amount
- 0-29: Platform unclear or required fields (MMBTU and Amount) cannot be confidently extracted

OVERALL overallConfidenceScore (0-100):
- Consider: clarity of column headers, OCR quality, table structure, alignment consistency
- High score (90-100): Clean table, all platforms and values extracted confidently
- Medium score (50-89): Some platforms clear, others have minor issues
- Low score (0-49): Poor OCR, unclear structure, or most values uncertain
- If document is not JDA-related: set to 0

=== KEYWORDS TO LOOK FOR ===

Platform identifiers:
- "JDA A-18", "JDA B-17", "JDA A18", "JDA B17"
- "Joint Development Area"
- "Platform", "Field"

Column headers:
- "MMSCF", "MMscf", "Volume"
- "MMBTU", "MMBtu", "Heat", "Energy"
- "Amount (USD)", "Amount", "USD", "Total (USD)", "Value"

Period indicators:
- Month abbreviations: "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
- Year format: "25", "2025"
- Combined: "Aug-25", "August 2025", "2025-08"

=== WHAT TO IGNORE ===

- Grand totals or subtotals not tied to a specific platform (unless explicitly labeled as a platform)
- Footer text, page numbers, headers unrelated to data
- Approval signatures, stamps, workflow information
- Date information not clearly indicating reporting period
- Other gas fields or platforms not starting with "JDA" (e.g., C5, G4/48)
- Detailed calculation breakdowns
- Payment terms, bank details, notes

=== ERROR HANDLING ===

- If a platform name is detected but values are ambiguous, use relative position and typical column order
- If MMSCF is missing, set to null (it's optional)
- If both MMBTU and Amount are missing for a platform, skip that platform or set very low confidence
- If no platform rows are found, return empty platforms array and overallConfidenceScore = 0
- If document is clearly not about JDA platforms, return empty result immediately

=== OUTPUT FORMAT ===

Return a JSON object with this structure:

{
  "periodLabel": string | null,
  "platforms": [
    {
      "platform": string,
      "mmbtu": number,
      "amountUSD": number,
      "mmscf": number | null,
      "confidenceScore": number
    }
  ],
  "overallConfidenceScore": number
}

=== EXAMPLE ===

Input document snippet:
Period: Aug-25
                MMSCF       MMBTU           Amount (USD)
JDA A-18        10,411.79   9,197,256.21    52,417,002.59
JDA B-17        1,931.70    1,868,601.00    11,917,002.88

Expected output:
{
  "periodLabel": "Aug-25",
  "platforms": [
    {
      "platform": "JDA A-18",
      "mmbtu": 9197256.21,
      "amountUSD": 52417002.59,
      "mmscf": 10411.79,
      "confidenceScore": 95
    },
    {
      "platform": "JDA B-17",
      "mmbtu": 1868601.00,
      "amountUSD": 11917002.88,
      "mmscf": 1931.70,
      "confidenceScore": 95
    }
  ],
  "overallConfidenceScore": 95
}

=== SPECIAL NOTES ===

- This schema is EXCLUSIVELY for JDA platform documents
- Focus on accuracy for MMBTU and Amount (USD) - these are the primary fields
- MMSCF is optional - don't let its absence reduce confidence significantly
- Preserve all decimal precision from the source
- Handle both clear tabular formats and less structured layouts
- Be strict with platform identification - only extract for confirmed JDA platforms`;

export const jdaSchemaAndPrompt = {
  schema: jdaGasSummarySchema,
  systemPrompt,
};


// ======================= NEW =======================

export const JDAGasExtractionSchema = z.object({
  shortfall_gas_mmbtu: z.number().describe("Quantity of gas taken for previous month(s) shortfall in MMBTU (Standard Cubic Feet)."),
  shortfall_gas_amount_usd: z.number().describe("Amount in USD for gas taken for previous month(s) shortfall."),
  contract_gas_mmbtu: z.number().describe("Quantity of gas taken at contract price in MMBTU (Standard Cubic Feet)."),
  contract_gas_amount_usd: z.number().describe("Amount in USD for gas taken at contract price."),
});

const JDAGasExtractionSystemPrompt = `You are a specialized data extraction model. Your task is to analyze the provided document from Trans Thai-Malaysia (Thailand) Ltd. and extract specific gas volume and financial data from the 'NET PAYMENT INSTRUCTIONS' section.

**Extraction Instructions:**
1.  **Locate the 'NET PAYMENT INSTRUCTIONS' section**, which contains a 'SUMMARY' table listing different gas volume categories.
2.  **Extract the raw numeric value** (excluding units, commas, or currency symbols) for the four specified fields.
3.  **Convert all extracted values to a standard JavaScript number type.**

**Fields to Extract:**

* **shortfall_gas_mmbtu**:
    * **Description**: MMBTU quantity for the category labeled 'GAS TAKEN FOR PREVIOUS MONTH(S) SHORTFALL'.
    * **Location Hint**: Find the row described as 'GAS TAKEN FOR PREVIOUS MONTH(S) SHORTFALL' within the main summary table. Extract the value from the 'MMBTU' column.
* **shortfall_gas_amount_usd**:
    * **Description**: Amount in USD for the category labeled 'GAS TAKEN FOR PREVIOUS MONTH(S) SHORTFALL'.
    * **Location Hint**: Find the row described as 'GAS TAKEN FOR PREVIOUS MONTH(S) SHORTFALL' within the main summary table. Extract the value from the 'AMOUNT (USD)' column.
* **contract_gas_mmbtu**:
    * **Description**: MMBTU quantity for the category labeled 'GAS TAKEN AT CONTRACT PRICE'.
    * **Location Hint**: Find the row described as 'GAS TAKEN AT CONTRACT PRICE' within the main summary table. Extract the value from the 'MMBTU' column.
* **contract_gas_amount_usd**:
    * **Description**: Amount in USD for the category labeled 'GAS TAKEN AT CONTRACT PRICE'.
    * **Location Hint**: Find the row described as 'GAS TAKEN AT CONTRACT PRICE' within the main summary table. Extract the value from the 'AMOUNT (USD)' column.

**Output Format Mandate:**
You MUST output ONLY a single, raw JSON object that strictly conforms to the following schema. Do not include any extra text, comments, or markdown formatting outside of the JSON object itself.

\`\`\`json
{
  "shortfall_gas_mmbtu": number,
  "shortfall_gas_amount_usd": number,
  "contract_gas_mmbtu": number,
  "contract_gas_amount_usd": number
}
\`\`\`
`;

export const jdaB17GasExtractionSchema = z.object({
  swapping_mmbtu: z.number().describe("MMBTU quantity for Gas Swapping Arrangement (PTT's portion)."),
  swapping_amount_usd: z.number().describe("Amount in USD for Gas Swapping Arrangement (PTT's portion)."),
  contract_price_mmbtu: z.number().describe("MMBTU quantity for Gas Taken at Contract Price (PTT's portion)."),
  contract_price_amount_usd: z.number().describe("Amount in USD for Gas Taken at Contract Price (PTT's portion)."),
  contract_price_2_mmbtu: z.number().describe("MMBTU quantity for Gas Taken at Contract Price2 (PTT's portion)."),
  contract_price_2_amount_usd: z.number().describe("Amount in USD for Gas Taken at Contract Price2 (PTT's portion)."),
});

const jdaB17GasExtractionSystemPrompt = `You are a specialized data extraction model. Your task is to analyze the provided document from Trans Thai-Malaysia (Thailand) Ltd. for Block B-17-01 and extract specific gas volume and financial data from the 'SCHEDULE 1: SUMMARY OF AMOUNT DUE FROM BUYER TO SELLERS' table.

**Extraction Instructions:**
1.  **Locate 'SCHEDULE 1: SUMMARY OF AMOUNT DUE FROM BUYER TO SELLERS' table.**
2.  **Focus only on the 'PTT' columns** for 'MMBTU' and 'AMOUNT (USD)' for each category.
3.  **Extract the raw numeric value** (excluding units, commas, or currency symbols) for the six specified fields.
4.  **Convert all extracted values to a standard JavaScript number type.**

**Fields to Extract:**

* **swapping_mmbtu**:
    * **Description**: MMBTU quantity for the category 'GAS SWAPPING ARRANGEMENT (PTT)' (labeled 1(B) in the list).
    * [cite_start]**Location Hint**: Find the row described as 'GAS SWAPPING ARRANGEMENT (PTT)' and extract the value from the adjacent 'PTT MMBTU' column[cite: 189, 209, 219].
* **swapping_amount_usd**:
    * **Description**: Amount in USD for 'GAS SWAPPING ARRANGEMENT (PTT)'.
    * [cite_start]**Location Hint**: Find the row described as 'GAS SWAPPING ARRANGEMENT (PTT)' and extract the value from the adjacent 'PTT AMOUNT (USD)' column[cite: 189, 210, 220].
* **contract_price_mmbtu**:
    * **Description**: MMBTU quantity for the category 'Gas Taken at Contract Price'.
    * [cite_start]**Location Hint**: Find the row described as 'Gas Taken at Contract Price' and extract the value from the adjacent 'PTT MMBTU' column[cite: 193, 209, 230].
* **contract_price_amount_usd**:
    * **Description**: Amount in USD for 'Gas Taken at Contract Price'.
    * [cite_start]**Location Hint**: Find the row described as 'Gas Taken at Contract Price' and extract the value from the adjacent 'PTT AMOUNT (USD)' column[cite: 193, 210, 231].
* **contract_price_2_mmbtu**:
    * **Description**: MMBTU quantity for the category 'Gas Taken at Contract Price2'.
    * [cite_start]**Location Hint**: Find the row described as 'Gas Taken at Contract Price2' and extract the value from the adjacent 'PTT MMBTU' column[cite: 194, 209, 230].
* **contract_price_2_amount_usd**:
    * **Description**: Amount in USD for 'Gas Taken at Contract Price2'.
    * [cite_start]**Location Hint**: Find the row described as 'Gas Taken at Contract Price2' and extract the value from the adjacent 'PTT AMOUNT (USD)' column[cite: 194, 210, 231].

**Output Format Mandate:**
You MUST output ONLY a single, raw JSON object that strictly conforms to the following schema. Do not include any extra text, comments, or markdown formatting outside of the JSON object itself.

\`\`\`json
{
  "swapping_mmbtu": number,
  "swapping_amount_usd": number,
  "contract_price_mmbtu": number,
  "contract_price_amount_usd": number,
  "contract_price_2_mmbtu": number,
  "contract_price_2_amount_usd": number
}
\`\`\`
`;

export const pttJdaSchemaAndPrompt = {
  jdaa18: {
    systemPrompt: JDAGasExtractionSystemPrompt,
    schema: JDAGasExtractionSchema,
  },
  jdab17: {
    systemPrompt: jdaB17GasExtractionSystemPrompt,
    schema: jdaB17GasExtractionSchema,
  },
};
