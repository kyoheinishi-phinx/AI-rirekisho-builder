import { NextRequest, NextResponse } from "next/server";
import PDFParser from "pdf2json";

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

    // PDFParserを使ってテキスト抽出 (非同期処理)
    const text = await new Promise<string>((resolve, reject) => {
      // コンストラクタの引数を修正: 第二引数は boolean (enableRawOutput)
      const pdfParser = new PDFParser(null, true); 

      pdfParser.on("pdfParser_dataError", (errData: any) =>
        reject(errData.parserError)
      );

      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        // pdf2jsonの出力形式（raw）からテキストだけを抽出して繋げる
        const rawText = pdfParser.getRawTextContent();
        resolve(rawText);
      });

      // Bufferをパース実行
      pdfParser.parseBuffer(buffer);
    });

    return NextResponse.json({
      success: true,
      text: text,
    });
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    return NextResponse.json(
      { success: false, error: "Failed to extract text" },
      { status: 500 }
    );
  }
}
