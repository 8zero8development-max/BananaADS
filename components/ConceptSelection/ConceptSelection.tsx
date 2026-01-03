import React, { memo, useCallback } from 'react';
import { AdConcept } from '../../types';
import BananaPro from '../shared/BananaPro';

interface ConceptCardProps {
  concept: AdConcept;
  onSelect: (concept: AdConcept) => void;
  isGeneratingPreviews: boolean;
}

const ConceptCard = memo<ConceptCardProps>(({ concept, onSelect, isGeneratingPreviews }) => {
  const handleClick = useCallback(() => {
    onSelect(concept);
  }, [concept, onSelect]);

  return (
    <div 
      className="glass p-8 rounded-3xl group hover:border-yellow-500/50 transition-all duration-500 cursor-pointer flex flex-col h-full"
      onClick={handleClick}
    >
      <div className="h-48 w-full bg-white/5 rounded-2xl mb-6 overflow-hidden relative">
        {concept.thumbnailUrl ? (
          <img src={concept.thumbnailUrl} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" alt={concept.title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isGeneratingPreviews ? (
              <BananaPro role="artist" size="sm" text="Sketching..." />
            ) : (
              <i className="fa-solid fa-lightbulb text-white/10 text-4xl group-hover:text-white/20 transition"></i>
            )}
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold mb-3">{concept.title}</h3>
      <div className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-4">{concept.hook}</div>
      <p className="text-white/50 leading-relaxed flex-grow">{concept.summary}</p>
      {concept.overlayCtas && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <span className="text-[10px] uppercase text-white/30 block mb-1">Proposed Headlines</span>
          <div className="flex flex-wrap gap-1">
            {concept.overlayCtas.slice(0, 2).map((cta, i) => (
              <span key={i} className="text-[10px] bg-white/10 px-2 py-1 rounded">{cta}</span>
            ))}
          </div>
        </div>
      )}
      <button className="mt-8 border border-yellow-500/30 group-hover:bg-white group-hover:text-black font-bold py-3 rounded-xl transition-all">
        Choose Direction
      </button>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.concept.id === nextProps.concept.id && 
         prevProps.concept.thumbnailUrl === nextProps.concept.thumbnailUrl &&
         prevProps.isGeneratingPreviews === nextProps.isGeneratingPreviews;
});

ConceptCard.displayName = 'ConceptCard';

interface ConceptSelectionProps {
  concepts: AdConcept[];
  onSelectConcept: (concept: AdConcept) => Promise<void>;
  onRegenerateConcepts: () => Promise<void>;
  isLoading: boolean;
  isGeneratingPreviews: boolean;
}

const ConceptSelection: React.FC<ConceptSelectionProps> = ({
  concepts,
  onSelectConcept,
  onRegenerateConcepts,
  isLoading,
  isGeneratingPreviews
}) => {
  const handleSelectConcept = useCallback((concept: AdConcept) => {
    onSelectConcept(concept);
  }, [onSelectConcept]);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-5xl font-serif mb-4 gradient-text text-center lg:text-left">Select your vision.</h1>
          <p className="text-white/50 text-lg text-center lg:text-left">Three unique creative directions based on your brief.</p>
        </div>
        
        <button 
          onClick={onRegenerateConcepts}
          disabled={isLoading}
          className="px-6 py-3 rounded-full border border-yellow-500/30 hover:bg-white/10 transition flex items-center gap-2 text-sm font-bold"
        >
          <i className="fa-solid fa-rotate"></i> Regenerate Concepts
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {concepts.map((concept) => (
          <ConceptCard
            key={concept.id}
            concept={concept}
            onSelect={handleSelectConcept}
            isGeneratingPreviews={isGeneratingPreviews}
          />
        ))}
      </div>
      {isLoading && (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[100]">
          <BananaPro role="director" size="lg" />
          <p className="text-xl font-bold mt-4">Directing the scene...</p>
          <p className="text-white/50">Generating cinematic storyboard & scripts</p>
        </div>
      )}
    </div>
  );
};

export default ConceptSelection;
