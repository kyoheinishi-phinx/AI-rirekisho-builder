import { NextRequest, NextResponse } from "next/server";
// pdf-parse はCommonJS形式なので、import * as ... または require を使う必要がある場合がある
// ただしNext.js環境下での型定義の問題を回避するため、requireを使用するパターンに変更
const pdfParse = require("pdf-parse");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    // FileオブジェクトをBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // PDFからテキストを抽出
    const data = await pdfParse(buffer);

    return NextResponse.json({
      success: true,
      text: data.text,
      info: data.info,
    });
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    return NextResponse.json(
      { success: false, error: "Failed to extract text" },
      { status: 500 }
    );
  }
}
