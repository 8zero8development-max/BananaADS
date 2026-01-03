import React from 'react';
import { AppStep, AdBrief, AdConcept } from '../../types';

interface StepIndicatorProps {
  currentStep: AppStep;
  onStepClick?: (step: AppStep) => void;
  brief: AdBrief;
  concepts: AdConcept[];
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ 
  currentStep, 
  onStepClick, 
  brief, 
  concepts,
  showToast
}) => {
  const steps = ["Brand Brief", "Creative Concepts", "Production"];
  
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
      {steps.map((label, idx) => {
        const stepEnum = idx as AppStep;
        const isAccessible = canNavigateToStep(stepEnum);
        const isClickable = onStepClick && isAccessible;
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
                    ? 'scale-110 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]' 
                    : 'opacity-30 grayscale'
                } ${isClickable ? 'hover:scale-125 hover:drop-shadow-[0_0_20px_rgba(250,204,21,0.7)]' : ''}`}
              >
                <div className={`text-4xl select-none ${isClickable ? 'transition-transform group-hover:rotate-12' : ''}`}>
                  🍌
                </div>
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-black transition-colors ${
                  isCurrentOrPast ? 'bg-white text-black' : 'bg-zinc-800 text-white'
                } ${isClickable ? 'group-hover:bg-yellow-400' : ''}`}>
                  {idx + 1}
                </div>
              </div>
              <span className={`ml-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                isCurrentOrPast ? 'text-banana' : 'text-white/40'
              } ${isClickable ? 'group-hover:text-yellow-300' : ''}`}>
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-1 h-1 bg-white/10 rounded-full relative overflow-hidden mx-2">
                <div 
                  className="absolute top-0 left-0 h-full gradient-accent transition-all duration-700 ease-out" 
                  style={{ width: currentStep > idx ? '100%' : '0%' }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;
