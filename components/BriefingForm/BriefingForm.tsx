import React from 'react';
import { AdBrief } from '../../types';
import BananaPro from '../shared/BananaPro';

interface BriefingFormProps {
  brief: AdBrief;
  setBrief: React.Dispatch<React.SetStateAction<AdBrief>>;
  productionType: 'video' | 'social' | 'food-social';
  setProductionType: React.Dispatch<React.SetStateAction<'video' | 'social' | 'food-social'>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onResearchBrand: () => Promise<void>;
  onGenerateMoodBoard: () => Promise<void>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownload: (url: string, filename: string) => void;
  isGenerating: boolean;
  isResearching: boolean;
  isGeneratingMoodBoard: boolean;
}

const BriefingForm: React.FC<BriefingFormProps> = ({
  brief,
  setBrief,
  productionType,
  setProductionType,
  onSubmit,
  onResearchBrand,
  onGenerateMoodBoard,
  onImageUpload,
  onLogoUpload,
  onDownload,
  isGenerating,
  isResearching,
  isGeneratingMoodBoard
}) => {
  return (
    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div>
        <h1 className="text-5xl font-serif mb-4 gradient-text">Tell us about your brand.</h1>
        <p className="text-white/50 text-lg mb-6">
          Our AI {productionType === 'video' ? 'cinematography' : 'creative'} agent will analyze your brief to craft a 
          {productionType === 'video' ? ' cinematic experience' : ' high-impact campaign'}.
        </p>
        
        <div className="flex bg-white/5 rounded-full p-1.5 border border-yellow-500/30 w-fit mb-8">
          <button 
            onClick={() => setProductionType('video')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
              productionType === 'video' 
              ? 'bg-white text-black shadow-lg' 
              : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <i className="fa-solid fa-film"></i> Cinematic Video
          </button>
          <button 
            onClick={() => setProductionType('social')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
              productionType === 'social' 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
              : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <i className="fa-brands fa-instagram"></i> Social Posters
          </button>
          <button 
            onClick={() => setProductionType('food-social')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
              productionType === 'food-social' 
              ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg' 
              : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <i className="fa-solid fa-burger"></i> Food Socials
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Brand Name</label>
              <input 
                required={productionType !== 'food-social'}
                value={brief.brandName}
                onChange={(e) => setBrief({...brief, brandName: e.target.value})}
                className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
                placeholder="e.g. Lumina Watches"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Product</label>
              <input 
                required={productionType !== 'food-social'}
                value={brief.productName}
                onChange={(e) => setBrief({...brief, productName: e.target.value})}
                className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
                placeholder="e.g. Stellar Series"
              />
            </div>
          </div>

          <div className="flex justify-end -mt-2">
            <button 
              type="button"
              onClick={onResearchBrand}
              disabled={isResearching}
              className={`text-xs flex items-center gap-2 font-bold px-4 py-2 rounded-full border transition ${
                ((brief.brandName && brief.productName) || (productionType === 'food-social' && (brief.productUrl || brief.keyFeatures.length)))
                  ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20' 
                  : 'text-white/20 bg-white/5 border-white/10 hover:text-white/40'
              }`}
            >
              {isResearching ? (
                <BananaPro role="research" size="sm" />
              ) : (
                <><i className="fa-brands fa-google"></i> {productionType === 'food-social' ? "Infer Brand DNA from URL" : "Auto-fill Brief with AI Research"}</>
              )}
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Product URL <span className="text-[10px] normal-case font-normal text-white/30 ml-2">(Optional info source)</span></label>
            <input 
              value={brief.productUrl || ''}
              onChange={(e) => setBrief({...brief, productUrl: e.target.value})}
              className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
              placeholder="https://yourbrand.com/product"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Target Audience</label>
            <input 
              required={productionType !== 'food-social'}
              value={brief.targetAudience}
              onChange={(e) => setBrief({...brief, targetAudience: e.target.value})}
              className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
              placeholder="e.g. Modern minimalist professionals aged 25-40"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Brand Tone</label>
              <input 
                value={brief.tone.join(', ')}
                onChange={(e) => setBrief({...brief, tone: e.target.value.split(',').map(t => t.trim())})}
                className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
                placeholder="Premium, Cinematic..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Narrator Voice</label>
              <div className="relative">
                <select 
                  value={brief.voiceName}
                  onChange={(e) => setBrief({...brief, voiceName: e.target.value})}
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

          {productionType !== 'food-social' && (
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Creative Direction <span className="text-[10px] normal-case font-normal text-white/30 ml-2">(Optional Niche Pivot)</span></label>
              <input 
                value={brief.creativeDirection || ''}
                onChange={(e) => setBrief({...brief, creativeDirection: e.target.value})}
                className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
                placeholder="e.g. Pivot to high-end audiophiles, strictly professional use"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Key Selling Points / Description</label>
            <textarea 
              required={productionType !== 'food-social'}
              value={brief.keyFeatures.join('\n')}
              onChange={(e) => setBrief({...brief, keyFeatures: e.target.value.split('\n').filter(t => t.trim())})}
              className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 h-32 focus:outline-none focus:border-yellow-500 transition resize-none"
              placeholder={productionType === 'food-social' ? "Describe the food, ingredients, and vibe (or paste URL above to auto-fill)..." : "What makes this product special? (Enter each point on a new line)"}
            />
            {brief.researchSources && brief.researchSources.length > 0 && (
              <div className="text-[10px] text-white/30 mt-1">
                <span className="font-bold">Sources:</span> {brief.researchSources.map((s,i) => (
                  <a key={i} href={s} target="_blank" rel="noreferrer" className="underline hover:text-yellow-400 mr-2 truncate max-w-[200px] inline-block align-bottom">{new URL(s).hostname}</a>
                ))}
              </div>
            )}
          </div>

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
                      onClick={() => setBrief({...brief, productImage: undefined})}
                      className="absolute top-0 right-0 -m-2 bg-red-500/80 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center hover:bg-red-500 transition text-xs"
                    >
                      <i className="fa-solid fa-times"></i>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                    <span className="font-medium text-white/60 text-sm group-hover:text-white transition"><i className="fa-solid fa-upload mr-2"></i> Product</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={onImageUpload} 
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
                      onClick={() => setBrief({...brief, logoImage: undefined})}
                      className="absolute top-0 right-0 -m-2 bg-red-500/80 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center hover:bg-red-500 transition text-xs"
                    >
                      <i className="fa-solid fa-times"></i>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                    <span className="font-medium text-white/60 text-sm group-hover:text-white transition"><i className="fa-solid fa-upload mr-2"></i> Logo</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={onLogoUpload} 
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isGenerating}
            className="w-full gradient-accent text-black font-bold py-4 rounded-xl shadow-lg hover:opacity-90 transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isGenerating ? <BananaPro role="director" size="sm" /> : <i className="fa-solid fa-sparkles"></i>}
            <span>{isGenerating ? "Analyzing Brand DNA..." : "Generate Creative Concepts"}</span>
          </button>
        </form>
      </div>

      <div className="lg:pl-8 lg:border-l border-white/5 flex flex-col">
        <h2 className="text-2xl font-serif mb-6 text-white/80">Visual Identity</h2>
        {brief.brandName ? (
          <div className="flex-grow flex flex-col">
            <div className="bg-white/5 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white/70 uppercase text-xs tracking-widest">Mood Board</h3>
                {!brief.moodBoard && (
                  <button 
                    onClick={onGenerateMoodBoard}
                    disabled={isGeneratingMoodBoard || brief.tone.length === 0}
                    className="text-xs bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-300 px-3 py-1.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {isGeneratingMoodBoard ? <BananaPro role="artist" size="sm" /> : "Generate"}
                  </button>
                )}
              </div>
              {brief.moodBoard ? (
                <div className="relative group overflow-hidden rounded-xl shadow-2xl border border-yellow-500/30">
                  <img src={brief.moodBoard} className="w-full h-auto object-cover" alt="Brand Mood Board" />
                  <button
                    onClick={() => onDownload(brief.moodBoard!, 'NanoAds-MoodBoard.png')}
                    className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition opacity-0 group-hover:opacity-100 border border-white/10"
                    title="Download Mood Board"
                  >
                    <i className="fa-solid fa-download"></i>
                  </button>
                </div>
              ) : (
                <div className="h-64 border-2 border-dashed border-yellow-500/30 rounded-xl flex items-center justify-center text-white/20">
                  <div className="text-center">
                    <i className="fa-solid fa-palette text-3xl mb-2"></i>
                    <p className="text-sm">Upload a product image & generate<br/>to see the cohesive mood board collage.</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex-grow glass rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-yellow-500/10 blur-[100px] rounded-full"></div>
              <h3 className="font-bold text-white/70 uppercase text-xs tracking-widest mb-4 relative z-10">Brand DNA</h3>
              <div className="space-y-4 relative z-10">
                <div>
                  <span className="text-white/40 text-xs block mb-1">Tone</span>
                  <div className="flex flex-wrap gap-2">
                    {brief.tone.length > 0 ? brief.tone.map((t, i) => (
                      <span key={i} className="px-2 py-1 bg-white/10 rounded text-xs text-white/80">{t.trim()}</span>
                    )) : <span className="text-white/20 text-sm italic">Define tone...</span>}
                  </div>
                </div>
                <div>
                  <span className="text-white/40 text-xs block mb-1">Audience</span>
                  <p className="text-sm text-white/80">{brief.targetAudience || <span className="text-white/20 italic">Define audience...</span>}</p>
                </div>
                {brief.visualStyle && (
                  <div>
                    <span className="text-white/40 text-xs block mb-1">Inferred Visual Style</span>
                    <p className="text-sm text-white/80 border-l-2 border-yellow-500 pl-2">{brief.visualStyle}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center opacity-30">
            <div className="text-center">
              <i className="fa-solid fa-layer-group text-4xl mb-4"></i>
              <p>Start your brief to see<br/>visual identity suggestions</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BriefingForm;
