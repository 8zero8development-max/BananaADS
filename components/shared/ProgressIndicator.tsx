import React, { useEffect, useState, useRef } from 'react';

export type OperationType = 
  | 'research' 
  | 'moodboard' 
  | 'concepts' 
  | 'image' 
  | 'video' 
  | 'voiceover'
  | 'script'
  | 'polish';

export type ProgressState = 'queued' | 'processing' | 'completing' | 'completed' | 'error';

interface ProgressStage {
  label: string;
  duration: number;
}

interface OperationConfig {
  icon: string;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  stages: ProgressStage[];
  totalEstimate: string;
  totalSeconds: number;
}

const operationConfigs: Record<OperationType, OperationConfig> = {
  research: {
    icon: 'fa-magnifying-glass',
    iconColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    stages: [
      { label: 'Searching web', duration: 10 },
      { label: 'Analyzing data', duration: 12 },
      { label: 'Compiling results', duration: 8 }
    ],
    totalEstimate: '~30 seconds',
    totalSeconds: 30
  },
  moodboard: {
    icon: 'fa-palette',
    iconColor: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    stages: [
      { label: 'Gathering references', duration: 15 },
      { label: 'Creating composition', duration: 20 },
      { label: 'Finalizing design', duration: 10 }
    ],
    totalEstimate: '~45 seconds',
    totalSeconds: 45
  },
  concepts: {
    icon: 'fa-lightbulb',
    iconColor: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    stages: [
      { label: 'Analyzing brief', duration: 10 },
      { label: 'Generating ideas', duration: 15 },
      { label: 'Crafting concepts', duration: 15 }
    ],
    totalEstimate: '~40 seconds',
    totalSeconds: 40
  },
  image: {
    icon: 'fa-image',
    iconColor: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    stages: [
      { label: 'Processing prompt', duration: 15 },
      { label: 'Generating image', duration: 35 },
      { label: 'Enhancing quality', duration: 10 }
    ],
    totalEstimate: '~60 seconds',
    totalSeconds: 60
  },
  video: {
    icon: 'fa-film',
    iconColor: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    stages: [
      { label: 'Analyzing scene', duration: 30 },
      { label: 'Generating frames', duration: 120 },
      { label: 'Rendering video', duration: 90 },
      { label: 'Finalizing', duration: 30 }
    ],
    totalEstimate: '3-5 minutes',
    totalSeconds: 270
  },
  voiceover: {
    icon: 'fa-microphone',
    iconColor: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    stages: [
      { label: 'Processing text', duration: 5 },
      { label: 'Generating audio', duration: 10 },
      { label: 'Enhancing voice', duration: 5 }
    ],
    totalEstimate: '~20 seconds',
    totalSeconds: 20
  },
  script: {
    icon: 'fa-scroll',
    iconColor: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    stages: [
      { label: 'Analyzing concept', duration: 10 },
      { label: 'Writing scenes', duration: 20 },
      { label: 'Polishing script', duration: 10 }
    ],
    totalEstimate: '~40 seconds',
    totalSeconds: 40
  },
  polish: {
    icon: 'fa-wand-magic-sparkles',
    iconColor: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    stages: [
      { label: 'Analyzing content', duration: 5 },
      { label: 'Enhancing copy', duration: 10 }
    ],
    totalEstimate: '~15 seconds',
    totalSeconds: 15
  }
};

interface ProgressIndicatorProps {
  operation: OperationType;
  isActive: boolean;
  state?: ProgressState;
  showBanana?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onRetry?: () => void;
  customText?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  operation,
  isActive,
  state = 'queued',
  showBanana = true,
  size = 'md',
  className = '',
  onRetry,
  customText
}) => {
  const config = operationConfigs[operation];
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const sizeConfig = {
    sm: { 
      container: 'p-3', 
      icon: 'text-lg w-8 h-8', 
      text: 'text-xs',
      progress: 'h-1',
      banana: 'text-xl'
    },
    md: { 
      container: 'p-4', 
      icon: 'text-2xl w-12 h-12', 
      text: 'text-sm',
      progress: 'h-1.5',
      banana: 'text-2xl'
    },
    lg: { 
      container: 'p-6', 
      icon: 'text-3xl w-16 h-16', 
      text: 'text-base',
      progress: 'h-2',
      banana: 'text-4xl'
    }
  };

  const s = sizeConfig[size];

  useEffect(() => {
    if (!isActive || state !== 'processing') {
      setCurrentStageIdx(0);
      setStageProgress(0);
      setOverallProgress(0);
      setElapsedTime(0);
      startTimeRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    startTimeRef.current = Date.now();

    const updateProgress = () => {
      if (!startTimeRef.current) return;

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setElapsedTime(elapsed);

      let accumulatedTime = 0;
      let newStageIdx = 0;
      let stageElapsed = elapsed;

      for (let i = 0; i < config.stages.length; i++) {
        if (elapsed < accumulatedTime + config.stages[i].duration) {
          newStageIdx = i;
          stageElapsed = elapsed - accumulatedTime;
          break;
        }
        accumulatedTime += config.stages[i].duration;
        if (i === config.stages.length - 1) {
          newStageIdx = i;
          stageElapsed = config.stages[i].duration;
        }
      }

      setCurrentStageIdx(newStageIdx);
      
      const currentStageDuration = config.stages[newStageIdx].duration;
      const stagePercent = Math.min((stageElapsed / currentStageDuration) * 100, 100);
      setStageProgress(stagePercent);

      const overallPercent = Math.min((elapsed / config.totalSeconds) * 100, 95);
      setOverallProgress(overallPercent);

      animationFrameRef.current = requestAnimationFrame(updateProgress);
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, state, config]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.floor(seconds)}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStateStyles = () => {
    switch (state) {
      case 'queued':
        return 'opacity-50 grayscale';
      case 'processing':
        return 'animate-pulse-subtle';
      case 'completing':
        return 'animate-success-pop';
      case 'completed':
        return 'opacity-100';
      case 'error':
        return 'border-red-500/50 bg-red-500/10';
      default:
        return '';
    }
  };

  const currentStage = config.stages[currentStageIdx];
  const remainingTime = Math.max(0, config.totalSeconds - elapsedTime);

  if (!isActive && state === 'queued') {
    return null;
  }

  return (
    <div className={`rounded-2xl ${config.bgColor} border ${config.borderColor} ${s.container} ${getStateStyles()} ${className} transition-all duration-300`}>
      <div className="flex items-center gap-4">
        <div className={`relative ${s.icon} rounded-xl ${config.bgColor} flex items-center justify-center`}>
          {showBanana && state === 'processing' && (
            <span className={`absolute -top-1 -right-1 ${s.banana} animate-banana-bounce filter drop-shadow-lg`}>
              🍌
            </span>
          )}
          <i className={`fa-solid ${config.icon} ${config.iconColor} ${state === 'processing' ? 'animate-pulse' : ''}`}></i>
          {state === 'completed' && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <i className="fa-solid fa-check text-white text-[10px]"></i>
            </div>
          )}
          {state === 'error' && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <i className="fa-solid fa-exclamation text-white text-[10px]"></i>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className={`font-bold ${config.iconColor} ${s.text} truncate`}>
              {customText || (state === 'processing' ? currentStage.label : state === 'completed' ? 'Complete' : state === 'error' ? 'Failed' : 'Waiting...')}
            </span>
            {state === 'processing' && (
              <span className={`${s.text} text-white/50 ml-2 whitespace-nowrap`}>
                {Math.round(overallProgress)}%
              </span>
            )}
          </div>

          {state === 'processing' && (
            <>
              <div className={`w-full bg-white/10 rounded-full ${s.progress} overflow-hidden mb-2`}>
                <div 
                  className={`h-full rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-yellow-400 to-orange-500`}
                  style={{ width: `${overallProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {config.stages.map((stage, idx) => (
                    <div 
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        idx < currentStageIdx 
                          ? 'bg-green-400' 
                          : idx === currentStageIdx 
                            ? `${config.iconColor.replace('text-', 'bg-')} animate-pulse` 
                            : 'bg-white/20'
                      }`}
                      title={stage.label}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-white/40">
                  ~{formatTime(remainingTime)} remaining
                </span>
              </div>
            </>
          )}

          {state === 'queued' && (
            <div className={`${s.text} text-white/40`}>
              Est. {config.totalEstimate}
            </div>
          )}

          {state === 'error' && onRetry && (
            <button 
              onClick={onRetry}
              className={`${s.text} text-red-400 hover:text-red-300 underline transition`}
            >
              Click to retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface CompactProgressProps {
  operation: OperationType;
  isActive: boolean;
  className?: string;
}

export const CompactProgress: React.FC<CompactProgressProps> = ({
  operation,
  isActive,
  className = ''
}) => {
  const config = operationConfigs[operation];
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      startTimeRef.current = null;
      return;
    }

    startTimeRef.current = Date.now();
    
    const interval = setInterval(() => {
      if (!startTimeRef.current) return;
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const percent = Math.min((elapsed / config.totalSeconds) * 100, 95);
      setProgress(percent);
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, config.totalSeconds]);

  if (!isActive) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <span className="text-xl animate-banana-bounce">🍌</span>
        <i className={`fa-solid ${config.icon} ${config.iconColor} text-xs absolute -bottom-0.5 -right-0.5`}></i>
      </div>
      <div className="flex-1">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-white/50">{Math.round(progress)}%</span>
    </div>
  );
};

interface InlineProgressProps {
  operation: OperationType;
  isActive: boolean;
  text?: string;
  className?: string;
}

export const InlineProgress: React.FC<InlineProgressProps> = ({
  operation,
  isActive,
  text,
  className = ''
}) => {
  const config = operationConfigs[operation];
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      setCurrentStageIdx(0);
      setElapsedTime(0);
      startTimeRef.current = null;
      return;
    }

    startTimeRef.current = Date.now();
    
    const interval = setInterval(() => {
      if (!startTimeRef.current) return;
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setElapsedTime(elapsed);

      let accumulatedTime = 0;
      for (let i = 0; i < config.stages.length; i++) {
        if (elapsed < accumulatedTime + config.stages[i].duration) {
          setCurrentStageIdx(i);
          break;
        }
        accumulatedTime += config.stages[i].duration;
        if (i === config.stages.length - 1) {
          setCurrentStageIdx(i);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isActive, config.stages]);

  if (!isActive) return null;

  const currentStage = config.stages[currentStageIdx];
  const progress = Math.min((elapsedTime / config.totalSeconds) * 100, 95);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative inline-flex items-center">
        <span className="text-2xl animate-banana-wiggle">🍌</span>
        <i className={`fa-solid ${config.icon} ${config.iconColor} text-sm absolute -bottom-1 -right-1 animate-pulse`}></i>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold tracking-widest uppercase">
          {text || currentStage.label}...
        </span>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-white/40">{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};

export const FullScreenProgress: React.FC<{
  operation: OperationType;
  isActive: boolean;
  title?: string;
  subtitle?: string;
}> = ({ operation, isActive, title, subtitle }) => {
  const config = operationConfigs[operation];
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      setCurrentStageIdx(0);
      setProgress(0);
      setElapsedTime(0);
      startTimeRef.current = null;
      return;
    }

    startTimeRef.current = Date.now();
    
    const interval = setInterval(() => {
      if (!startTimeRef.current) return;
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setElapsedTime(elapsed);
      setProgress(Math.min((elapsed / config.totalSeconds) * 100, 95));

      let accumulatedTime = 0;
      for (let i = 0; i < config.stages.length; i++) {
        if (elapsed < accumulatedTime + config.stages[i].duration) {
          setCurrentStageIdx(i);
          break;
        }
        accumulatedTime += config.stages[i].duration;
        if (i === config.stages.length - 1) {
          setCurrentStageIdx(i);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, config.stages, config.totalSeconds]);

  if (!isActive) return null;

  const currentStage = config.stages[currentStageIdx];
  const remainingTime = Math.max(0, config.totalSeconds - elapsedTime);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-[100]">
      <div className="relative mb-6">
        <span className="text-6xl animate-banana-bounce filter drop-shadow-lg">🍌</span>
        <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full ${config.bgColor} border ${config.borderColor} flex items-center justify-center`}>
          <i className={`fa-solid ${config.icon} ${config.iconColor} text-lg animate-pulse`}></i>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-2">{title || currentStage.label}</h2>
      <p className="text-white/50 mb-6">{subtitle || `Estimated time: ${config.totalEstimate}`}</p>

      <div className="w-64 mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-white/70">{currentStage.label}</span>
          <span className="text-yellow-400 font-bold">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {config.stages.map((stage, idx) => (
          <div key={idx} className="flex items-center">
            <div 
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                idx < currentStageIdx 
                  ? 'bg-green-400' 
                  : idx === currentStageIdx 
                    ? 'bg-yellow-400 animate-pulse' 
                    : 'bg-white/20'
              }`}
              title={stage.label}
            />
            {idx < config.stages.length - 1 && (
              <div className={`w-8 h-0.5 ${idx < currentStageIdx ? 'bg-green-400' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>

      <p className="text-sm text-white/40">~{formatTime(remainingTime)} remaining</p>
    </div>
  );
};

export default ProgressIndicator;
