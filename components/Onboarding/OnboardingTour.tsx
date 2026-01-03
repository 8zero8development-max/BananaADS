import React, { useState, useEffect, useCallback } from 'react';

export interface OnboardingStep {
  id: string;
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'briefing',
    target: '[data-step="briefing"]',
    title: 'Start with Your Brand',
    content: 'Tell us about your brand and product. Our AI will research your target audience automatically.',
    position: 'bottom'
  },
  {
    id: 'concepts',
    target: '[data-step="concepts"]',
    title: 'Choose Your Creative Direction',
    content: 'Select from 3 AI-generated concepts tailored to your brand.',
    position: 'top'
  },
  {
    id: 'storyboarding',
    target: '[data-step="storyboarding"]',
    title: 'Bring Your Vision to Life',
    content: 'Generate storyboards, scripts, voiceovers, and videos featuring your actual product.',
    position: 'left'
  }
];

interface OnboardingTourProps {
  steps: OnboardingStep[];
  onComplete: () => void;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ steps, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ top: 0, left: 0, arrowPosition: 'top' });
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const calculatePosition = useCallback(() => {
    const step = steps[currentStep];
    if (!step) return;

    const targetElement = document.querySelector(step.target);
    if (!targetElement) return;

    const rect = targetElement.getBoundingClientRect();
    setTargetRect(rect);

    const tooltipWidth = 300;
    const tooltipHeight = 150;
    const padding = 16;

    let top = 0;
    let left = 0;
    let arrowPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';

    switch (step.position) {
      case 'bottom':
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        arrowPosition = 'top';
        break;
      case 'top':
        top = rect.top - tooltipHeight - padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        arrowPosition = 'bottom';
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - padding;
        arrowPosition = 'right';
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + padding;
        arrowPosition = 'left';
        break;
    }

    // Keep tooltip within viewport bounds
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < padding) left = padding;
    if (left + tooltipWidth > viewportWidth - padding) left = viewportWidth - tooltipWidth - padding;
    if (top < padding) top = padding;
    if (top + tooltipHeight > viewportHeight - padding) top = viewportHeight - tooltipHeight - padding;

    setTooltipPosition({ top, left, arrowPosition });
  }, [currentStep, steps]);

  useEffect(() => {
    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition);

    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition);
    };
  }, [calculatePosition]);

  useEffect(() => {
    // Add highlight class to target element
    const step = steps[currentStep];
    if (!step) return;

    const targetElement = document.querySelector(step.target);
    if (targetElement) {
      targetElement.classList.add('onboarding-highlight');
    }

    return () => {
      if (targetElement) {
        targetElement.classList.remove('onboarding-highlight');
      }
    };
  }, [currentStep, steps]);

  const nextStep = () => {
    const step = steps[currentStep];
    if (step?.action) {
      step.action();
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsVisible(false);
      localStorage.setItem('onboarding-completed', 'true');
      onComplete();
    }
  };

  const skipOnboarding = () => {
    // Remove highlight from current element
    const step = steps[currentStep];
    if (step) {
      const targetElement = document.querySelector(step.target);
      if (targetElement) {
        targetElement.classList.remove('onboarding-highlight');
      }
    }

    setIsVisible(false);
    localStorage.setItem('onboarding-completed', 'true');
    onComplete();
  };

  if (!isVisible) return null;

  const step = steps[currentStep];

  const getArrowStyles = (): React.CSSProperties => {
    const arrowSize = 10;
    const baseStyles: React.CSSProperties = {
      content: "''",
      position: 'absolute',
      width: 0,
      height: 0,
      borderStyle: 'solid',
    };

    switch (tooltipPosition.arrowPosition) {
      case 'top':
        return {
          ...baseStyles,
          top: -arrowSize,
          left: '50%',
          transform: 'translateX(-50%)',
          borderWidth: `0 ${arrowSize}px ${arrowSize}px ${arrowSize}px`,
          borderColor: 'transparent transparent #fbbf24 transparent',
        };
      case 'bottom':
        return {
          ...baseStyles,
          bottom: -arrowSize,
          left: '50%',
          transform: 'translateX(-50%)',
          borderWidth: `${arrowSize}px ${arrowSize}px 0 ${arrowSize}px`,
          borderColor: '#f59e0b transparent transparent transparent',
        };
      case 'left':
        return {
          ...baseStyles,
          left: -arrowSize,
          top: '50%',
          transform: 'translateY(-50%)',
          borderWidth: `${arrowSize}px ${arrowSize}px ${arrowSize}px 0`,
          borderColor: 'transparent #fbbf24 transparent transparent',
        };
      case 'right':
        return {
          ...baseStyles,
          right: -arrowSize,
          top: '50%',
          transform: 'translateY(-50%)',
          borderWidth: `${arrowSize}px 0 ${arrowSize}px ${arrowSize}px`,
          borderColor: 'transparent transparent transparent #f59e0b',
        };
      default:
        return baseStyles;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Dark overlay with cutout for highlighted element */}
      <div 
        className="absolute inset-0 pointer-events-auto"
        onClick={skipOnboarding}
        style={{
          background: targetRect 
            ? `radial-gradient(ellipse at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${Math.max(targetRect.width, targetRect.height) / 2 + 20}px, rgba(0, 0, 0, 0.75) ${Math.max(targetRect.width, targetRect.height) / 2 + 40}px)`
            : 'rgba(0, 0, 0, 0.75)'
        }}
      />

      {/* Tooltip */}
      <div
        className="onboarding-tooltip pointer-events-auto"
        style={{
          position: 'fixed',
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          color: '#000',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(251, 191, 36, 0.3)',
          maxWidth: '300px',
          zIndex: 10000,
        }}
      >
        {/* Arrow */}
        <div style={getArrowStyles()} />

        <h3 className="font-bold text-lg mb-2">{step.title}</h3>
        <p className="text-sm mb-4 opacity-90">{step.content}</p>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-4">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentStep ? 'bg-black w-4' : 'bg-black/30'
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={skipOnboarding}
            className="text-xs opacity-70 hover:opacity-100 transition-opacity"
          >
            Skip
          </button>
          <button
            onClick={nextStep}
            className="bg-black/20 px-4 py-2 rounded-full text-sm font-bold hover:bg-black/30 transition"
          >
            {currentStep === steps.length - 1 ? "Got it!" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
