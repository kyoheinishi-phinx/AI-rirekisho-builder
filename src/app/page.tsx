"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, CheckCircle, Loader2, Download, X, Sparkles, User, ChevronRight, Zap, Globe, FileDown, Pencil } from "lucide-react";
import { ResumeData } from "@/types/resume";
import { saveAs } from "file-saver";
import { generateResumeZip, checkMissingItems, MissingItems } from "@/lib/word-generator";
import { motion, AnimatePresence } from "framer-motion";
import { ManualForm } from "@/components/resume-form/ManualForm";

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generatedData, setGeneratedData] = useState<ResumeData | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [missingItems, setMissingItems] = useState<MissingItems | null>(null);
  const [isPdfUploaded, setIsPdfUploaded] = useState(false);
  
  // Basic Info State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  // Structured Form Data (for manual input)
  const [manualFormData, setManualFormData] = useState<Partial<ResumeData>>({
    education: [],
    workExperience: [],
    skills: [],
    selfPromotion: ""
  });
  const [inputMode, setInputMode] = useState<"pdf" | "manual">("pdf"); // Toggle between PDF upload and manual form

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // ZIPダウンロードハンドラー
  const handleDownloadZip = async () => {
    if (!generatedData) return;
    try {
      const { blob } = await generateResumeZip(generatedData);
      saveAs(blob, `Resume_Set_${generatedData.basicInfo.firstName}_${generatedData.basicInfo.lastName}.zip`);
    } catch (e) {
      console.error("ZIP generation error:", e);
      alert("Failed to generate resume ZIP file.");
    }
  };

  // プログレスバーのアニメーション制御
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 2;
        });
      }, 800);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // ファイルアップロードハンドラー
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/extract-text", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setResumeText(data.text);
        setIsPdfUploaded(true);
        setInputMode("pdf"); // Force PDF mode on successful upload
      } else {
        alert(`Failed to extract text from PDF: ${data.details || data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert(`Error uploading file: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUploading(false);
    }
  };

  // 写真アップロードハンドラー
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 写真削除ハンドラー
  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoPreview(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  // 履歴書生成ハンドラー
  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedData(null);
    setMissingItems(null);

    try {
      // Build the request body
      const requestBody: any = {
        userProfile: {
          firstName: firstName || "Taro", 
          lastName: lastName || "Yamada", 
          email: email || "taro.yamada@example.com",
          photoBase64: photoPreview
        }
      };

      if (inputMode === "pdf") {
        requestBody.currentResumeText = resumeText;
      } else {
        // Pass structured data if in manual mode
        requestBody.structuredData = manualFormData;
      }

      const response = await fetch("/api/generate-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (data.success) {
        setProgress(100);

        const finalData = {
          ...data.data,
          basicInfo: {
            ...data.data.basicInfo,
            photoBase64: photoPreview || data.data.basicInfo.photoBase64
          }
        };
        setGeneratedData(finalData);

        // 生成完了と同時に不足項目をチェックして表示
        const missing = checkMissingItems(finalData);
        setMissingItems(missing);

        setTimeout(() => {
          document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      } else {
        alert(`Failed to generate resume: ${data.details || "Unknown error"}`);
      }
    } catch (error) {
      console.error(error);
      alert(`An error occurred: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  // Check if form is valid enough to generate
  const isFormValid = () => {
    if (inputMode === "pdf") {
      return !!resumeText || !!photoPreview;
    } else {
      // In manual mode, check if at least one education or work experience is added, or self promotion
      const hasEducation = (manualFormData.education?.length || 0) > 0;
      const hasWork = (manualFormData.workExperience?.length || 0) > 0;
      const hasPR = !!manualFormData.selfPromotion;
      return hasEducation || hasWork || hasPR;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      {/* Navigation */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200"
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              Phinx Resume AI
            </span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200 shadow-sm">
              Beta
            </span>
          </div>
          {/* Link removed as requested */}
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-20 lg:pt-32 lg:pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
           <motion.div 
             animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
             transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
             className="absolute top-20 right-0 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
           ></motion.div>
           <motion.div 
             animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }}
             transition={{ duration: 12, repeat: Infinity, repeatType: "reverse", delay: 2 }}
             className="absolute top-40 left-0 w-72 h-72 bg-violet-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
           ></motion.div>
        </div>

        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="container mx-auto px-4 relative z-10 text-center"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-8 hover:bg-indigo-100 transition-colors cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Powered by JAAMP
          </motion.div>
          
          <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
            Get Hired in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600">Japan</span>
          </motion.h1>
            <motion.p variants={fadeInUp} className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Transform your English or Japanese resume into a professional, polished Japanese 
              <span className="font-semibold text-slate-800"> Rirekisho (履歴書)</span> and 
              <span className="font-semibold text-slate-800"> Shokumu Keirekisho (職務経歴書)</span>. 
              Our AI refines your existing Japanese or translates from English to business-level Japanese.
            </motion.p>
          
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="h-14 px-8 text-lg rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300 transition-all transform hover:-translate-y-1" 
              onClick={() => document.getElementById('generator-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Create Resume Now <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-sm text-slate-500 mt-4 sm:mt-0 font-medium">
              No registration required • Free for Beta
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How it works</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Generate professional Japanese documents in 3 simple steps</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-center hover:border-indigo-100 hover:shadow-lg transition-all"
            >
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 text-indigo-600">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">1. Upload</h3>
              <p className="text-slate-600 leading-relaxed">
                Upload your existing resume (English or Japanese) or simply paste your profile summary text.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-center hover:border-indigo-100 hover:shadow-lg transition-all"
            >
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 text-indigo-600">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">2. AI Optimization</h3>
              <p className="text-slate-600 leading-relaxed">
                Our AI translates English to Japanese or refines your Japanese text into professional business language.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-center hover:border-indigo-100 hover:shadow-lg transition-all"
            >
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 text-indigo-600">
                <FileDown className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">3. Download</h3>
              <p className="text-slate-600 leading-relaxed">
                Get your formatted Japanese Resume and CV as editable Word (.docx) files instantly.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Generator Section */}
      <section id="generator-section" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid lg:grid-cols-12 gap-12">
            
            {/* Left Column: Form */}
            <div className="lg:col-span-7 space-y-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">1</div>
                <h3 className="text-2xl font-bold text-slate-900">Input Your Details</h3>
              </div>

              {/* Basic Information Card */}
              <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
                <Card className="border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="bg-white border-b border-slate-100 pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5 text-indigo-600" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 bg-white">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                       {photoPreview ? (
                          <div className="relative w-32 h-40 border-2 border-slate-200 rounded-lg overflow-hidden group shadow-sm flex-shrink-0">
                            <Image src={photoPreview} alt="Preview" fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={handleRemovePhoto}>
                               <X className="w-8 h-8 text-white" />
                            </div>
                          </div>
                       ) : (
                          <div 
                            className="w-32 h-40 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-500 transition-all cursor-pointer flex-shrink-0"
                            onClick={() => photoInputRef.current?.click()}
                          >
                            <Upload className="w-8 h-8 mb-2" />
                            <span className="text-xs font-medium">Upload</span>
                            <span className="text-[10px] text-slate-400 mt-1">Max 4MB</span>
                            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                          </div>
                       )}
                       <div className="flex-1 space-y-3">
                          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-full">
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <Label htmlFor="firstName" className="text-xs uppercase text-slate-500 tracking-wider">First Name</Label>
                              <Input id="firstName" placeholder="Taro" className="bg-slate-50 border-slate-200 focus:border-indigo-300 transition-colors" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                            </div>
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <Label htmlFor="lastName" className="text-xs uppercase text-slate-500 tracking-wider">Last Name</Label>
                              <Input id="lastName" placeholder="Yamada" className="bg-slate-50 border-slate-200 focus:border-indigo-300 transition-colors" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                            </div>
                          </div>
                          <div className="space-y-1.5 w-full min-w-0">
                             <Label htmlFor="email" className="text-xs uppercase text-slate-500 tracking-wider">Email</Label>
                             <Input id="email" type="email" placeholder="taro.yamada@example.com" className="bg-slate-50 border-slate-200 focus:border-indigo-300 transition-colors" value={email} onChange={(e) => setEmail(e.target.value)} />
                          </div>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Resume Details: Tab Switcher (PDF / Manual) */}
              <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
                <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="bg-white border-b border-slate-100 pb-0 pt-4 px-2 sm:px-4">
                     <div className="flex items-center gap-6">
                        <button 
                          onClick={() => setInputMode("pdf")}
                          className={`flex items-center gap-2 pb-4 px-2 border-b-2 transition-all ${inputMode === "pdf" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                        >
                           <FileText className="w-4 h-4" />
                           <span className="font-semibold text-sm">Upload PDF</span>
                        </button>
                        <button 
                          onClick={() => setInputMode("manual")}
                          className={`flex items-center gap-2 pb-4 px-2 border-b-2 transition-all ${inputMode === "manual" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                        >
                           <Pencil className="w-4 h-4" />
                           <span className="font-semibold text-sm">Enter Manually</span>
                        </button>
                     </div>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-6 space-y-4 bg-white min-h-[300px]">
                    {inputMode === "pdf" ? (
                      /* PDF UPLOAD MODE */
                      <div className="animate-in fade-in zoom-in duration-300">
                         <div 
                            className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                              resumeText ? 'border-green-300 bg-green-50' : 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-400'
                            }`}
                            onClick={() => pdfInputRef.current?.click()}
                          >
                            <input ref={pdfInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
                            
                            {isUploading ? (
                              <div className="flex flex-col items-center animate-pulse">
                                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                                <p className="text-indigo-800 font-medium">Analyzing PDF...</p>
                              </div>
                            ) : (isPdfUploaded && resumeText) ? (
                              <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                                  <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                                <p className="text-green-800 font-medium text-lg">Resume Uploaded</p>
                                <p className="text-green-600 text-sm mt-1">Ready to translate</p>
                                <Button variant="ghost" size="sm" className="mt-2 text-green-700 hover:text-green-800 hover:bg-green-100" onClick={(e) => { e.stopPropagation(); setResumeText(""); setIsPdfUploaded(false); }}>
                                   Remove & Upload New
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                                   <Upload className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h4 className="text-lg font-semibold text-indigo-900">Drop your Resume PDF</h4>
                                <p className="text-indigo-600/80 text-sm mt-2 max-w-xs mx-auto">
                                  English or Japanese accepted. <br/>AI will extract and refine your experience.
                                </p>
                                <p className="text-indigo-400 text-xs mt-2">
                                  Max size: 4MB
                                </p>
                              </>
                            )}
                         </div>
                      </div>
                    ) : (
                      /* MANUAL FORM MODE */
                      <ManualForm formData={manualFormData} setFormData={setManualFormData} />
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Generate Button with Progress Bar */}
              <div className="space-y-2">
                 {isGenerating && (
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div 
                         className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                         style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                 )}
                 <Button 
                   onClick={handleGenerate} 
                   disabled={isGenerating || !isFormValid()}
                   className="w-full h-16 text-lg rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
                 >
                   {isGenerating ? (
                     <>
                       <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                       Generating... {progress}%
                     </>
                   ) : (
                     <>
                       <Sparkles className="mr-2 h-5 w-5" />
                       Generate Japanese Resume
                     </>
                   )}
                 </Button>
                 {isGenerating && (
                    <p className="text-center text-sm text-slate-500 animate-pulse">
                       AI is translating your experience into professional Japanese...
                    </p>
                 )}
                 {/* AI推論に関する免責事項 */}
                 <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800 mt-2 text-left">
                    <p className="font-bold mb-1 flex items-center"><span className="text-xl mr-1">💡</span> AI Note:</p>
                    <p className="text-xs opacity-90">
                      If the provided information is insufficient, AI may infer and supplement the content.
                      <br/>Please be sure to review and edit the content yourself before submission.
                    </p>
                 </div>
              </div>
            </div>

            {/* Right Column: Preview/Info */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg">2</div>
                <h3 className="text-2xl font-bold text-slate-900">Download Documents</h3>
              </div>

              <AnimatePresence mode="wait">
                {generatedData ? (
                  <motion.div 
                    key="result"
                    id="result-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white shadow-lg overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-10">
                          <FileText className="w-40 h-40 text-green-600" />
                       </div>
                       <CardHeader>
                          <CardTitle className="text-green-800 flex items-center gap-2">
                             <CheckCircle className="w-6 h-6 text-green-600" />
                             Generation Complete!
                          </CardTitle>
                          <CardDescription className="text-green-700">
                             Your professional Japanese resume is ready.
                          </CardDescription>
                       </CardHeader>
                       <CardContent className="relative z-10 space-y-6">
                          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-green-100 shadow-sm">
                             <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                   {generatedData.basicInfo.firstName[0]}
                                </div>
                                <div>
                                   <p className="font-bold text-slate-800">{generatedData.basicInfo.lastName} {generatedData.basicInfo.firstName}</p>
                                   <p className="text-xs text-slate-500">{generatedData.basicInfo.lastNameKana} {generatedData.basicInfo.firstNameKana}</p>
                                </div>
                             </div>
                             <div className="space-y-2">
                                <p className="text-sm text-slate-600 line-clamp-3 italic">"{generatedData.selfPromotion}"</p>
                             </div>
                          </div>
                          
                          <div className="flex flex-col gap-3">
                            {/* Main ZIP Download Button */}
                            <Button 
                               className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                               onClick={handleDownloadZip}
                             >
                                <FileText className="mr-2 h-5 w-5"/> Download Resume Set (.zip)
                             </Button>
                             <p className="text-xs text-center text-slate-500 mb-2">
                               Includes "Rirekisho.docx" and "ShokumuKeirekisho.docx"
                             </p>

                             {/* 不足項目の警告表示 */}
                             {missingItems && (Object.values(missingItems).some(v => v)) && (
                               <div className={`${Object.values(missingItems).filter(v => v).length >= 4 ? 'bg-red-50 border-red-200 text-red-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'} border rounded-md p-4 text-sm mt-2 text-left`}>
                                 <p className="font-bold mb-1 flex items-center">
                                   <span className="text-xl mr-1">{Object.values(missingItems).filter(v => v).length >= 4 ? '🚫' : '⚠️'}</span> 
                                   Missing Information:
                                 </p>
                                 {Object.values(missingItems).filter(v => v).length >= 4 ? (
                                   <>
                                     <p className="mb-2 text-xs opacity-90 font-bold">
                                       生成するには、あまりにも情報が不足しています。
                                     </p>
                                     <p className="mb-2 text-xs opacity-90">
                                       下記のページなどを参考にRirekishoとshokumukeirekisho の書き方を学んで必要項目を足してからお試しください:
                                     </p>
                                     <a 
                                       href="https://www.daijob.com/en/guide/tipsadvice/resume/" 
                                       target="_blank" 
                                       rel="noopener noreferrer" 
                                       className="text-xs font-bold underline hover:text-red-600 block mb-3"
                                     >
                                       Daijob.com - Resume Guide
                                     </a>
                                   </>
                                 ) : (
                                   <p className="mb-2 text-xs opacity-90">The following information is missing or incomplete. Please fill them in the Word file:</p>
                                 )}
                                 <ul className="list-disc list-inside space-y-1 ml-1 text-xs font-medium">
                                   {missingItems.birthDate && <li>Birth Date (生年月日)</li>}
                                   {missingItems.address && <li>Current Address (現住所)</li>}
                                   {missingItems.phone && <li>Phone Number (電話番号)</li>}
                                   {missingItems.email && <li>Email Address (メールアドレス)</li>}
                                   {missingItems.education && <li>Education History (学歴)</li>}
                                   {missingItems.workExperience && <li>Work Experience (職歴)</li>}
                                 </ul>
                               </div>
                             )}
                             
                             {/* 志望動機に関する注意書き (常に表示) */}
                             <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800 mt-2 text-left">
                                <p className="font-bold mb-1 flex items-center"><span className="text-xl mr-1">💡</span> AI Note:</p>
                                <p className="text-xs opacity-90 mb-2">
                                  The <strong>"Motivation (志望動機)"</strong> and <strong>"Self-Promotion (自己PR)"</strong> sections are drafts generated by AI based on your input.
                                </p>
                                <p className="text-xs opacity-90 font-bold mb-1">
                                  ⚠️ Important Disclaimer:
                                </p>
                                <p className="text-xs opacity-90">
                                  If your input is minimal (e.g., only titles/dates), the AI will generate content based on general assumptions to fill the required format. 
                                  <br/><strong>Please thoroughly review and edit the generated documents to ensure they accurately reflect your actual experience before submission.</strong>
                                </p>
                             </div>
                            
                            <Button 
                              variant="ghost" 
                              onClick={() => {
                                setGeneratedData(null);
                                setMissingItems(null);
                              }} 
                              className="w-full text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                            >
                               Create Another
                            </Button>
                          </div>
                       </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  /* Empty State / Benefits */
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="h-full"
                  >
                    <Card className="border-slate-200 shadow-sm h-full bg-white/50 backdrop-blur-sm">
                      <CardContent className="pt-8 h-full flex flex-col items-center justify-center text-center space-y-6 opacity-60">
                         <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-10 h-10 text-slate-400" />
                         </div>
                         <div className="space-y-2 max-w-xs">
                            <h4 className="text-xl font-semibold text-slate-700">Ready to Generate</h4>
                            <p className="text-slate-500">
                               Upload your details on the left to see the magic happen here.
                            </p>
                         </div>
                         <div className="grid grid-cols-2 gap-4 w-full pt-8">
                            <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                               <div className="w-2 h-2 rounded-full bg-indigo-500 mb-2"></div>
                               <p className="text-xs font-medium text-slate-600">Native Japanese</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                               <div className="w-2 h-2 rounded-full bg-indigo-500 mb-2"></div>
                               <p className="text-xs font-medium text-slate-600">JIS Format</p>
                            </div>
                         </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
         <div className="container mx-auto px-4 text-center">
            <p className="mb-4">&copy; {new Date().getFullYear()} Phinx Inc. All rights reserved.</p>
            <p className="text-sm opacity-50">Designed for international talent seeking opportunities in Japan.</p>
         </div>
      </footer>
    </div>
  );
}
