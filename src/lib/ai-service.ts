import { ResumeData, GenerateResumeRequest } from "@/types/resume";

// AIサービスのインターフェース
// これを守っていれば、MockでもOpenAIでもGeminiでも差し替え可能
export interface AIService {
  generateResume(request: GenerateResumeRequest): Promise<ResumeData>;
}

// ---------------------------------------------------------
// Mock Implementation (ダミーデータ生成)
// ---------------------------------------------------------
export class MockAIService implements AIService {
  async generateResume(request: GenerateResumeRequest): Promise<ResumeData> {
    // 実際のAPIコールの代わりに少し待機する (ローディング演出のため)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("Mock AI generating resume for:", request);

    // ダミーデータを返す
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
            "Led a team of 5 developers to build a cloud-based CRM system using React and Node.js.",
          achievements: [
            "Improved system performance by 30% via code optimization.",
            "Mentored junior developers in Agile practices.",
          ],
        },
        {
          companyName: "StartUp Hub",
          position: "Software Developer",
          startDate: "2014-07",
          endDate: "2017-12",
          isCurrent: false,
          description:
            "Developed responsive web applications for e-commerce clients.",
        },
      ],
      skills: ["JavaScript/TypeScript", "React", "Node.js", "AWS", "Python"],
      certifications: ["AWS Certified Solutions Architect"],
      languages: [
        { language: "English", level: "Native" },
        { language: "Japanese", level: "Conversational (N4)" },
      ],
      professionalSummary:
        "Experienced Software Engineer with over 8 years of expertise in full-stack web development. Proven track record of delivering scalable solutions and leading teams.",
      selfPromotion:
        "I am a proactive problem solver with a passion for technology and cross-cultural collaboration. I am eager to contribute my technical skills to a Japanese company.",
    };
  }
}

// ---------------------------------------------------------
// Factory (将来的にここで切り替える)
// ---------------------------------------------------------
export function getAIService(): AIService {
  // 環境変数などで切り替え可能にする予定
  // if (process.env.AI_PROVIDER === 'openai') return new OpenAIResumeService();
  return new MockAIService();
}

