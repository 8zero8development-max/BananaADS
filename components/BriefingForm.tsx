import React, { useState, useCallback } from 'react';
import { AdBrief } from '../types';
import { useGeminiService } from '../hooks/useGeminiService';

interface BriefingFormProps {
  brief: AdBrief;
  onBriefChange: (brief: AdBrief) => void;
  productionType: 'video' | 'social' | 'food-social';
  onProductionTypeChange: (type: 'video' | 'social' | 'food-social') => void;
  onStartGeneration: () => void;
  loading: boolean;
}

const BriefingForm: React.FC<BriefingFormProps> = ({
  brief,
  onBriefChange,
  productionType,
  onProductionTypeChange,
  onStartGeneration,
  loading,
}) => {
  const { researchBrand, autoFillFoodBrief, generateMoodBoard, loading: apiLoading, error } = useGeminiService();
  const [researching, setResearching] = useState(false);
  const [generatingMoodBoard, setGeneratingMoodBoard] = useState(false);

  const handleResearchBrand = useCallback(async () => {
    if (productionType === 'food-social') {
      if (!brief.keyFeatures.length && !brief.productUrl) {
        alert('For Food Socials, please provide a Description (in Key Selling Points) or a Product URL.');
        return;
      }
    } else {
      if (!brief.brandName || !brief.productName) {
        alert('Please enter a Brand Name and Product Name first.');
        return;
      }
    }

    setResearching(true);
    try {
      let researchData: Partial<AdBrief>;
      if (productionType === 'food-social') {
        const desc = brief.keyFeatures.join(', ');
        researchData = await autoFillFoodBrief(desc, brief.productUrl || '');
      } else {
        researchData = await researchBrand(brief.brandName, brief.productName);
      }

      onBriefChange({
        ...brief,
        ...researchData,
      });
    } catch (err) {
      console.error('Research failed:', err);
      alert(`Research failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setResearching(false);
    }
  }, [brief, productionType, researchBrand, autoFillFoodBrief, onBriefChange]);

  const handleGenerateMoodBoard = useCallback(async () => {
    setGeneratingMoodBoard(true);
    try {
      const image = await generateMoodBoard(brief, brief.productImage, brief.logoImage);
      onBriefChange({ ...brief, moodBoard: image });
    } catch (err) {
      console.error('Mood board generation failed:', err);
    } finally {
      setGeneratingMoodBoard(false);
    }
  }, [brief, generateMoodBoard, onBriefChange]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onBriefChange({ ...brief, productImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  }, [brief, onBriefChange]);

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onBriefChange({ ...brief, logoImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  }, [brief, onBriefChange]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onStartGeneration();
  }, [onStartGeneration]);

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="flex bg-white/5 rounded-full p-1.5 border border-yellow-500/30 w-fit">
        {[
          { key: 'video', label: 'Cinematic Video', icon: 'fa-film' },
          { key: 'social', label: 'Social Posters', icon: 'fa-brands fa-instagram' },
          { key: 'food-social', label: 'Food Socials', icon: 'fa-solid fa-burger' },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onProductionTypeChange(key as any)}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
              productionType === key
                ? key === 'video'
                  ? 'bg-white text-black shadow-lg'
                  : key === 'social'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <i className={icon}></i> {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Brand and Product Names */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white/40 font-bold">
              Brand Name
            </label>
            <input
              required={productionType !== 'food-social'}
              value={brief.brandName}
              onChange={(e) => onBriefChange({ ...brief, brandName: e.target.value })}
              className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
              placeholder="e.g. Lumina Watches"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white/40 font-bold">
              Product
            </label>
            <input
              required={productionType !== 'food-social'}
              value={brief.productName}
              onChange={(e) => onBriefChange({ ...brief, productName: e.target.value })}
              className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
              placeholder="e.g. Stellar Series"
            />
          </div>
        </div>

        {/* Research Button */}
        <div className="flex justify-end -mt-2">
          <button
            type="button"
            onClick={handleResearchBrand}
            disabled={researching || apiLoading}
            className={`text-xs flex items-center gap-2 font-bold px-4 py-2 rounded-full border transition ${
              (brief.brandName && brief.productName) || (productionType === 'food-social' && (brief.productUrl || brief.keyFeatures.length))
                ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20'
                : 'text-white/20 bg-white/5 border-white/10 hover:text-white/40'
            }`}
          >
            {researching ? (
              <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <><i className="fa-brands fa-google"></i> {productionType === 'food-social' ? 'Infer Brand DNA from URL' : 'Auto-fill Brief with AI Research'}</>
            )}
          </button>
        </div>

        {/* Product URL */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-white/40 font-bold">
            Product URL <span className="text-[10px] normal-case font-normal text-white/30 ml-2">(Optional info source)</span>
          </label>
          <input
            value={brief.productUrl || ''}
            onChange={(e) => onBriefChange({ ...brief, productUrl: e.target.value })}
            className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
            placeholder="https://yourbrand.com/product"
          />
        </div>

        {/* Target Audience */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-white/40 font-bold">
            Target Audience
          </label>
          <input
            required={productionType !== 'food-social'}
            value={brief.targetAudience}
            onChange={(e) => onBriefChange({ ...brief, targetAudience: e.target.value })}
            className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
            placeholder="e.g. Modern minimalist professionals aged 25-40"
          />
        </div>

        {/* Tone and Voice */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white/40 font-bold">
              Brand Tone
            </label>
            <input
              value={brief.tone.join(', ')}
              onChange={(e) => onBriefChange({ ...brief, tone: e.target.value.split(',').map(t => t.trim()) })}
              className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
              placeholder="Premium, Cinematic..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white/40 font-bold">
              Narrator Voice
            </label>
            <div className="relative">
              <select
                value={brief.voiceName}
                onChange={(e) => onBriefChange({ ...brief, voiceName: e.target.value })}
                className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition appearance-none cursor-pointer"
              >
                <option value="Kore">Kore - Balanced Female</option>
                <option value="Zephyr">Zephyr - Soft & Calm</option>
                <option value="Fenrir">Fenrir - Deep & Authoritative</option>
                <option value="Puck">Puck - Energetic Male</option>
                <option value="Charon">Charon - Deep Male</option>
              </select>
              <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none"></i>
            </div>
          </div>
        </div>

        {/* Creative Direction */}
        {productionType !== 'food-social' && (
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white/40 font-bold">
              Creative Direction <span className="text-[10px] normal-case font-normal text-white/30 ml-2">(Optional Niche Pivot)</span>
            </label>
            <input
              value={brief.creativeDirection || ''}
              onChange={(e) => onBriefChange({ ...brief, creativeDirection: e.target.value })}
              className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
              placeholder="e.g. Pivot to high-end audiophiles, strictly professional use"
            />
          </div>
        )}

        {/* Key Features */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-white/40 font-bold">
            Key Selling Points / Description
          </label>
          <textarea
            required={productionType !== 'food-social'}
            value={brief.keyFeatures.join('\n')}
            onChange={(e) => onBriefChange({ ...brief, keyFeatures: e.target.value.split('\n').filter(t => t.trim()) })}
            className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 h-32 focus:outline-none focus:border-yellow-500 transition resize-none"
            placeholder={productionType === 'food-social' ? 'Describe the food, ingredients, and vibe (or paste URL above to auto-fill)...' : 'What makes this product special? (Enter each point on a new line)'}
          />
          {brief.researchSources && brief.researchSources.length > 0 && (
            <div className="text-[10px] text-white/30 mt-1">
              <span className="font-bold">Sources:</span> {brief.researchSources.map((s, i) => (
                <a key={i} href={s} target="_blank" rel="noreferrer" className="underline hover:text-yellow-400 mr-2 truncate max-w-[200px] inline-block align-bottom">
                  {new URL(s).hostname}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Image Uploads */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white/40 font-bold flex justify-between">
              <span>Product Reference</span>
              <span className="text-yellow-400 font-normal normal-case">Required</span>
            </label>
            <div className="border border-dashed border-yellow-500/30 rounded-xl p-4 hover:bg-white/5 transition relative group flex items-center justify-center h-24">
              {brief.productImage ? (
                <div className="relative h-full w-full flex items-center justify-center">
                  <img src={brief.productImage} className="h-full object-contain rounded-lg" alt="Product Reference" />
                  <button
                    type="button"
                    onClick={() => onBriefChange({ ...brief, productImage: undefined })}
                    className="absolute top-0 right-0 -m-2 bg-red-500/80 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center hover:bg-red-500 transition text-xs"
                  >
                    <i className="fa-solid fa-times"></i>
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                  <span className="font-medium text-white/60 text-sm group-hover:text-white transition">
                    <i className="fa-solid fa-upload mr-2"></i> Product
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white/40 font-bold flex justify-between">
              <span>Brand Logo</span>
              <span className="text-white/20 font-normal normal-case">Optional Override</span>
            </label>
            <div className="border border-dashed border-yellow-500/30 rounded-xl p-4 hover:bg-white/5 transition relative group flex items-center justify-center h-24">
              {brief.logoImage ? (
                <div className="relative h-full w-full flex items-center justify-center">
                  <img src={brief.logoImage} className="h-full object-contain rounded-lg" alt="Brand Logo" />
                  <button
                    type="button"
                    onClick={() => onBriefChange({ ...brief, logoImage: undefined })}
                    className="absolute top-0 right-0 -m-2 bg-red-500/80 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center hover:bg-red-500 transition text-xs"
                  >
                    <i className="fa-solid fa-times"></i>
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                  <span className="font-medium text-white/60 text-sm group-hover:text-white transition">
                    <i className="fa-solid fa-upload mr-2"></i> Logo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || apiLoading}
          className="w-full gradient-accent text-black font-bold py-4 rounded-xl shadow-lg hover:opacity-90 transition flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <i className="fa-solid fa-sparkles"></i>
          )}
          <span>{loading ? 'Analyzing Brand DNA...' : 'Generate Creative Concepts'}</span>
        </button>
      </form>
    </div>
  );
};

export default React.memo(BriefingForm);