
import { GoogleGenAI } from "@google/genai";
import { LoanScenario, CalculatedLoan } from "../types";
import { formatCurrency } from "../utils/calculations";

const getGeminiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY is missing in environment variables.");
      throw new Error("API Key missing");
    }
    return new GoogleGenAI({ apiKey });
};

export const analyzeLoansWithGemini = async (
  scenarios: LoanScenario[], 
  calculatedData: CalculatedLoan[],
  globalHomePrice: number,
  projectionYears: number
): Promise<string> => {
  try {
    const ai = getGeminiClient();
    
    const snapshotYear = projectionYears;
    
    let promptData = `Home Price: ${formatCurrency(globalHomePrice)}\n`;
    promptData += `Analysis based on a ${snapshotYear}-Year Projection Horizon.\n\n`;
    
    scenarios.forEach((s, index) => {
      const c = calculatedData.find(cd => cd.id === s.id);
      if (!c) return;
      
      const downPaymentPercent = globalHomePrice > 0 
        ? (s.downPayment / globalHomePrice) * 100 
        : 0;

      promptData += `Scenario ${index + 1}: ${s.name}\n`;
      promptData += `- Down Payment: ${downPaymentPercent.toFixed(1)}% (${formatCurrency(s.downPayment)})\n`;
      promptData += `- Interest Rate: ${s.interestRate}%\n`;
      promptData += `- Monthly Total PITI+HOA: ${formatCurrency(c.totalMonthlyPayment)}\n`;
      
      if (s.monthlyExtraPayment > 0) {
          promptData += `- Extra Monthly Payment: ${formatCurrency(s.monthlyExtraPayment)}\n`;
      }
      
      promptData += `\nSNAPSHOT at Year ${snapshotYear}:\n`;
      promptData += `- Total PROFIT (Equity Gain): ${formatCurrency(c.profit)}\n`;
      promptData += `- Side Investment Portfolio: ${formatCurrency(c.investmentPortfolio)}\n`;
      promptData += `- NET WORTH (Total Equity + Investment): ${formatCurrency(c.netWorth)}\n`;
      promptData += `- NET COST (Total Paid - Recovered): ${formatCurrency(c.netCost)}\n`;
      promptData += `- Remaining Balance: ${formatCurrency(c.remainingBalance)}\n`;
      promptData += `- Total Equity Built: ${formatCurrency(c.totalEquityBuilt)}\n\n`;
    });

    const prompt = `
      You are a helpful mortgage financial advisor. 
      Analyze the following mortgage scenarios.
      
      ${promptData}
      
      Please provide:
      1. A recommendation on which loan is best for maximizing NET WORTH at year ${snapshotYear}.
      2. Compare the strategy of investing the deposit vs putting it into the house (look at Side Investment Portfolio vs Equity Gain).
      3. A comparison of NET COST.
      4. Highlight any risks with adjustable or high-rate options if apparent.
      
      Keep the tone professional yet accessible. Use Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "Sorry, I couldn't analyze the loans at this moment. Please check your API configuration.";
  }
};

export const extractPropertyData = async (url: string): Promise<Partial<LoanScenario> | null> => {
  try {
    const ai = getGeminiClient();
    
    const prompt = `
      I have a real estate listing URL: ${url}
      
      Please use Google Search to find the details for this specific property. 
      I need the following 4 numbers:
      1. Listing Price (Home Value)
      2. Annual Property Tax (Estimate is fine if exact not found)
      3. Annual Home Insurance (Estimate is fine)
      4. Annual HOA Fees (0 if none)
      
      Return ONLY a raw JSON object with these keys: "homeValue", "propertyTax", "homeInsurance", "hoa".
      Do not include markdown formatting or explanations. Just the JSON string.
      Example: { "homeValue": 500000, "propertyTax": 4500, "homeInsurance": 1200, "hoa": 0 }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text;
    if (!text) return null;

    // Clean up markdown code blocks if present
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonStr);
    
    // Basic validation
    if (typeof data.homeValue === 'number') {
      return {
        homeValue: data.homeValue,
        propertyTax: data.propertyTax || 0,
        homeInsurance: data.homeInsurance || 0,
        hoa: data.hoa || 0
      };
    }
    
    return null;

  } catch (error) {
    console.error("Error extracting property data:", error);
    return null;
  }
};

