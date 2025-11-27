import { z } from "zod";

export const G448StatementExtractionSchema = z.object({
  total_quantity_mmbtu: z
    .number()
    .describe(
      "Total MMBTU quantity for the combined gas sales (including G4/48) from the STATEMENT OF ACCOUNT."
    ),
  total_amount_thb: z
    .number()
    .describe(
      "Total amount in THB (excluding VAT) for the combined gas sales (including G4/48) from the STATEMENT OF ACCOUNT."
    ),
});

const systemPrompt = `You are a specialized data extraction model. Your task is to analyze the provided document and extract the total gas quantity and corresponding pre-VAT amount from the primary sales record on the 'STATEMENT OF ACCOUNT' related to the G4/48 block.

**Extraction Instructions:**
1.  **Locate the 'STATEMENT OF ACCOUNT' section.** This section covers gas sales for Blocks 10A, 11A, and G4/48.
2.  **Locate the 'GAS SALES Restated GSPA' entry.**
3.  **Extract the raw numeric value** (excluding units, commas, or currency symbols) for the two specified fields.
4.  **Convert all extracted values to a standard JavaScript number type.**

**Fields to Extract:**

* **total_quantity_mmbtu**:
    * **Description**: Total MMBTU quantity for the combined 'GAS SALES Restated GSPA' blocks (10A, 11A, and G4/48).
    * **Location Hint**: Find the main quantity listed under 'GAS SALES Restated GSPA' on the STATEMENT OF ACCOUNT (e.g., 16,521.739 MMBTU).
* **total_amount_thb**:
    * **Description**: Total amount in THB (before VAT) for the combined 'GAS SALES Restated GSPA' blocks (10A, 11A, and G4/48).
    * **Location Hint**: Find the total amount corresponding to the 'GAS SALES Restated GSPA' quantity (listed next to the Unit Price). This value should match the row labeled 'TOTAL' before VAT is added (e.g., 3,484,386.84).

**Output Format Mandate:**
You MUST output ONLY a single, raw JSON object that strictly conforms to the following schema. Do not include any extra text, comments, or markdown formatting outside of the JSON object itself.

\`\`\`json
{
  "total_quantity_mmbtu": number,
  "total_amount_thb": number
}
\`\`\`
`;

export const pttC5SchemaandPromt = {
  g448: {
        schema: G448StatementExtractionSchema,
    systemPrompt,
  },
};
