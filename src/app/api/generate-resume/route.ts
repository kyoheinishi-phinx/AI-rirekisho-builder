import { NextRequest, NextResponse } from "next/server";
import { getAIService } from "@/lib/ai-service";
import { GenerateResumeRequest } from "@/types/resume";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const requestData: GenerateResumeRequest = body;

    // AIサービス (現在はMock) を取得して実行
    const aiService = getAIService();
    const resumeData = await aiService.generateResume(requestData);

    return NextResponse.json({ success: true, data: resumeData });
  } catch (error) {
    console.error("Error generating resume:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate resume" },
      { status: 500 }
    );
  }
}

