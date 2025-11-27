import { z } from 'zod';

export const terminalCostRecordSchema = z.object({
    document_no: z.string().describe('เลขที่เอกสาร (Invoice No.) associated with the cost entry.'),
    fixed_quantity_mmbtu: z.number().optional().describe("Quantity in MMBTU for the 'Fixed Cost' service component. Omitted if absent."),
    fixed_unit_price_baht: z.number().optional().describe("Unit price in THB/MMBTU for the 'Fixed Cost' service component. Omitted if absent."),
    fixed_amount_baht: z.number().optional().describe("Total amount in Baht for the 'Fixed Cost' service component. Omitted if absent."),
    variable_quantity_mmbtu: z.number().optional().describe("Quantity in MMBTU for the 'Variable Cost' service component. Omitted if absent."),
    variable_unit_price_baht: z.number().optional().describe("Unit price in THB/MMBTU for the 'Variable Cost' service component. Omitted if absent."),
    variable_amount_baht: z.number().optional().describe("Total amount in Baht for the 'Variable Cost' service component. Omitted if absent."),
    customs_fee_baht: z.number().optional().describe('ค่าดำเนินการทำพิธีศุลกากร (Customs Clearance Fee) in Baht. Omitted if the item is absent.'),
    other_fee_baht: z.number().optional().describe('ค่าธรรมเนียมอื่น (Other Fee/Handling Fee) in Baht. Omitted if the item is absent.'),
    total_amount_pre_vat_baht: z.number().describe('The total amount of the invoice before VAT (รวมจำนวนเงิน / Total Amount).'),
});

export const terminalCostSchema = z.array(terminalCostRecordSchema).describe('An array of LNG terminal and OR service cost records.');

export type LngTerminalCostRecord = z.infer<typeof terminalCostRecordSchema>;
export type LngTerminalCost = z.infer<typeof terminalCostSchema>;

const terminalCostSystemPrompt = `You are an expert data extraction model. Your task is to iterate through the entire document, which contains multiple invoices (ใบแจ้งหนี้) from PTT LNG, PE LNG, and OR (PTT Oil and Retail Business), and extract all available service details, fees, and totals, mapping them to a single flat object per invoice.

1.  **Strictly adhere to the following Zod schema, which requires an array of FLAT records.**
2.  **Output ONLY the raw JSON object (array of records).** Do not include any extra text or markdown formatting (e.g., \`\`\`json).

### Fields to Extract (per document/record - 10 Optional, 2 Mandatory):
* **document_no**: The Invoice/Document Number (เลขที่เอกสาร). (Mandatory)
* **fixed_quantity_mmbtu**: MMBTU for Fixed Cost (Ld).
* **fixed_unit_price_baht**: Unit Price for Fixed Cost (Ld).
* **fixed_amount_baht**: Total Amount for Fixed Cost (Ld).
* **variable_quantity_mmbtu**: MMBTU for Variable Cost (Le).
* **variable_unit_price_baht**: Unit Price for Variable Cost (Le).
* **variable_amount_baht**: Total Amount for Variable Cost (Le).
* **customs_fee_baht**: Customs Clearance Fee.
* **other_fee_baht**: Other Fee.
* **total_amount_pre_vat_baht**: The total invoice amount BEFORE VAT. (Mandatory)

### Data Location and Instructions (Crucial Logic):
* **Identify all unique invoice documents** using the value in the "**เลขที่เอกสาร**" field.
* **Omission Rule**: If an optional field (any field except \`document_no\` and \`total_amount_pre_vat_baht\`) is **NOT** found in the document, you **MUST omit** the corresponding field from the final JSON record entirely.
* **Transformation**: All Baht and quantity values must be extracted as numeric values (float/decimal), removing any commas.

* **For each unique document:** Create a single record using the following logic:

    * **document_no**: Extract the document number from the field labeled "**เลขที่เอกสาร**".

    * **Fixed Cost Fields (Ld)**:
        * Find the line item containing "**ค่าบริการส่วนต้นทุนคงที่**". If found, extract the Quantity (\`fixed_quantity_mmbtu\`), Price (\`fixed_unit_price_baht\`), and Amount (\`fixed_amount_baht\`) from the associated row in the detailed table. If absent, **omit all three fixed_** fields.
    
    * **Variable Cost Fields (Le)**:
        * Find the line item containing "**ค่าบริการส่วนต้นทุนผันแปร**". If found, extract the Quantity (\`variable_quantity_mmbtu\`), Price (\`variable_unit_price_baht\`), and Amount (\`variable_amount_baht\`) from the associated row in the detailed table. If absent, **omit all three variable_** fields.

    * **customs_fee_baht** (OR Invoice 7500008057 - Page 5):
        * Find the line item "**ค่าดำเนินการทำพิธีศุลกากร**". Extract the amount from the "**จำนวน/Amount**" column. If absent, **omit the field**.

    * **other_fee_baht** (OR Invoice 7500008059 - Page 6):
        * Find the line item "**ค่าธรรมเนียมอื่น**". Extract the amount from the "**จำนวน/Amount**" column. If absent, **omit the field**.

    * **total_amount_pre_vat_baht**:
        * Extract the numeric value from the summary field labeled "**รวมจำนวนเงิน**" (or "**Total Amount**") which is the line *before* the VAT calculation.

### Output Format:
Output a single JSON array containing one record for each unique invoice found.

Example JSON structure for Invoice 7500001263:
[
  {
    "document_no": "7500001263",
    "fixed_quantity_mmbtu": 21700000.000,
    "fixed_unit_price_baht": 17.7598,
    "fixed_amount_baht": 385387660.00,
    "variable_quantity_mmbtu": 1166928.000,
    "variable_unit_price_baht": 0.8646,
    "variable_amount_baht": 1008925.95,
    "total_amount_pre_vat_baht": 386396585.95
  }
  // ... continue for all unique documents
]
`;

export const pttInventorySchemaAndPrompt = {
  terminalCost: {
        systemPrompt: terminalCostSystemPrompt,
    schema: terminalCostSchema,
  },
};