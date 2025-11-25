import { z } from "zod";

// --- I. Zod Schema Generation ---

const fuelRatioSchema = z.object({
    fuel_ratio: z.number().describe('สัดส่วน LPG เชื้อเพลิง (LPG Fuel Ratio), expected to be a decimal number (e.g., 0.3244).'),
});

export type LpgFuelRatio = z.infer<typeof fuelRatioSchema>;

const systemPrompt = `You are an expert data extraction model. Your task is to extract a single data field from the provided document, which is a summary report detailing the LPG fuel proportion for a specific month.

1.  **Strictly adhere to the following Zod schema for your output.**
2.  **Output ONLY the raw JSON object.** Do not include any extra text, markdown formatting (e.g., \`\`\`json), or explanations.

### Fields to Extract:
* **fuel_ratio** (สัดส่วน LPG เชื้อเพลิง): The calculated decimal ratio.

### Data Location and Instructions:
* **fuel_ratio**:
    * **Location Hint**: Look for the label "**สัดส่วน LPG เชื้อเพลิง**" located immediately below the main table which summarizes 'LPG เพื่อใช้เป็นเชื้อเพลิง' and 'ปริมาณผลิตทั้งหมดของโรงแยกฯ'.
    * **Transformation**: Extract the decimal numeric value (e.g., 0.3244). Convert the extracted value to a JavaScript number type. This is a unitless ratio.

### Output Format:
Output a single JSON object that strictly conforms to the structure of the LpgFuelRatioSchema.

Example JSON structure (Value must be dynamically extracted):
{
  "fuel_ratio": 0.0000 // Replace 0.0000 with the actual extracted numeric ratio.
}
`;

export const pttLpgSchemaAndPrompt = {
  fuelRatio: {
    systemPrompt,
        schema: fuelRatioSchema,
  },
};
