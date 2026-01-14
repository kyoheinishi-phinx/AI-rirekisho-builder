"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GraduationCap, Briefcase, Award, Languages, Sparkles, X } from "lucide-react";
import { Education, WorkExperience, Language, ResumeData } from "@/types/resume";

interface ManualFormProps {
  formData: Partial<ResumeData>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<ResumeData>>>;
}

const LANGUAGE_LEVELS = [
  "Native",
  "Fluent",
  "Business",
  "Conversational",
  "Basic",
  "Beginner"
];

const JAPANESE_LEVELS = [
  "Native",
  "N1 (Advanced)",
  "N2 (Pre-Advanced)",
  "N3 (Intermediate)",
  "N4 (Elementary)",
  "N5 (Basic)"
];

const LANGUAGES_LIST = [
  "English", "Japanese", "Chinese", "Spanish", "Hindi", "French", "Korean", "Vietnamese", "Thai", "Indonesian", "Malay", "Tagalog"
];

export function ManualForm({ formData, setFormData }: ManualFormProps) {
  const [activeTab, setActiveTab] = useState<"education" | "work" | "skills">("education");
  const [skillInput, setSkillInput] = useState("");

  // Helper to update specific fields
  const updateEducation = (index: number, field: keyof Education, value: any) => {
    const newEducation = [...(formData.education || [])];
    if (!newEducation[index]) return;
    (newEducation[index] as any)[field] = value;
    setFormData({ ...formData, education: newEducation });
  };

  const addEducation = () => {
    setFormData({
      ...formData,
      education: [
        ...(formData.education || []),
        { schoolName: "", degree: "", startDate: "", endDate: "", isCurrent: false }
      ]
    });
  };

  const removeEducation = (index: number) => {
    const newEducation = [...(formData.education || [])];
    newEducation.splice(index, 1);
    setFormData({ ...formData, education: newEducation });
  };

  const updateWork = (index: number, field: keyof WorkExperience, value: any) => {
    const newWork = [...(formData.workExperience || [])];
    if (!newWork[index]) return;
    (newWork[index] as any)[field] = value;
    setFormData({ ...formData, workExperience: newWork });
  };

  const addWork = () => {
    setFormData({
      ...formData,
      workExperience: [
        ...(formData.workExperience || []),
        { companyName: "", position: "", startDate: "", endDate: "", isCurrent: false, description: "" }
      ]
    });
  };

  const removeWork = (index: number) => {
    const newWork = [...(formData.workExperience || [])];
    newWork.splice(index, 1);
    setFormData({ ...formData, workExperience: newWork });
  };

  const addSkill = () => {
    if (!skillInput.trim()) return;
    setFormData({
      ...formData,
      skills: [...(formData.skills || []), skillInput.trim()]
    });
    setSkillInput("");
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const removeSkill = (index: number) => {
    const newSkills = [...(formData.skills || [])];
    newSkills.splice(index, 1);
    setFormData({ ...formData, skills: newSkills });
  };

  const addLanguage = () => {
    setFormData({
      ...formData,
      languages: [
        ...(formData.languages || []),
        { language: "", level: "" }
      ]
    });
  };

  const updateLanguage = (index: number, field: keyof Language, value: any) => {
    const newLanguages = [...(formData.languages || [])];
    if (!newLanguages[index]) return;
    
    // If language changes to Japanese, reset level to N-level compatible if needed
    // But simplified logic: just update
    (newLanguages[index] as any)[field] = value;
    setFormData({ ...formData, languages: newLanguages });
  };

  const removeLanguage = (index: number) => {
    const newLanguages = [...(formData.languages || [])];
    newLanguages.splice(index, 1);
    setFormData({ ...formData, languages: newLanguages });
  };

  const isJapanese = (lang: string) => {
    const l = lang.toLowerCase();
    return l === "japanese" || l === "nihongo" || l === "日本語";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab("education")}
          className={`px-1 py-2 text-xs sm:text-sm font-medium rounded-t-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 w-full ${
            activeTab === "education" ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <GraduationCap className="w-4 h-4" /> 
          <span>Education</span>
        </button>
        <button
          onClick={() => setActiveTab("work")}
          className={`px-1 py-2 text-xs sm:text-sm font-medium rounded-t-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 w-full ${
            activeTab === "work" ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Briefcase className="w-4 h-4" /> 
          <span className="text-center leading-tight">Work History</span>
        </button>
        <button
          onClick={() => setActiveTab("skills")}
          className={`px-1 py-2 text-xs sm:text-sm font-medium rounded-t-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 w-full ${
            activeTab === "skills" ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Award className="w-4 h-4" /> 
          <span className="text-center leading-tight">Skills & PR</span>
        </button>
      </div>

      <div className="bg-slate-50/50 rounded-xl p-2 sm:p-4 min-h-[300px]">
        {/* Education Section */}
        {activeTab === "education" && (
          <div className="space-y-4">
            {(formData.education || []).map((edu, index) => (
              <Card key={index} className="relative overflow-hidden border-indigo-100 shadow-sm">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-slate-400 hover:text-red-500" onClick={() => removeEducation(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6 flex flex-col gap-4">
                  <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 w-full">
                    <div className="space-y-2 w-full min-w-0">
                      <Label className="text-xs font-semibold text-slate-500">School / University</Label>
                      <Input 
                        placeholder="e.g. University of Tokyo" 
                        value={edu.schoolName} 
                        onChange={(e) => updateEducation(index, "schoolName", e.target.value)} 
                        className="bg-white min-w-0"
                      />
                    </div>
                    <div className="space-y-2 w-full min-w-0">
                      <Label className="text-xs font-semibold text-slate-500">Degree / Major</Label>
                      <Input 
                        placeholder="e.g. BS Computer Science" 
                        value={edu.degree || ""} 
                        onChange={(e) => updateEducation(index, "degree", e.target.value)}
                        className="bg-white min-w-0" 
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 w-full">
                    <div className="space-y-2 w-full min-w-0">
                      <Label className="text-xs font-semibold text-slate-500">Start Date</Label>
                      <Input 
                        type="month" 
                        lang="en" // Hint for English locale
                        value={edu.startDate} 
                        onChange={(e) => updateEducation(index, "startDate", e.target.value)}
                        className="bg-white min-w-0"
                      />
                    </div>
                    <div className="space-y-2 w-full min-w-0">
                      <Label className="text-xs font-semibold text-slate-500">End Date</Label>
                      <Input 
                        type="month" 
                        lang="en" // Hint for English locale
                        value={edu.endDate || ""} 
                        onChange={(e) => updateEducation(index, "endDate", e.target.value)}
                        disabled={edu.isCurrent}
                        className="bg-white min-w-0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button onClick={addEducation} variant="default" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Add Education
            </Button>
          </div>
        )}

        {/* Work Experience Section */}
        {activeTab === "work" && (
          <div className="space-y-4">
            {(formData.workExperience || []).map((work, index) => (
              <Card key={index} className="relative overflow-hidden border-indigo-100 shadow-sm">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-slate-400 hover:text-red-500" onClick={() => removeWork(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6 flex flex-col gap-4">
                  <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 w-full">
                    <div className="space-y-2 w-full min-w-0">
                      <Label className="text-xs font-semibold text-slate-500">Company Name</Label>
                      <Input 
                        placeholder="e.g. Google" 
                        value={work.companyName} 
                        onChange={(e) => updateWork(index, "companyName", e.target.value)} 
                        className="bg-white min-w-0"
                      />
                    </div>
                    <div className="space-y-2 w-full min-w-0">
                      <Label className="text-xs font-semibold text-slate-500">Position / Title</Label>
                      <Input 
                        placeholder="e.g. Senior Engineer" 
                        value={work.position} 
                        onChange={(e) => updateWork(index, "position", e.target.value)}
                        className="bg-white min-w-0" 
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 w-full">
                    <div className="space-y-2 w-full min-w-0">
                      <Label className="text-xs font-semibold text-slate-500">Start Date</Label>
                      <Input 
                        type="month" 
                        lang="en"
                        value={work.startDate} 
                        onChange={(e) => updateWork(index, "startDate", e.target.value)}
                        className="bg-white min-w-0"
                      />
                    </div>
                    <div className="space-y-2 w-full min-w-0">
                      <Label className="text-xs font-semibold text-slate-500">End Date</Label>
                      <Input 
                        type="month" 
                        lang="en"
                        value={work.endDate || ""} 
                        onChange={(e) => updateWork(index, "endDate", e.target.value)}
                        className="bg-white min-w-0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500">Description</Label>
                    <Textarea 
                      placeholder="Describe your responsibilities and achievements..." 
                      value={work.description} 
                      onChange={(e) => updateWork(index, "description", e.target.value)}
                      className="bg-white min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button onClick={addWork} variant="default" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Add Work Experience
            </Button>
          </div>
        )}

        {/* Skills & PR Section */}
        {activeTab === "skills" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Award className="w-4 h-4" /> Skills & Certifications
              </Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(formData.skills || []).map((skill, index) => (
                  <span key={index} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    {skill}
                    <button onClick={() => removeSkill(index)} className="hover:text-indigo-900 focus:outline-none">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="e.g. React"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  className="bg-white"
                />
                <Button onClick={addSkill} variant="outline" size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Languages className="w-4 h-4" /> Languages
              </Label>
              <div className="space-y-3">
                {(formData.languages || []).map((lang, index) => (
                   <div key={index} className="flex flex-col sm:flex-row gap-2 sm:items-center bg-white p-2 rounded-lg border border-slate-200">
                      <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
                        <div className="flex-1 min-w-0">
                          <Select 
                            value={lang.language} 
                            onValueChange={(val) => updateLanguage(index, "language", val)}
                          >
                            <SelectTrigger className="w-full border-0 focus-visible:ring-0 px-2 shadow-none">
                              <SelectValue placeholder="Language" />
                            </SelectTrigger>
                            <SelectContent>
                              {LANGUAGES_LIST.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Mobile delete button */}
                        <Button variant="ghost" size="icon" className="sm:hidden text-slate-400 hover:text-red-500 h-8 w-8 shrink-0" onClick={() => removeLanguage(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="w-full sm:w-[180px] border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-0">
                        <Select 
                          value={lang.level} 
                          onValueChange={(val) => updateLanguage(index, "level", val)}
                        >
                          <SelectTrigger className="w-full border-0 rounded-none shadow-none focus-visible:ring-0">
                            <SelectValue placeholder="Level" />
                          </SelectTrigger>
                          <SelectContent>
                            {isJapanese(lang.language) ? (
                               JAPANESE_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)
                            ) : (
                               LANGUAGE_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Desktop delete button */}
                      <Button variant="ghost" size="icon" className="hidden sm:flex text-slate-400 hover:text-red-500 h-8 w-8 shrink-0" onClick={() => removeLanguage(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                   </div>
                ))}
                <Button onClick={addLanguage} variant="outline" size="sm" className="w-full border-dashed text-slate-500">
                   <Plus className="w-3 h-3 mr-1" /> Add Language
                </Button>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Self Promotion / Motivation
              </Label>
              <Textarea 
                placeholder="Describe your strengths and motivation..."
                value={formData.selfPromotion}
                onChange={(e) => setFormData({...formData, selfPromotion: e.target.value})}
                className="bg-white min-h-[120px]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
