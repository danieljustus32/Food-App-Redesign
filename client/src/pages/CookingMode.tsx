import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { Mic, MicOff, Volume2, X, Play, CheckCircle, ChevronRight, Pause, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { isSaltOrPepper } from "@/lib/ingredientFilters";

interface SavedRecipe {
  id: string;
  externalId: number;
  source: string;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  summary: string;
  ingredients: string[];
  instructions: string[];
  tags: string[];
}

export default function CookingMode() {
  const [match, params] = useRoute("/cook/:id");
  const [, setLocation] = useLocation();
  const recipeId = params?.id;

  const { data: savedRecipes = [], isLoading } = useQuery<SavedRecipe[]>({
    queryKey: ["/api/cookbook"],
  });

  const recipe = savedRecipes.find(r => r.id === recipeId);

  const [steps, setSteps] = useState<{ type: 'ingredient' | 'instruction', text: string }[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const recognitionRef = useRef<any>(null);
  const handleNextStepRef = useRef<() => void>(() => {});
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentFetchAbortRef = useRef<AbortController | null>(null);
  const cookingActiveRef = useRef(false);

  const isListeningRef = useRef(isListening);
  const isSpeakingRef = useRef(isSpeaking);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  const repeatCurrentRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (recipe) {
      const allSteps = [
        ...recipe.ingredients.filter(ing => !isSaltOrPepper(ing)).map(ing => ({ type: 'ingredient' as const, text: ing })),
        ...recipe.instructions.map(inst => ({ type: 'instruction' as const, text: inst }))
      ];
      setSteps(allSteps);
    }
  }, [recipe]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.trim().toLowerCase();
          if (transcript.includes("repeat") || transcript.includes("again")) {
            repeatCurrentRef.current();
          } else if (transcript.includes("done") || transcript.includes("next") || transcript.includes("continue") || transcript.includes("ready")) {
            handleNextStepRef.current();
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current && !isSpeakingRef.current) {
          try { recognition.start(); } catch (e) { }
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      cookingActiveRef.current = false;
      if (recognitionRef.current) recognitionRef.current.stop();
      if (currentFetchAbortRef.current) currentFetchAbortRef.current.abort();
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!recognitionRef.current) return;
    if (isListening && !isSpeaking) {
      try { recognitionRef.current.start(); } catch (e) { }
    } else {
      try { recognitionRef.current.stop(); } catch (e) { }
    }
  }, [isListening, isSpeaking]);

  const speakWithBrowserFallback = useCallback((text: string, onEnd?: () => void) => {
    const synth = window.speechSynthesis;
    if (!synth) { onEnd?.(); return; }
    synth.cancel();
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => { setIsSpeaking(false); onEnd?.(); };
    utterance.onerror = () => { setIsSpeaking(false); };
    synth.speak(utterance);
  }, []);

  const cancelCurrentSpeech = useCallback(() => {
    if (currentFetchAbortRef.current) {
      currentFetchAbortRef.current.abort();
      currentFetchAbortRef.current = null;
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    cancelCurrentSpeech();

    const abortController = new AbortController();
    currentFetchAbortRef.current = abortController;

    setIsSpeaking(true);

    fetch("/api/voice/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: abortController.signal,
    })
      .then(async res => {
        if (!res.ok) throw new Error("TTS API failed");
        const blob = await res.blob();

        if (abortController.signal.aborted || !cookingActiveRef.current) {
          setIsSpeaking(false);
          return;
        }

        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        currentAudioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(url);
          currentAudioRef.current = null;
          setIsSpeaking(false);
          setTimeout(() => {
            if (cookingActiveRef.current) onEnd?.();
          }, 1500);
        };

        audio.onerror = () => {
          URL.revokeObjectURL(url);
          currentAudioRef.current = null;
          if (cookingActiveRef.current) speakWithBrowserFallback(text, onEnd);
          else setIsSpeaking(false);
        };

        audio.play().catch(() => {
          if (cookingActiveRef.current) speakWithBrowserFallback(text, onEnd);
          else setIsSpeaking(false);
        });
      })
      .catch(err => {
        if (err?.name === 'AbortError') {
          setIsSpeaking(false);
          return;
        }
        if (cookingActiveRef.current) speakWithBrowserFallback(text, onEnd);
        else setIsSpeaking(false);
      });
  }, [cancelCurrentSpeech, speakWithBrowserFallback]);

  const expandAbbreviations = (text: string): string =>
    text
      .replace(/\bfl\.?\s*oz\.?\b/gi, 'fluid ounce')
      .replace(/\btbsp\.?\b/gi, 'tablespoon')
      .replace(/\btbs\.?\b/gi, 'tablespoon')
      .replace(/\btsp\.?\b/gi, 'teaspoon')
      .replace(/\bkg\.?\b/gi, 'kilogram')
      .replace(/\bmg\.?\b/gi, 'milligram')
      .replace(/\bmL\.?\b/g, 'milliliter')
      .replace(/\bml\.?\b/gi, 'milliliter')
      .replace(/\blbs?\.?\b/gi, 'pound')
      .replace(/\boz\.?\b/gi, 'ounce')
      .replace(/\bqt\.?\b/gi, 'quart')
      .replace(/\bpt\.?\b/gi, 'pint')
      .replace(/\bgal\.?\b/gi, 'gallon')
      .replace(/(\d)\s*g\b/g, '$1 gram')
      .replace(/\bL\.?\b/g, 'liter')
      .replace(/\bcm\.?\b/gi, 'centimeter')
      .replace(/\bmm\.?\b/gi, 'millimeter')
      .replace(/(\d)\s*in\.?\b/g, '$1 inch')
      .replace(/\bhr\.?\b/gi, 'hour')
      .replace(/\bmin\.?\b/gi, 'minute')
      .replace(/\bpkg\.?\b/gi, 'package')
      .replace(/\bdeg\.?\b/gi, 'degree')
      .replace(/°F\b/g, 'degrees Fahrenheit')
      .replace(/°C\b/g, 'degrees Celsius');

  const getStepSpeechText = useCallback((index: number): string => {
    const step = steps[index];
    if (!step) return "";
    const expanded = expandAbbreviations(step.text);
    const isFirstIngredient = index === 0 && step.type === 'ingredient';
    const isFirstInstruction = step.type === 'instruction' && index > 0 && steps[index - 1]?.type === 'ingredient';
    if (isFirstIngredient) return `Measure the following ingredients: ${expanded}`;
    if (isFirstInstruction) return `Let's begin cooking: ${expanded}`;
    return expanded;
  }, [steps]);

  const startCooking = () => {
    cookingActiveRef.current = true;
    setHasStarted(true);
    setIsListening(true);
    speak(getStepSpeechText(0));
  };

  const stopCooking = useCallback(() => {
    cookingActiveRef.current = false;
    cancelCurrentSpeech();
    setHasStarted(false);
    setIsListening(false);
    setIsSpeaking(false);
    setIsFinished(false);
    setCurrentStepIndex(0);
  }, [cancelCurrentSpeech]);

  const handleNextStep = () => {
    setCurrentStepIndex(prev => {
      const nextIndex = prev + 1;
      if (nextIndex < steps.length) {
        speak(getStepSpeechText(nextIndex));
        return nextIndex;
      } else {
        setIsFinished(true);
        setIsListening(false);
        speak("You have completed all steps. Enjoy your meal!");
        return prev;
      }
    });
  };
  handleNextStepRef.current = handleNextStep;

  const handlePrevStep = () => {
    setCurrentStepIndex(prev => {
      const prevIndex = Math.max(0, prev - 1);
      speak(getStepSpeechText(prevIndex));
      return prevIndex;
    });
  };

  const toggleListening = () => setIsListening(!isListening);

  const repeatCurrent = () => speak(getStepSpeechText(currentStepIndex));
  repeatCurrentRef.current = repeatCurrent;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] bg-zinc-950 text-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  if (!recipe || !steps.length) {
    return (
      <div className="fixed inset-0 z-[100] bg-zinc-950 text-white flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-serif font-bold mb-4">Recipe not found</h2>
        <p className="text-zinc-400 mb-8">This recipe may have been removed from your cookbook.</p>
        <button onClick={() => setLocation("/cookbook")} className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-bold">
          Back to Cookbook
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 text-white flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-6 z-10">
        <button
          onClick={() => { stopCooking(); setLocation("/cookbook"); }}
          className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X size={24} />
        </button>
        <h2 className="text-xl font-serif font-bold text-center flex-1 mx-4 truncate">
          {recipe.title}
        </h2>
        <button
          onClick={toggleListening}
          data-testid="button-toggle-mic"
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isListening ? 'bg-primary text-white shadow-[0_0_15px_rgba(255,50,50,0.5)]' : 'bg-white/10 text-white/50'}`}
        >
          {isListening ? <Mic size={24} /> : <MicOff size={24} />}
        </button>
      </div>

      {!hasStarted ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
          <div className="absolute inset-0 bg-cover bg-center opacity-20 blur-xl scale-110" style={{ backgroundImage: `url(${recipe.image})` }} />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 to-zinc-950" />
          <div className="relative z-10 flex flex-col items-center max-w-md">
            <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center mb-8">
              <Mic size={48} className="text-primary" />
            </div>
            <h1 className="text-4xl font-serif font-bold mb-4">Hands-free Cooking</h1>
            <p className="text-zinc-400 text-lg mb-12">
              I'll read you the ingredients and instructions step-by-step. Say <strong className="text-white">"next"</strong> or <strong className="text-white">"done"</strong> to advance, or <strong className="text-white">"repeat"</strong> to hear the current step again.
            </p>
            <button
              onClick={startCooking}
              className="bg-primary hover:bg-primary/90 text-white w-full py-5 rounded-full font-bold text-xl flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-xl shadow-primary/30"
              data-testid="button-start-cooking"
            >
              <Play size={24} fill="currentColor" />
              Start Cooking
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col px-6 pb-8 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 text-xs font-medium uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            {isSpeaking ? (
              <><Volume2 size={14} className="text-primary animate-pulse" /> Speaking...</>
            ) : isListening ? (
              <><div className="w-2 h-2 rounded-full bg-primary animate-ping" /> Listening for "Done", "Next", or "Repeat"</>
            ) : (
              <><Pause size={14} /> Paused</>
            )}
          </div>

          <div className="w-full h-1 bg-white/10 rounded-full mt-8 mb-8 overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto relative">
            <AnimatePresence mode="wait">
              {isFinished ? (
                <motion.div
                  key="finished"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center text-center py-8"
                >
                  <div className="w-24 h-24 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-6">
                    <CheckCircle size={48} />
                  </div>
                  <h2 className="text-3xl font-serif font-bold mb-4">Bon Appétit!</h2>
                  <p className="text-zinc-400 text-lg mb-8">You've completed all the steps for this recipe.</p>
                  <button
                    onClick={() => setLocation("/cookbook")}
                    className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-bold text-lg transition-colors"
                  >
                    Return to Cookbook
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key={currentStepIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="w-full py-4"
                >
                  <div className="text-sm font-bold text-primary mb-4 uppercase tracking-wider" data-testid="text-step-label">
                    {(() => {
                      const currentStep = steps[currentStepIndex];
                      if (currentStep.type === 'ingredient') {
                        const position = steps.slice(0, currentStepIndex).filter(s => s.type === 'ingredient').length + 1;
                        const total = steps.filter(s => s.type === 'ingredient').length;
                        return `Ingredient ${position} of ${total}`;
                      } else {
                        const position = steps.slice(0, currentStepIndex).filter(s => s.type === 'instruction').length + 1;
                        const total = steps.filter(s => s.type === 'instruction').length;
                        return `Instruction ${position} of ${total}`;
                      }
                    })()}
                  </div>
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif leading-tight" data-testid="text-step-content">
                    {steps[currentStepIndex].text}
                  </h3>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!isFinished && (
            <div className="flex items-center justify-between gap-4 mt-8">
              <button
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
                data-testid="button-prev-step"
                className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={24} className="rotate-180" />
              </button>
              <button
                onClick={repeatCurrent}
                data-testid="button-repeat"
                className="flex-1 h-16 rounded-full bg-white/10 flex items-center justify-center gap-2 font-semibold text-lg active:scale-95 transition-transform"
              >
                <Volume2 size={20} />
                Repeat
              </button>
              <button
                onClick={handleNextStep}
                data-testid="button-next-step"
                className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white active:scale-95 transition-transform"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
