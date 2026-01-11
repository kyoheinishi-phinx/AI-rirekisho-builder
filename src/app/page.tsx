"use client";

import Image from "next/image";
import { useState, useRef } from "react"; // useRefを追加
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, CheckCircle, Loader2, Download, X } from "lucide-react";
import { ResumeData } from "@/types/resume";
import dynamic from "next/dynamic";

// クライアントサイドでのみレンダリングするためにdynamic importを使用
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  {
    ssr: false,
    loading: () => <p>Loading PDF...</p>,
  }
);
import { ResumePDF } from "@/components/pdf/ResumePDF";

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generatedData, setGeneratedData] = useState<ResumeData | null>(null);
  const [resumeText, setResumeText] = useState("");
  
  // 顔写真のプレビュー用state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // ファイル入力への参照
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // PDFアップロード処理
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/extract-text", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      
      if (data.success) {
        setResumeText(data.text);
        alert("Resume uploaded and text extracted successfully!");
      } else {
        alert("Failed to extract text from PDF");
      }
    } catch (error) {
      console.error(error);
      alert("Error uploading file");
    } finally {
      setIsUploading(false);
    }
  };

  // 顔写真アップロード処理
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 画像ファイルかチェック
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (JPG, PNG).");
      return;
    }

    // 5MB制限チェック (簡易)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotoPreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  // 履歴書生成処理
  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedData(null);
    
    try {
      // APIを呼び出す
      const response = await fetch("/api/generate-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userProfile: {
             firstName: "Taro",
             lastName: "Yamada",
             photoBase64: photoPreview // 顔写真データを渡す
          },
          currentResumeText: resumeText // 抽出したテキストを送信
        }),
      });

      const data = await response.json();
      if (data.success) {
        // AIが生成したデータに、クライアント側で持っている写真データを結合する
        // (AIは写真データを返さない場合があるため、ここで補完する)
        const finalData = {
          ...data.data,
          basicInfo: {
            ...data.data.basicInfo,
            photoBase64: photoPreview || data.data.basicInfo.photoBase64
          }
        };
        setGeneratedData(finalData);
      } else {
        // エラー詳細を表示するように変更
        alert(`Failed to generate resume: ${data.details || "Unknown error"}`);
      }
    } catch (error) {
      console.error(error);
      alert(`An error occurred: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
              AI
            </div>
            <h1 className="text-xl font-bold text-gray-800">Japan Resume Builder</h1>
          </div>
          <nav>
            <Button variant="ghost" className="text-sm">English / 日本語</Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Create Your Japanese Resume with AI
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Upload your English resume or enter your details, and our AI will generate a professional Japanese "Rirekisho" (Resume) and "Shokumu Keirekisho" (CV).
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Form Area */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Enter your basic information as it should appear on your resume.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="Kyohei" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Nishi" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="example@email.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo">Face Photo</Label>
                  
                  {photoPreview ? (
                    <div className="relative w-32 h-40 mx-auto border rounded-lg overflow-hidden group">
                      <Image 
                        src={photoPreview} 
                        alt="Face Photo Preview" 
                        fill 
                        className="object-cover" 
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button 
                           variant="destructive" 
                           size="icon" 
                           onClick={handleRemovePhoto}
                           className="h-8 w-8"
                         >
                           <X className="h-4 w-4" />
                         </Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 cursor-pointer transition-colors relative"
                      onClick={() => photoInputRef.current?.click()} // 明示的にクリックイベントをハンドリング
                    >
                      <input 
                        ref={photoInputRef}
                        type="file" 
                        accept="image/*" 
                        className="hidden" // hiddenクラスで隠し、親要素クリックで発火させる方式に変更
                        onChange={handlePhotoUpload}
                      />
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload or drag & drop</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resume Data</CardTitle>
                <CardDescription>
                  Upload your existing English resume to auto-fill details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                    <div 
                      className="border-2 border-dashed border-blue-200 bg-blue-50 rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-100 transition-colors relative"
                      onClick={() => pdfInputRef.current?.click()} // 明示的にクリックイベントをハンドリング
                    >
                      <input 
                        ref={pdfInputRef}
                        type="file" 
                        accept=".pdf" 
                        className="hidden" // hiddenクラスで隠し、親要素クリックで発火させる方式に変更
                        onChange={handleFileUpload}
                      />
                      {isUploading ? (
                        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-3" />
                      ) : (
                        <FileText className="h-10 w-10 text-blue-600 mb-3" />
                      )}
                      <h3 className="font-semibold text-blue-900">
                        {isUploading ? "Processing..." : "Upload English Resume (PDF)"}
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">AI will analyze and translate your skills</p>
                    </div>
                    
                    <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-gray-200"></div>
                      <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase">Or enter manually</span>
                      <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="summary">Professional Summary / Skills</Label>
                      <Textarea 
                        id="summary" 
                        placeholder="I have 5 years of experience in..." 
                        className="min-h-[150px]" 
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                      />
                    </div>
                 </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full text-lg py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Japanese Resume"
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            {/* Result Preview (Temporary) */}
            {generatedData && (
              <Card className="mt-6 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800 flex justify-between items-center">
                    <span>Success! Resume Generated</span>
                    <PDFDownloadLink
                      document={<ResumePDF data={generatedData} />}
                      fileName="japanese_resume.pdf"
                    >
                      {/* @ts-ignore - PDFDownloadLink children type mismatch workaround */}
                      {({ blob, url, loading, error }) => (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                          {loading ? (
                            "Preparing PDF..."
                          ) : (
                            <>
                              <Download className="mr-2 h-4 w-4" /> Download PDF
                            </>
                          )}
                        </Button>
                      )}
                    </PDFDownloadLink>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-green-900">Preview Data:</h4>
                      <p className="text-sm text-green-800">
                        {generatedData.basicInfo.firstName} {generatedData.basicInfo.lastName}
                      </p>
                    </div>
                    <pre className="text-xs bg-white p-4 rounded border overflow-auto max-h-60">
                      {JSON.stringify(generatedData, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar / Info */}
          <div className="space-y-6">
            <Card className="bg-white/50 border-none shadow-none md:shadow-sm md:bg-white md:border">
              <CardHeader>
                <CardTitle className="text-lg">Why use this?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <strong className="block text-gray-800">Japanese Format</strong>
                    Standard format accepted by Japanese companies.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <strong className="block text-gray-800">AI Translation</strong>
                    Natural business Japanese translation.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <strong className="block text-gray-800">Privacy First</strong>
                    Your data is secure and not shared publicly.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
