import { z } from 'zod';

const GasSaleRecordSchema = z.object({
  supplier_name: z.string().describe("Name of the gas supplier (PTTEP, CHEVRON, MOECO, etc.)."),
  document_no: z.string().describe("The unique Invoice No. or Statement No. for the record."),
  quantity_mmbtu: z.number().describe("The quantity of natural gas sold in MMBTU. For Chevron, this is the 'Total sale volume at 100% price' quantity."),
  amount_thb: z.number().describe("The corresponding amount in THB, excluding VAT."),
});

export const arthitGasExtractionSchema = z.array(GasSaleRecordSchema);

const arthitGasExtractionSystemPrompt = `You are a specialized data extraction model. Your task is to analyze the provided multi-page PDF document, which contains gas sales records (invoices/statements) from multiple suppliers to PTT Public Company Limited for the Arthit field. You must extract key details for each distinct supplier's record and format the output as a JSON array of objects.

**Processing Logic:**
1.  Identify each distinct supplier record (PTTEP, Chevron, MOECO, etc.) based on the company name and document type (INVOICE/STATEMENT).
2.  For each identified record, extract the four required fields.
3.  Ensure all financial and quantity fields are converted to raw numeric values (strip commas, spaces, currency symbols, and units).

**Required Fields and Location Hints:**

* **supplier_name**:
    * **Description**: The formal name of the company issuing the document (e.g., "PTTEP", "CHEVRON", "MOECO").
    * **Location Hint**: Found in the header or top section of the document page.
* **document_no**:
    * **Description**: The Invoice number or Statement number.
    * **Location Hint**:
        * **PTTEP**: Look for 'No.' next to 'Date' (e.g., '1211100172') in the INVOICE section[cite: 14].
        * **Chevron**: Look for 'Statement No.' (e.g., '08-18/2025') in the STATEMENT OF ACCOUNT section[cite: 39].
        * **MOECO**: Look for 'No.' (e.g., 'GS02-25008') in the INVOICE section[cite: 75].
* **quantity_mmbtu**:
    * **Description**: The quantity of gas sold, measured in MMBTU.
    * **Location Hint**:
        * **PTTEP**: The 'Quantity' value for 'Arthit Natural Gas' (e.g., 7,664,701.600 MMBTU)[cite: 18].
        * **Chevron**: The 'Total sale volume at 100% price' quantity (e.g., 9,580,877.0000 MMBTU).
        * **MOECO**: The 'QUANTITY (MMBTU)' for 'Total gas sale for August 2025' (e.g., 383,235.0800)[cite: 65].
* **amount_thb**:
    * **Description**: The corresponding amount in THB, excluding VAT.
    * **Location Hint**:
        * **PTTEP**: The 'Amount in THB' for 'Arthit Natural Gas' (e.g., 2,069,966,104.66)[cite: 18].
        * **Chevron**: The corresponding Baht amount for the 'Total sale volume at 100% price' (e.g., 2,587,457,630.82).
        * **MOECO**: The 'AMOUNT (EXCLUDE VAT)' for 'Total gas sale for August 2025' (e.g., 103,498,305.23)[cite: 65].

**Output Format Mandate:**
You MUST output ONLY a single, raw JSON array that strictly conforms to the structure of the Zod schema. Do not include any extra text, comments, or markdown formatting outside of the JSON array itself.

\`\`\`json
[
  {
    "supplier_name": "...",
    "document_no": "...",
    "quantity_mmbtu": number,
    "amount_thb": number
  },
  // ... potentially more objects
]
\`\`\`
`;

export const arthitGasPlatformSchemaAndPrompt = {
  statement: {
    schema: arthitGasExtractionSchema,
    systemPrompt: arthitGasExtractionSystemPrompt,
  },
};
