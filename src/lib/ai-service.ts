import { ResumeData, GenerateResumeRequest } from "@/types/resume";
import OpenAI from "openai";

// AIサービスのインターフェース
export interface AIService {
  generateResume(request: GenerateResumeRequest): Promise<ResumeData>;
}

// ---------------------------------------------------------
// OpenAI Implementation (本物のAI)
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

    const prompt = `
    You are an expert Japanese resume writer.
    Please convert the following user information into a structured Japanese Resume (Rirekisho) and Curriculum Vitae (Shokumu Keirekisho) data.
    
    The output MUST be a valid JSON object matching this schema:
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
    User Profile: ${JSON.stringify(request.userProfile)}
    Resume Text (OCR): ${request.currentResumeText || "None"}
    
    IMPORTANT:
    - Translate everything into natural, professional business Japanese suitable for a Japanese company.
    - If specific details are missing, leave them as empty strings or reasonable placeholders, but try to infer from context.
    - Ensure 'selfPromotion' (Jiko PR) is very persuasive and culturally appropriate for Japan.
    `;

    try {
      const completion = await this.client.chat.completions.create({
        model: "gpt-4o", // コストを抑えるなら "gpt-4o-mini" に変更可能
        messages: [
          { role: "system", content: "You are a helpful assistant that generates JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error("No content received from OpenAI");
      }

      return JSON.parse(content) as ResumeData;
    } catch (error) {
      console.error("OpenAI API Error:", error);
      throw error;
    }
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
  // APIキーが環境変数に設定されていれば OpenAI を使う
  if (process.env.OPENAI_API_KEY) {
    return new OpenAIService();
  }
  // なければ Mock を使う
  console.warn("OPENAI_API_KEY not found. Using Mock Service.");
  return new MockAIService();
}
