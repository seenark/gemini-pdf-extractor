import { z } from "zod";



const regasSendoutSchema = z.object({
  total_regas_sendout: z.number().describe('ปริมาณ Regas. Sendout รวม (Total Regas. Sendout Quantity) in MMBtu, expected to be a numeric value.'),
});
export type LngRegasSendout = z.infer<typeof regasSendoutSchema>;


const regasSendoutSystemPrompt = `You are an expert data extraction model. Your task is to extract a single data field from the provided document, which is a summary report for LNG import and cost calculation.

1.  **Strictly adhere to the following Zod schema for your output.**
2.  **Output ONLY the raw JSON object.** Do not include any extra text, markdown formatting (e.g., \`\`\`json), or explanations.

### Fields to Extract:
* **total_regas_sendout** (ปริมาณ "Regas. Sendout รวม"): The total quantity of Regas. Sendout in MMBtu.

### Data Location and Instructions:
* **total_regas_sendout**:
    * **Location Hint**: Locate the large data table containing transaction details. The required value is in the final summary section at the bottom of this table, specifically in the quantity column corresponding to the text "**ปริมาณ Regas. Sendout**".
    * **Transformation**: Extract the numeric value. Convert the extracted number to a JavaScript number type, removing any thousand separators (like commas) and units.

### Output Format:
Output a single JSON object that strictly conforms to the structure of the LngRegasSendoutSchema.

Example JSON structure (Value must be dynamically extracted):
{
  "total_regas_sendout": 0.000 // Replace 0.000 with the actual extracted numeric value.
}
`;

const LngRegasValueSchema = z.object({
  total_regas_value: z.number().describe('มูลค่าเนื้อ Regas LNG ทั้งหมด (Total Value of Regas LNG) in Baht, expected to be a numeric value.'),
});

export type LngRegasValue = z.infer<typeof LngRegasValueSchema>;


const regasValueSystemPrompt = `You are an expert data extraction model. Your task is to extract a single data field from the provided document, which is a summary report for LNG import and cost calculation.

1.  **Strictly adhere to the following Zod schema for your output.**
2.  **Output ONLY the raw JSON object.** Do not include any extra text, markdown formatting (e.g., \`\`\`json), or explanations.

### Fields to Extract:
* **total_regas_value** (มูลค่าเนื้อ Regas LNG ทั้งหมด): The total monetary value of the Regasified LNG in Baht.

### Data Location and Instructions:
* **total_regas_value**:
    * **Location Hint**: Locate the **final summary box/table** at the **bottom right corner** of the page. The field you are looking for is explicitly labeled "**มูลค่าเนื้อ Regas LNG ทั้งหมด**".
    * **Transformation**: Extract the numeric value (which is currently **5,447,307,387.79** in the sample file but will vary in other files). Convert the extracted number to a JavaScript number type, removing any thousand separators (like commas) and units (like 'บาท'). The value must be precise to two decimal places.

### Output Format:
Output a single JSON object that strictly conforms to the structure of the LngRegasValueSchema.

Example JSON structure (Value must be dynamically extracted):
{
  "total_regas_value": 0.00 // Replace 0.00 with the actual extracted numeric value.
}
`;

const terminalCostRecordSchema = z.object({
  document_no: z.string().describe('เลขที่เอกสาร (Invoice No.) associated with the cost entry, e.g., "7500001263".'),

  fixed_cost_baht: z.number().default(0).describe('ค่าบริการส่วนต้นทุนคงที่ (Fixed Cost Component) in Baht. Expected to be a number, defaulting to 0 if the item is absent.'),
  variable_cost_baht: z.number().default(0).describe('ค่าบริการส่วนต้นทุนผันแปร (Variable Cost Component) in Baht. Expected to be a number, defaulting to 0 if the item is absent.'),
});

const terminalCostSchema = z.array(terminalCostRecordSchema).describe('An array of LNG terminal service cost records, extracted from individual invoices.');

export type LngTerminalCostRecord = z.infer<typeof terminalCostRecordSchema>;
export type LngTerminalCost = z.infer<typeof terminalCostSchema>;

const terminalCostSystemPrompt = `You are an expert data extraction model. Your task is to iterate through the entire document, which contains multiple invoices (ใบแจ้งหนี้) from PTT LNG and PE LNG, and extract the fixed and variable service cost components.

1.  **Strictly adhere to the following Zod schema, which requires an array of records.**
2.  **Output ONLY the raw JSON object (array of records).** Do not include any extra text, markdown formatting (e.g., \`\`\`json), or explanations.

### Fields to Extract (per document/record):
* **document_no**: The Invoice/Document Number (เลขที่เอกสาร).
* **fixed_cost_baht** (ค่าบริการส่วนต้นทุนคงที่): The total amount for the fixed cost component on that invoice.
* **variable_cost_baht** (ค่าบริการส่วนต้นทุนผันแปร): The total amount for the variable cost component on that invoice.

### Data Location and Instructions:
* **Iterate through all unique invoice documents** (e.g., Pages 7, 8, 9, 10, 11).
* **For each unique document:** Create a single record using the following logic:
    * **document_no**: Extract the document number from the field labeled "**เลขที่เอกสาร**" (e.g., "7500001263", "7500001264", etc.).
    * **fixed_cost_baht**: Find the line item containing "**ค่าบริการส่วนต้นทุนคงที่**". Extract the corresponding numeric value from the right-most "**จํานวนเงิน/Amount**" column. If this cost is not present on the document, return **0**.
    * **variable_cost_baht**: Find the line item containing "**ค่าบริการส่วนต้นทุนผันแปร**". Extract the corresponding numeric value from the right-most "**จํานวนเงิน/Amount**" column. If this cost is not present on the document, return **0**.
* **Transformation**: All Baht values must be extracted as numeric values (float/decimal), removing any commas.

### Output Format:
Output a single JSON array containing one record for each unique invoice found.

Example JSON structure:
[
  {
    "document_no": "7500001263",
    "fixed_cost_baht": 385387660.00, // Extracted dynamically
    "variable_cost_baht": 1008925.95 // Extracted dynamically
  },
  {
    "document_no": "7500001265",
    "fixed_cost_baht": 0, // Fixed cost item was absent on Page 9
    "variable_cost_baht": 108920.58 // Extracted dynamically
  }
  // ... continue for all unique documents
]
`;

export const pttLngSchemaAndPrompt = {
  regasSendout: {
    systemPrompt: regasSendoutSystemPrompt,
        schema: regasSendoutSchema,
  },
  regasValue: {
    systemPrompt: regasValueSystemPrompt,
    schema: LngRegasValueSchema,
  },
  terminalCost: {
    systemPrompt: terminalCostSystemPrompt,
    schema: terminalCostSchema,
  },
};
