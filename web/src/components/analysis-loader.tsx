import { FileSearch, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export function AnalysisLoader() {
  const steps = [
    "Lecture du fichier...",
    "Extraction du texte...",
    "Vectorisation des données...",
    "Préparation de l'assistant..."
  ];
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0d0d0d]">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <FileSearch size={28} className="text-violet-400" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[#0d0d0d] flex items-center justify-center">
            <Loader2 size={16} className="text-white/40 animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-medium text-white/90">Analyse en cours</h3>
          <p className="text-sm text-white/40 mt-1 transition-all duration-300">
            {steps[currentStep]}
          </p>
        </div>
      </div>
    </div>
  );
}