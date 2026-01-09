// 履歴書のデータ構造定義

export interface ResumeData {
  basicInfo: {
    firstName: string;
    lastName: string;
    firstNameKana?: string; // フリガナ (AI生成)
    lastNameKana?: string;  // フリガナ (AI生成)
    email: string;
    phone?: string;
    address?: string;
    birthDate?: string;
    gender?: string;
  };
  education: Education[];
  workExperience: WorkExperience[];
  skills: string[];
  certifications: string[];
  languages: Language[];
  professionalSummary: string; // 職務要約 (Shokumu Keirekisho用)
  selfPromotion: string;       // 自己PR (Rirekisho用)
}

export interface Education {
  schoolName: string;
  degree?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
}

export interface WorkExperience {
  companyName: string;
  position: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description: string; // 職務詳細
  achievements?: string[]; // 実績リスト
}

export interface Language {
  language: string;
  level: string; // Native, Business, Conversational etc.
}

// AI生成リクエストの型
export interface GenerateResumeRequest {
  currentResumeText?: string; // OCR等で抽出したテキスト
  userProfile?: Partial<ResumeData['basicInfo']>;
  jobDescription?: string; // 応募先JD (あれば最適化に使用)
}

