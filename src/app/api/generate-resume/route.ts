import { NextRequest, NextResponse } from "next/server";
import { getAIService } from "@/lib/ai-service";
import { GenerateResumeRequest } from "@/types/resume";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const requestData: GenerateResumeRequest = body;

    // AIサービスを取得
    const aiService = getAIService();
    
    // 生成処理実行
    const resumeData = await aiService.generateResume(requestData);

    return NextResponse.json({ success: true, data: resumeData });
  } catch (error: any) { // errorをany型として扱うか、適切な型ガードを入れる
    console.error("Error generating resume:", error);
    
    // エラーの詳細をクライアントに返すように修正
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to generate resume",
        details: error?.message || String(error) // エラーメッセージを含める
      },
      { status: 500 }
    );
  }
}
