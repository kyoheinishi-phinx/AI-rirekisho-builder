import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";

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

