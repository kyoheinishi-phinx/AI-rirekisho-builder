import { ResumeData, GenerateResumeRequest } from "@/types/resume";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// AIサービスのインターフェース
export interface AIService {
  generateResume(request: GenerateResumeRequest): Promise<ResumeData>;
}

// ---------------------------------------------------------
// Google Gemini Implementation
// ---------------------------------------------------------
export class GeminiService implements AIService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    // APIキーがない場合はエラーになるため、呼び出し元でチェック推奨
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  }

  async generateResume(request: GenerateResumeRequest): Promise<ResumeData> {
    console.log("Gemini generating resume...");

    // モデル名を修正: 最新の Gemini 3 Pro プレビュー版を使用
    // 参照: https://ai.google.dev/gemini-api/docs/models?hl=ja
    const model = this.genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

    // 写真データはAI入力には不要かつ巨大すぎるため除外する
    const { photoBase64, ...userProfileWithoutPhoto } = request.userProfile || {};

    // 日本語のテキストが入力された場合は推敲・洗練を指示するプロンプトに切り替える
    // 構造化データがある場合はそれも考慮する
    const isJapaneseInput = (request.currentResumeText && /[一-龠]+|[ぁ-ゔ]+|[ァ-ヴー]+/.test(request.currentResumeText)) ||
                            (request.structuredData && JSON.stringify(request.structuredData).match(/[一-龠]+|[ぁ-ゔ]+|[ァ-ヴー]+/));

    const prompt = `
    You are an expert Japanese resume writer.
    ${isJapaneseInput 
      ? `Please refine and polish the following user information into a structured, professional Japanese Resume (Rirekisho) and Curriculum Vitae (Shokumu Keirekisho) data. Focus on improving clarity, conciseness, and cultural appropriateness for Japanese business contexts.`
      : `Please convert the following user information into a structured Japanese Resume (Rirekisho) and Curriculum Vitae (Shokumu Keirekisho) data.`
    }
    
    The output MUST be a valid JSON object matching this schema (do not include markdown code blocks, just raw JSON):
    {
      "basicInfo": {
        "firstName": "string (Japanese if applicable)",
        "lastName": "string (Japanese if applicable)",
        "firstNameKana": "string (Katakana)",
        "lastNameKana": "string (Katakana)",
        "email": "string",
        "phone": "string",
        "address": "string",
        "birthDate": "YYYY-MM-DD"
      },
      "education": [{ "schoolName": "string", "degree": "string", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "isCurrent": boolean }],
      "workExperience": [{ 
        "companyName": "string", 
        "position": "string", 
        "startDate": "YYYY-MM", 
        "endDate": "YYYY-MM", 
        "isCurrent": boolean, 
        "description": "string (Detailed job description in polite Japanese business Keigo)",
        "achievements": ["string (List of key achievements in Japanese)"]
      }],
      "skills": ["string (List of skills)"],
      "certifications": ["string"],
      "languages": [{ "language": "string", "level": "string" }],
      "professionalSummary": "string (A professional summary in Japanese, suitable for Shokumu Keirekisho header)",
      "selfPromotion": "string (A strong self-promotion 'Jiko PR' text in Japanese, approx 200-300 characters)"
    }

    INPUT DATA:
    User Profile: ${JSON.stringify(userProfileWithoutPhoto)}
    ${request.structuredData 
      ? `Structured Data (Manual Input): ${JSON.stringify(request.structuredData)}`
      : `Resume Text (OCR): ${request.currentResumeText || "None"}`
    }
    
    IMPORTANT:
    - Translate everything into natural, professional business Japanese suitable for a Japanese company.
    - If Structured Data is provided, treat it as the primary source of truth. Translate and Refine it.
    - If specific details are missing, leave them as empty strings or reasonable placeholders, but try to infer from context.
    - Ensure 'selfPromotion' (Jiko PR) is very persuasive and culturally appropriate for Japan.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // JSON形式の文字列を抽出するためのクリーニング (Markdownのコードブロック記号を除去)
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();

      return JSON.parse(text) as ResumeData;
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}

// ---------------------------------------------------------
// OpenAI Implementation (Backup)
// ---------------------------------------------------------
export class OpenAIService implements AIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateResume(request: GenerateResumeRequest): Promise<ResumeData> {
    console.log("OpenAI generating resume...");
    // ... (OpenAI implementation omitted for brevity but kept in structure if needed)
    throw new Error("OpenAI implementation is currently disabled in favor of Gemini.");
  }
}

// ---------------------------------------------------------
// Mock Implementation (ダミーデータ生成)
// ---------------------------------------------------------
export class MockAIService implements AIService {
  async generateResume(request: GenerateResumeRequest): Promise<ResumeData> {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("Mock AI generating resume for:", request);
    return {
      basicInfo: {
        firstName: request.userProfile?.firstName || "Taro",
        lastName: request.userProfile?.lastName || "Yamada",
        firstNameKana: "タロウ",
        lastNameKana: "ヤマダ",
        email: request.userProfile?.email || "taro.yamada@example.com",
        phone: "090-1234-5678",
        address: "Tokyo, Japan",
        birthDate: "1990-01-01",
      },
      education: [
        {
          schoolName: "Indian Institute of Technology (IIT), Delhi",
          degree: "Bachelor of Technology in Computer Science",
          startDate: "2010-08",
          endDate: "2014-06",
          isCurrent: false,
        },
      ],
      workExperience: [
        {
          companyName: "Tech Solutions Inc.",
          position: "Senior Software Engineer",
          startDate: "2018-01",
          isCurrent: true,
          description:
            "クラウドベースのCRMシステムの開発をリード。ReactとNode.jsを使用。",
          achievements: [
            "コード最適化によりシステムパフォーマンスを30%向上",
            "アジャイル開発手法を用いてジュニアエンジニアを指導",
          ],
        },
      ],
      skills: ["JavaScript/TypeScript", "React", "Node.js", "AWS", "Python"],
      certifications: ["AWS Certified Solutions Architect"],
      languages: [
        { language: "English", level: "Native" },
        { language: "Japanese", level: "Conversational (N4)" },
      ],
      professionalSummary:
        "8年以上のフルスタック開発経験を持つソフトウェアエンジニア。スケーラブルなソリューションの提供とチームリーダーシップに実績あり。",
      selfPromotion:
        "技術への情熱と異文化コミュニケーション能力を活かし、日本の開発チームに貢献したいと考えています。",
    };
  }
}

// ---------------------------------------------------------
// Factory (ここで切り替える)
// ---------------------------------------------------------
export function getAIService(): AIService {
  // Gemini APIキーがあれば Gemini を使う (優先)
  if (process.env.GEMINI_API_KEY) {
    return new GeminiService();
  }
  // OpenAI APIキーがあれば OpenAI を使う
  if (process.env.OPENAI_API_KEY) {
    // return new OpenAIService(); // 今回はGemini優先のためコメントアウト、必要なら復活
  }
  
  // キーがなければ Mock を使う
  console.warn("API Key not found. Using Mock Service.");
  return new MockAIService();
}
