import { GoogleGenAI } from "@google/genai";
import { ComparisonField } from "../../types";


// Check whether two values have the same meaning
export async function isSemanticMatch(
  field: ComparisonField,
  value1: string,
  value2: string
): Promise<boolean> {

  // Numbers are already handled by normalization
  if (
    field === "container_count" ||
    field === "gross_weight_kg"
  ) {
    return false;
  }


  const apiKey = process.env.GEMINI_API_KEY;


  // If there is no API key, skip Gemini
  if (
    !apiKey ||
    apiKey === "MY_GEMINI_API_KEY"
  ) {
    console.log(
      "Gemini API key not available. Skipping semantic matching."
    );

    return false;
  }


  const ai = new GoogleGenAI({
    apiKey: apiKey,
  });


  const prompt = `
You are comparing two values from shipping documents.

Field: ${field}

Value 1: ${value1}

Value 2: ${value2}

Determine whether the two values refer to the same
real-world information.

Consider the meaning of the values, not just exact spelling.

Return only:
YES
or
NO
`;


  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
  });


  const answer = response.text
    ?.trim()
    .toUpperCase();


  console.log(
    "Semantic matching AI response:",
    answer
  );


  return answer?.startsWith("YES") ?? false;
}