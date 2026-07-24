'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  RotateCcw, 
  Lock, 
  Unlock, 
  Users, 
  List, 
  X,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { wakeLockController } from '../utils/wake-lock';
import { convertIngredientUnit } from '../utils/unit-converter';

interface KitchenCookViewProps {
  entity: {
    id: string;
    title: string;
    slug: string;
    servings: number;
    prepTimeMinutes?: number | null;
    cookTimeMinutes?: number | null;
    ingredients: Array<{
      itemName: string;
      amount?: number | null;
      unit?: string | null;
      notes?: string | null;
    }>;
    instructions: Array<{
      stepNumber: number;
      instructionText: string;
      timerMinutes?: number | null;
    }>;
  };
}

export function KitchenCookView({ entity }: KitchenCookViewProps) {
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);

  // Timer states
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSteps = entity.instructions.length;
  const currentStep = entity.instructions[activeStepIdx] || {
    stepNumber: 1,
    instructionText: 'No instructions available.',
    timerMinutes: null,
  };

  // Initialize Screen Wake Lock on mount
  useEffect(() => {
    let mounted = true;

    const requestLock = async () => {
      const success = await wakeLockController.requestWakeLock();
      if (mounted) {
        setWakeLockActive(success);
      }
    };

    requestLock();

    // Re-acquire wake lock if page visibility changes back to visible
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const success = await wakeLockController.requestWakeLock();
        if (mounted) setWakeLockActive(success);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      wakeLockController.releaseWakeLock();
    };
  }, []);

  // Sync timer when step changes
  useEffect(() => {
    setIsTimerRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);

    if (currentStep.timerMinutes && currentStep.timerMinutes > 0) {
      setTimerSecondsLeft(currentStep.timerMinutes * 60);
    } else {
      setTimerSecondsLeft(null);
    }
  }, [activeStepIdx, currentStep.timerMinutes]);

  // Timer countdown handler
  useEffect(() => {
    if (isTimerRunning && timerSecondsLeft !== null && timerSecondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev === null || prev <= 1) {
            setIsTimerRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timerSecondsLeft]);

  // Keyboard navigation shortcuts (Left Arrow / Right Arrow / Space to toggle timer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setActiveStepIdx((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveStepIdx((prev) => Math.min(totalSteps - 1, prev + 1));
      } else if (e.key === ' ') {
        e.preventDefault();
        if (timerSecondsLeft !== null) {
          setIsTimerRunning((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSteps, timerSecondsLeft]);

  const toggleWakeLock = async () => {
    if (wakeLockActive) {
      await wakeLockController.releaseWakeLock();
      setWakeLockActive(false);
    } else {
      const success = await wakeLockController.requestWakeLock();
      setWakeLockActive(success);
    }
  };

  const formatTimerTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between p-4 sm:p-8 select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <Link
          href={`/content/${entity.slug}`}
          className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Cooking Mode</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Ingredients Quick Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowIngredients(!showIngredients)}
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold flex items-center gap-1.5"
          >
            <List className="w-4 h-4" />
            <span>Ingredients ({entity.ingredients.length})</span>
          </button>

          {/* Screen Wake Lock Status Toggle */}
          <button
            type="button"
            onClick={toggleWakeLock}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              wakeLockActive
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400'
            }`}
          >
            {wakeLockActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{wakeLockActive ? 'Screen Awake Active' : 'Wake Lock Off'}</span>
          </button>
        </div>
      </div>

      {/* Main Hands-Free Step Display */}
      <div className="max-w-4xl mx-auto w-full my-auto py-8 space-y-8 text-center">
        {/* Step Progress Counter */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider">
              {entity.title}
            </span>
          </div>

          <h2 className="text-sm font-semibold text-neutral-400 tracking-wider uppercase">
            Step {activeStepIdx + 1} of {totalSteps}
          </h2>

          {/* Progress Bar */}
          <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden max-w-xl mx-auto border border-neutral-800">
            <div
              className="amber-gradient-bg h-full transition-all duration-300"
              style={{ width: `${((activeStepIdx + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Large Instruction Text Card */}
        <div className="p-8 sm:p-12 rounded-3xl glass-panel border border-neutral-800 bg-neutral-900/60 shadow-2xl space-y-6">
          <p className="text-2xl sm:text-4xl font-extrabold text-white leading-relaxed tracking-tight">
            {currentStep.instructionText}
          </p>

          {/* Step Timer Controller */}
          {timerSecondsLeft !== null && (
            <div className="pt-6 border-t border-neutral-800/80 flex flex-col items-center space-y-3">
              <div className="flex items-center gap-2 text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Active Step Timer</span>
              </div>

              <div
                className={`text-4xl sm:text-5xl font-extrabold font-mono tracking-tight ${
                  timerSecondsLeft === 0
                    ? 'text-red-400 animate-pulse'
                    : isTimerRunning
                    ? 'text-amber-400'
                    : 'text-neutral-200'
                }`}
              >
                {formatTimerTime(timerSecondsLeft)}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="px-6 py-2.5 rounded-xl amber-gradient-bg text-white font-bold text-xs shadow-lg hover:opacity-90 flex items-center gap-2"
                >
                  {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isTimerRunning ? 'Pause Timer' : 'Start Timer'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsTimerRunning(false);
                    if (currentStep.timerMinutes) {
                      setTimerSecondsLeft(currentStep.timerMinutes * 60);
                    }
                  }}
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Step Navigation Bar */}
      <div className="max-w-4xl mx-auto w-full border-t border-neutral-800 pt-4 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setActiveStepIdx((prev) => Math.max(0, prev - 1))}
          disabled={activeStepIdx === 0}
          className="px-6 py-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-white font-bold text-sm hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Previous Step</span>
        </button>

        <span className="text-xs text-neutral-500 hidden sm:inline">
          Use ← and → arrow keys to navigate steps
        </span>

        <button
          type="button"
          onClick={() => setActiveStepIdx((prev) => Math.min(totalSteps - 1, prev + 1))}
          disabled={activeStepIdx === totalSteps - 1}
          className="px-6 py-3 rounded-2xl amber-gradient-bg text-white font-bold text-sm shadow-xl hover:opacity-90 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
        >
          <span>{activeStepIdx === totalSteps - 1 ? 'Finished!' : 'Next Step'}</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Ingredients Sidebar Drawer */}
      {showIngredients && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-neutral-950/95 backdrop-blur-xl border-l border-neutral-800 p-6 z-50 overflow-y-auto space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <List className="w-4 h-4 text-amber-400" />
              Recipe Ingredients ({entity.servings} Servings)
            </h3>
            <button
              type="button"
              onClick={() => setShowIngredients(false)}
              className="text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <ul className="space-y-2.5 text-xs">
            {entity.ingredients.map((ing, idx) => {
              const converted = convertIngredientUnit(ing.amount ?? null, ing.unit ?? null, 'metric');
              return (
                <li key={idx} className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">
                      {converted.displayString ? `${converted.displayString} ` : ''}
                      {ing.itemName}
                    </span>
                    {ing.notes && <span className="block text-neutral-400 italic text-[11px] mt-0.5">({ing.notes})</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
