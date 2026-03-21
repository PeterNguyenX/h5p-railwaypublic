import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { 
  ArrowLeft, CheckCircle2, ChevronRight, UploadCloud, Youtube, 
  Video, Sparkles, Plus, Play, Info, Share2, Save, X, Lightbulb
} from "lucide-react";

export default function Editor() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [youtubeLink, setYoutubeLink] = useState("");
  const [activeUploadTab, setActiveUploadTab] = useState("file");

  // AI Enrichment state
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [showAiModal, setShowAiModal] = useState(false);

  const steps = [
    { id: 1, name: "1. Add Video", desc: "Upload or link" },
    { id: 2, name: "2. Add Interactions", desc: "Questions & info" },
    { id: 3, name: "3. Finish & Share", desc: "Preview & export" }
  ];

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const runAiEnrichment = () => {
    setIsAiRunning(true);
    setTimeout(() => {
      setIsAiRunning(false);
      setAiSuggestions([
        { id: 1, time: "02:15", type: "Multiple Choice", title: "What is photosynthesis?", accepted: true },
        { id: 2, time: "05:30", type: "True/False", title: "Plants breathe oxygen.", accepted: false },
        { id: 3, time: "08:45", type: "Text Info", title: "Key vocabulary", accepted: true },
      ]);
      setShowAiModal(true);
    }, 2000);
  };

  const toggleSuggestion = (id: number) => {
    setAiSuggestions(prev => prev.map(s => s.id === id ? { ...s, accepted: !s.accepted } : s));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 overflow-hidden">
      {/* Editor Header / Stepper */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/app/dashboard")}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-slate-300 hidden sm:block"></div>
          <h2 className="text-xl font-bold text-slate-800">New Interactive Video</h2>
          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md">Draft</span>
        </div>

        {/* Stepper */}
        <div className="hidden md:flex items-center gap-2">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                currentStep === step.id 
                  ? "bg-blue-50 text-blue-800" 
                  : currentStep > step.id 
                    ? "text-slate-700" 
                    : "text-slate-400"
              }`}>
                {currentStep > step.id ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep === step.id ? "bg-blue-800 text-white" : "bg-slate-200 text-slate-500"
                  }`}>
                    {step.id}
                  </span>
                )}
                <div className="flex flex-col">
                  <span className="font-bold text-sm leading-none">{step.name.split(". ")[1]}</span>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-300 mx-2" />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors text-[15px] flex items-center gap-2 border border-transparent hover:border-slate-200">
            <Save className="w-4 h-4" />
            Save Draft
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex justify-center w-full">
        <div className="w-full max-w-4xl h-full flex flex-col">
          
          {/* Step 1: Upload */}
          {currentStep === 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center max-w-xl mx-auto mb-10">
                <h1 className="text-3xl font-bold text-slate-900 mb-4">Let's add your video</h1>
                <p className="text-slate-600 text-lg">
                  Start by uploading a video file from your computer or pasting a YouTube link.
                </p>
              </div>

              {/* Upload Tabs */}
              <div className="flex justify-center mb-8">
                <div className="inline-flex bg-slate-100 p-1.5 rounded-xl">
                  <button 
                    onClick={() => setActiveUploadTab("file")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-[15px] transition-all ${
                      activeUploadTab === "file" 
                        ? "bg-white text-blue-900 shadow-sm" 
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <UploadCloud className="w-5 h-5" />
                    Upload File
                  </button>
                  <button 
                    onClick={() => setActiveUploadTab("youtube")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-[15px] transition-all ${
                      activeUploadTab === "youtube" 
                        ? "bg-white text-blue-900 shadow-sm" 
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Youtube className="w-5 h-5" />
                    YouTube Link
                  </button>
                </div>
              </div>

              {/* Upload Content */}
              {activeUploadTab === "file" ? (
                <div className="border-2 border-dashed border-slate-300 bg-slate-50/50 rounded-2xl p-12 text-center hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer group">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300 border border-slate-200">
                    <UploadCloud className="w-10 h-10 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Click to upload video</h3>
                  <p className="text-slate-500 mb-6">MP4, WebM, or OGG up to 500MB</p>
                  <button className="px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors text-[15px]">
                    Browse Files
                  </button>
                </div>
              ) : (
                <div className="max-w-xl mx-auto">
                  <label className="block text-[15px] font-bold text-slate-700 mb-2">Paste YouTube URL</label>
                  <div className="flex gap-3">
                    <input 
                      type="url" 
                      value={youtubeLink}
                      onChange={(e) => setYoutubeLink(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="flex-1 px-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[15px]"
                    />
                    <button 
                      onClick={() => setYoutubeLink("loaded")}
                      className="px-6 py-3.5 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl transition-colors text-[15px] whitespace-nowrap shadow-sm"
                    >
                      Import Video
                    </button>
                  </div>
                  {youtubeLink === "loaded" && (
                    <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-slate-700 shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-900">Video successfully imported!</h4>
                        <p className="text-slate-600 text-sm mt-1">"Introduction to Cell Biology" (14:20)</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Next Step Action */}
              <div className="mt-12 flex justify-end">
                <button 
                  onClick={handleNext}
                  disabled={activeUploadTab === "youtube" && youtubeLink !== "loaded"}
                  className="px-8 py-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-sm transition-all text-lg flex items-center gap-2"
                >
                  Continue to Add Interactions
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Edit / Add Interactions */}
          {currentStep === 2 && (
            <div className="flex flex-col h-full gap-6 animate-in fade-in slide-in-from-right-8 duration-500">
              
              {/* Video Preview Area */}
              <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-200 relative aspect-video flex-shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1544191046-397b734b0891?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZHVjYXRpb24lMjBjbGFzc3Jvb20lMjB0ZWFjaGVyfGVufDF8fHx8MTc3MzU1MjQ2MHww&ixlib=rb-4.1.0&q=80&w=1080" 
                  alt="Video frame" 
                  className="w-full h-full object-cover opacity-80"
                />
                
                {/* Simulated Interaction dots on timeline */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                  <div className="relative h-2 bg-white/30 rounded-full mb-4 cursor-pointer">
                    <div className="absolute left-0 top-0 h-full bg-blue-500 rounded-full w-1/3"></div>
                    {/* Interaction Markers */}
                    <div className="absolute top-1/2 -translate-y-1/2 left-[20%] w-4 h-4 bg-orange-500 border-2 border-white rounded-full shadow-sm hover:scale-125 transition-transform cursor-pointer"></div>
                    <div className="absolute top-1/2 -translate-y-1/2 left-[45%] w-4 h-4 bg-orange-500 border-2 border-white rounded-full shadow-sm hover:scale-125 transition-transform cursor-pointer"></div>
                  </div>
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-4">
                      <button className="hover:text-blue-200 transition-colors">
                        <Play className="w-6 h-6 fill-current" />
                      </button>
                      <span className="font-medium text-sm">04:45 / 14:20</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tools Area */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
                
                {/* Left Panel: Manual Add */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col h-full overflow-y-auto shadow-sm">
                  <h3 className="font-bold text-slate-800 text-lg mb-4">Add Content</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Info, label: "Text Info" },
                      { icon: Lightbulb, label: "Multiple Choice" },
                      { icon: CheckCircle2, label: "True / False" },
                      { icon: Plus, label: "Fill in Blanks" }
                    ].map((btn, i) => (
                      <button key={i} className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-800 transition-all text-slate-700 font-semibold text-sm group">
                        <btn.icon className="w-6 h-6 text-slate-500 group-hover:text-blue-700 transition-colors" />
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Panels: AI Enrichment */}
                <div className="md:col-span-2 bg-blue-50/50 border border-blue-100 rounded-2xl p-8 text-slate-800 flex flex-col justify-center items-center text-center shadow-sm relative overflow-hidden">
                  
                  <div className="bg-white p-4 rounded-full mb-6 border border-blue-100 shadow-sm">
                    <Sparkles className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-900">Save time with AI Suggestions</h3>
                  <p className="text-slate-600 mb-8 max-w-md text-lg">
                    We can automatically generate interactive questions by analyzing your video transcript.
                  </p>
                  
                  {isAiRunning ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                      <p className="font-bold text-lg text-slate-700">Analyzing transcript...</p>
                    </div>
                  ) : (
                    <button 
                      onClick={runAiEnrichment}
                      className="px-8 py-4 bg-white border border-blue-200 text-blue-800 hover:bg-blue-50 font-bold rounded-xl shadow-sm transition-all text-lg flex items-center gap-3"
                    >
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      Run AI Suggestions
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-200 mt-auto">
                <button 
                  onClick={handleBack}
                  className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors text-[15px]"
                >
                  Back
                </button>
                <button 
                  onClick={handleNext}
                  className="px-8 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-sm transition-all text-[15px] flex items-center gap-2"
                >
                  Continue to Finish
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Finish & Share */}
          {currentStep === 3 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 animate-in fade-in slide-in-from-right-8 duration-500 text-center max-w-2xl mx-auto w-full">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-200 shadow-sm">
                <CheckCircle2 className="w-12 h-12 text-slate-700" />
              </div>
              
              <h1 className="text-3xl font-bold text-slate-900 mb-4">Your video is ready!</h1>
              <p className="text-slate-600 text-lg mb-10">
                You've successfully added 3 interactions to "Introduction to Biology". Choose how you want to share it with your students.
              </p>

              <div className="space-y-4 mb-12 text-left">
                {/* Option 1 */}
                <div className="p-6 border-2 border-blue-900 bg-slate-50 rounded-2xl relative cursor-pointer flex gap-5 items-start transition-all shadow-sm">
                  <div className="absolute top-4 right-4 w-6 h-6 bg-blue-900 rounded-full flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                  </div>
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 shrink-0">
                    <Share2 className="w-7 h-7 text-blue-900" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">Share Direct Link</h3>
                    <p className="text-slate-600 text-[15px]">
                      Get a simple web link you can email to students or post anywhere.
                    </p>
                  </div>
                </div>

                {/* Option 2 */}
                <div className="p-6 border border-slate-200 bg-white rounded-2xl relative cursor-pointer flex gap-5 items-start hover:border-slate-300 hover:bg-slate-50 transition-all">
                  <div className="absolute top-4 right-4 w-6 h-6 border-2 border-slate-300 rounded-full"></div>
                  <div className="p-3 bg-slate-100 rounded-xl shrink-0 border border-slate-200">
                    <BookOpenIcon className="w-7 h-7 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">Export for LMS (LTI)</h3>
                    <p className="text-slate-500 text-[15px]">
                      Export standard package for Canvas, Blackboard, or Moodle.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button 
                  onClick={handleBack}
                  className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors text-[15px]"
                >
                  Back to Editor
                </button>
                <button 
                  onClick={() => navigate("/app/dashboard")}
                  className="px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-sm transition-all text-lg flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Publish Video
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* AI Suggestions Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="bg-white border border-slate-200 p-2 rounded-lg shadow-sm">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Review Suggested Activities</h3>
                  <p className="text-sm text-slate-600">Select the ones you want to keep.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAiModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-white flex-1">
              <div className="space-y-4">
                {aiSuggestions.map((sug) => (
                  <div 
                    key={sug.id} 
                    className={`flex items-start gap-4 p-5 rounded-xl border transition-all cursor-pointer ${
                      sug.accepted 
                        ? "border-blue-900 bg-slate-50 shadow-sm" 
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    onClick={() => toggleSuggestion(sug.id)}
                  >
                    <div className={`mt-1 flex items-center justify-center w-6 h-6 rounded-md border shrink-0 ${
                      sug.accepted ? "bg-blue-900 border-blue-900" : "border-slate-300 bg-white"
                    }`}>
                      {sug.accepted && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-md">{sug.time}</span>
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">{sug.type}</span>
                      </div>
                      <p className="font-bold text-slate-900 text-[17px]">{sug.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setShowAiModal(false)}
                className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors text-[15px]"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowAiModal(false)}
                className="px-8 py-3 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl shadow-sm transition-all text-[15px]"
              >
                Apply {aiSuggestions.filter(s => s.accepted).length} Interactions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookOpenIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
