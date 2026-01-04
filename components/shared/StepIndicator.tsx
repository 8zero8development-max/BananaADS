import React from 'react';
import { AppStep, AdBrief, AdConcept } from '../../types';

interface StepIndicatorProps {
  currentStep: AppStep;
  onStepClick?: (step: AppStep) => void;
  brief: AdBrief;
  concepts: AdConcept[];
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

interface StepConfig {
  label: string;
  icon: string;
  completedIcon: string;
  description: string;
}

const stepConfigs: StepConfig[] = [
  { 
    label: "Brand Brief", 
    icon: "fa-magnifying-glass", 
    completedIcon: "fa-check",
    description: "Research & define your brand"
  },
  { 
    label: "Creative Concepts", 
    icon: "fa-lightbulb", 
    completedIcon: "fa-check",
    description: "Generate creative directions"
  },
  { 
    label: "Production", 
    icon: "fa-film", 
    completedIcon: "fa-check",
    description: "Create your ad assets"
  }
];

const StepIndicator: React.FC<StepIndicatorProps> = ({ 
  currentStep, 
  onStepClick, 
  brief, 
  concepts,
  showToast
}) => {
  
  const canNavigateToStep = (targetStep: AppStep): boolean => {
    switch (targetStep) {
      case AppStep.BRIEFING:
        return true;
      case AppStep.CONCEPTS:
        return !!(brief.brandName && brief.productName);
      case AppStep.STORYBOARDING:
        return concepts.length > 0;
      default:
        return false;
    }
  };
  
  const handleStepClick = (targetStep: AppStep) => {
    if (!onStepClick) return;
    
    if (!canNavigateToStep(targetStep)) {
      if (targetStep === AppStep.CONCEPTS) {
        if (showToast) {
          showToast('Please complete the Brand Brief first (Brand Name and Product Name are required).', 'error');
        }
      } else if (targetStep === AppStep.STORYBOARDING) {
        if (showToast) {
          showToast('Please generate and select a Creative Concept first.', 'error');
        }
      }
      return;
    }
    
    onStepClick(targetStep);
  };
  
  return (
    <div className="flex items-center space-x-6 mb-12">
      {stepConfigs.map((config, idx) => {
        const stepEnum = idx as AppStep;
        const isAccessible = canNavigateToStep(stepEnum);
        const isClickable = onStepClick && isAccessible;
        const isCurrentStep = currentStep === idx;
        const isCompleted = currentStep > idx;
        const isCurrentOrPast = currentStep >= idx;
        
        const stepDataAttribute = idx === 0 ? 'briefing' : idx === 1 ? 'concepts' : 'storyboarding';
        
        return (
          <React.Fragment key={idx}>
            <div 
              className={`flex items-center group ${isClickable ? 'cursor-pointer' : ''}`}
              onClick={() => handleStepClick(stepEnum)}
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
              data-step={stepDataAttribute}
              onKeyDown={(e) => {
                if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handleStepClick(stepEnum);
                }
              }}
            >
              <div 
                className={`relative flex items-center justify-center transition-all duration-500 ${
                  isCurrentOrPast 
                    ? 'scale-110' 
                    : 'opacity-30 grayscale'
                } ${isClickable ? 'hover:scale-125' : ''}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-gradient-to-br from-green-400 to-green-600 animate-success-pop' 
                    : isCurrentStep 
                      ? 'bg-black/80 border-2 border-yellow-400/50 ring-2 ring-yellow-400/30 animate-glow-pulse' 
                      : 'bg-white/10 border border-white/20'
                } ${isClickable ? 'group-hover:scale-110' : ''}`}>
                  {isCompleted ? (
                    <i className={`fa-solid ${config.completedIcon} text-white text-lg`}></i>
                  ) : isCurrentStep ? (
                    <div className="flex items-center justify-center">
                      <span className="text-2xl animate-banana-wiggle drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">🍌</span>
                    </div>
                  ) : (
                    <i className={`fa-solid ${config.icon} text-white/50 text-lg`}></i>
                  )}
                  {isCurrentStep && (
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-orange-500/10"></div>
                  )}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-black transition-all ${
                  isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isCurrentStep 
                      ? 'bg-yellow-400 text-black animate-pulse-subtle' 
                      : 'bg-zinc-800 text-white/50'
                } ${isClickable ? 'group-hover:bg-yellow-400 group-hover:text-black' : ''}`}>
                  {isCompleted ? <i className="fa-solid fa-check text-[8px]"></i> : idx + 1}
                </div>
              </div>
              <div className="ml-3 flex flex-col">
                <span className={`text-sm font-bold uppercase tracking-wider transition-colors ${
                  isCurrentStep 
                    ? 'text-yellow-400' 
                    : isCompleted 
                      ? 'text-green-400' 
                      : 'text-white/40'
                } ${isClickable ? 'group-hover:text-yellow-300' : ''}`}>
                  {config.label}
                </span>
                <span className={`text-[10px] transition-colors ${
                  isCurrentOrPast ? 'text-white/50' : 'text-white/20'
                }`}>
                  {config.description}
                </span>
              </div>
            </div>
            {idx < stepConfigs.length - 1 && (
              <div className="flex-1 h-1.5 bg-white/10 rounded-full relative overflow-hidden mx-2">
                <div 
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out ${
                    isCompleted ? 'bg-gradient-to-r from-green-400 to-green-500' : 'gradient-accent'
                  }`}
                  style={{ width: currentStep > idx ? '100%' : currentStep === idx ? '50%' : '0%' }}
                />
                {currentStep === idx && (
                  <div className="absolute top-0 left-0 h-full w-1/2 animate-shimmer rounded-full"></div>
                )}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;
