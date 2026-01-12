import { NextRequest, NextResponse } from "next/server";
import { getAIService } from "@/lib/ai-service";
import { GenerateResumeRequest } from "@/types/resume";
import { kv } from "@vercel/kv";

export async function POST(req: NextRequest) {
  try {
    // ---------------------------------------------------------
    // Rate Limiting (1日30回制限)
    // ---------------------------------------------------------
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const key = `resume_generation_count:${date}`;
      const limit = 30;

      try {
        const count = await kv.incr(key);
        
        // 初回カウント時に有効期限を設定 (24時間)
        if (count === 1) {
          await kv.expire(key, 60 * 60 * 24);
        }

        if (count > limit) {
          return NextResponse.json(
            { 
              success: false, 
              error: "Daily limit reached", 
              details: "本日のAI生成回数上限(30回)に達しました。明日またお試しください。" 
            },
            { status: 429 }
          );
        }
      } catch (kvError) {
        console.warn("Vercel KV Error (Rate Limit check skipped):", kvError);
        // KVのエラーで生成自体を止めるべきではない場合はスルーするが、
        // 今回はコスト管理が目的なのでログを出しておく。
      }
    }

    const body = await req.json();
    const requestData: GenerateResumeRequest = body;

    // AIサービスを取得
    const aiService = getAIService();
    
    // 生成処理実行
    const resumeData = await aiService.generateResume(requestData);

    return NextResponse.json({ success: true, data: resumeData });
  } catch (error: any) { // errorをany型として扱うか、適切な型ガードを入れる
    console.error("Error generating resume:", error);
    
    // エラーの詳細をクライアントに返す
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to generate resume",
        details: error?.message || String(error) 
      },
      { status: 500 }
    );
  }
}
