import React, { useState } from 'react';
import { AdBrief, ProductionType } from '../../types';
import BananaPro from '../shared/BananaPro';

import cinematicVideoIcon from '@assets/icons/cinematic-video.png';
import socialPostersIcon from '@assets/icons/social-posters.png';
import foodSocialsIcon from '@assets/icons/food-socials.png';
import emailCampaignIcon from '@assets/icons/email-campaign.png';

interface BriefingFormProps {
  brief: AdBrief;
  setBrief: React.Dispatch<React.SetStateAction<AdBrief>>;
  productionType: ProductionType;
  setProductionType: React.Dispatch<React.SetStateAction<ProductionType>>;
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

const AgeDemographicsChart: React.FC<{ targetAudience: string }> = ({ targetAudience }) => {
  const ageRanges = [
    { label: '18-24', percentage: 15 },
    { label: '25-34', percentage: 35 },
    { label: '35-44', percentage: 28 },
    { label: '45-54', percentage: 15 },
    { label: '55+', percentage: 7 },
  ];

  const audienceLower = targetAudience.toLowerCase();
  const adjustedRanges = ageRanges.map(range => {
    let multiplier = 1;
    if (audienceLower.includes('young') || audienceLower.includes('gen z')) {
      if (range.label === '18-24') multiplier = 2.5;
      else if (range.label === '25-34') multiplier = 1.5;
      else if (range.label === '55+') multiplier = 0.2;
    } else if (audienceLower.includes('professional') || audienceLower.includes('executive')) {
      if (range.label === '35-44') multiplier = 1.8;
      else if (range.label === '45-54') multiplier = 1.5;
      else if (range.label === '18-24') multiplier = 0.3;
    } else if (audienceLower.includes('millennial')) {
      if (range.label === '25-34') multiplier = 2.2;
      else if (range.label === '35-44') multiplier = 1.4;
    }
    return { ...range, percentage: Math.min(range.percentage * multiplier, 60) };
  });

  const total = adjustedRanges.reduce((sum, r) => sum + r.percentage, 0);
  const normalized = adjustedRanges.map(r => ({ ...r, percentage: Math.round((r.percentage / total) * 100) }));

  return (
    <div className="space-y-2">
      {normalized.map((range, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-[10px] text-white/50 w-10 text-right">{range.label}</span>
          <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${range.percentage}%` }}
            />
          </div>
          <span className="text-[10px] text-white/70 w-8">{range.percentage}%</span>
        </div>
      ))}
    </div>
  );
};

const BrandToneVisualizer: React.FC<{ tones: string[] }> = ({ tones }) => {
  const toneColors: Record<string, string> = {
    premium: 'from-amber-400 to-yellow-600',
    luxury: 'from-purple-400 to-pink-600',
    cinematic: 'from-blue-400 to-indigo-600',
    inspiring: 'from-orange-400 to-red-500',
    professional: 'from-slate-400 to-gray-600',
    playful: 'from-pink-400 to-rose-500',
    bold: 'from-red-500 to-orange-600',
    elegant: 'from-violet-400 to-purple-600',
    modern: 'from-cyan-400 to-blue-500',
    minimal: 'from-gray-300 to-slate-500',
    energetic: 'from-yellow-400 to-orange-500',
    sophisticated: 'from-indigo-400 to-purple-600',
    friendly: 'from-green-400 to-emerald-500',
    trustworthy: 'from-blue-400 to-cyan-500',
    innovative: 'from-violet-500 to-fuchsia-500',
  };

  const getGradient = (tone: string) => {
    const toneLower = tone.toLowerCase().trim();
    for (const [key, gradient] of Object.entries(toneColors)) {
      if (toneLower.includes(key)) return gradient;
    }
    return 'from-yellow-400 to-orange-500';
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {tones.slice(0, 4).map((tone, i) => (
        <div 
          key={i}
          className={`relative overflow-hidden rounded-xl p-3 bg-gradient-to-br ${getGradient(tone)} group cursor-default`}
        >
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
          <div className="relative z-10">
            <span className="text-white font-bold text-sm drop-shadow-lg">{tone.trim()}</span>
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white/10 rounded-full blur-xl" />
        </div>
      ))}
    </div>
  );
};

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
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  return (
    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div>
        <h1 className="text-5xl font-serif mb-4 gradient-text">Tell us about your brand.</h1>
        <p className="text-white/50 text-lg mb-6">
          Our AI {productionType === 'video' ? 'cinematography' : productionType === 'email' ? 'email marketing' : 'creative'} agent will analyze your brief to craft a 
          {productionType === 'video' ? ' cinematic experience' : productionType === 'email' ? ' engaging email campaign' : ' high-impact campaign'}.
        </p>
        
        <div className="flex bg-white/5 rounded-full p-1.5 border border-yellow-500/30 w-fit mb-8">
          <button 
            onClick={() => setProductionType('video')}
            title="Cinematic Video"
            className={`px-4 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
              productionType === 'video' 
              ? 'bg-white text-black shadow-lg' 
              : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <img src={cinematicVideoIcon} alt="" className="w-10 h-10 rounded-lg object-cover" />
            <span>Cinematic Video</span>
          </button>
          <button 
            onClick={() => setProductionType('social')}
            title="Social Posters"
            className={`px-4 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
              productionType === 'social' 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
              : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <img src={socialPostersIcon} alt="" className="w-10 h-10 rounded-lg object-cover" />
            <span>Social Posters</span>
          </button>
          <button 
            onClick={() => setProductionType('food-social')}
            title="Food Socials"
            className={`px-4 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
              productionType === 'food-social' 
              ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg' 
              : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <img src={foodSocialsIcon} alt="" className="w-10 h-10 rounded-lg object-cover" />
            <span>Food Socials</span>
          </button>
          <button 
            onClick={() => setProductionType('email')}
            title="Email Campaign"
            className={`px-4 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
              productionType === 'email' 
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
              : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <img src={emailCampaignIcon} alt="" className="w-10 h-10 rounded-lg object-cover" />
            <span>Email Campaign</span>
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

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Product URL <span className="text-[10px] normal-case font-normal text-white/30 ml-2">(Optional info source)</span></label>
            <input 
              value={brief.productUrl || ''}
              onChange={(e) => setBrief({...brief, productUrl: e.target.value})}
              className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
              placeholder="https://yourbrand.com/product"
            />
          </div>

          <button 
            type="button"
            onClick={onResearchBrand}
            disabled={isResearching || isGeneratingMoodBoard}
            className={`w-full flex items-center justify-center gap-3 font-bold px-6 py-4 rounded-xl border-2 transition-all ${
              ((brief.brandName && brief.productName) || (productionType === 'food-social' && (brief.productUrl || brief.keyFeatures.length)))
                ? 'text-black bg-gradient-to-r from-yellow-400 to-orange-500 border-yellow-500 hover:shadow-lg hover:shadow-yellow-500/30 hover:scale-[1.02]' 
                : 'text-white/40 bg-white/5 border-white/10 hover:text-white/60'
            }`}
          >
            {isResearching || isGeneratingMoodBoard ? (
              <>
                <BananaPro role="research" size="sm" />
                <span>{isResearching ? "Researching..." : "Generating Mood Board..."}</span>
              </>
            ) : (
              <>
                <span className="text-2xl">🍌</span>
                <span>Banana my Brand DNA</span>
              </>
            )}
          </button>

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

          <div className="border border-white/10 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 transition"
            >
              <span className="text-sm font-medium text-white/70">Advanced Options</span>
              <i className={`fa-solid fa-chevron-down text-white/40 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`}></i>
            </button>
            
            <div className={`overflow-hidden transition-all duration-300 ${isAdvancedOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-4 space-y-4 border-t border-white/10">
                {productionType === 'email' && (
                  <div className="space-y-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fa-solid fa-address-card text-blue-400"></i>
                      <span className="text-xs uppercase tracking-widest text-blue-400 font-bold">Contact Info for Footer</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Phone</label>
                        <input 
                          value={brief.contactPhone || ''}
                          onChange={(e) => setBrief({...brief, contactPhone: e.target.value})}
                          className="w-full bg-white/5 border border-blue-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Email</label>
                        <input 
                          type="email"
                          value={brief.contactEmail || ''}
                          onChange={(e) => setBrief({...brief, contactEmail: e.target.value})}
                          className="w-full bg-white/5 border border-blue-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition"
                          placeholder="contact@yourbrand.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Address</label>
                      <input 
                        value={brief.contactAddress || ''}
                        onChange={(e) => setBrief({...brief, contactAddress: e.target.value})}
                        className="w-full bg-white/5 border border-blue-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition"
                        placeholder="123 Main St, City, State 12345"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Target Audience</label>
                  <input 
                    value={brief.targetAudience}
                    onChange={(e) => setBrief({...brief, targetAudience: e.target.value})}
                    className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
                    placeholder="e.g. Modern minimalist professionals aged 25-40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Creative Direction <span className="text-[10px] normal-case font-normal text-white/30 ml-2">(Optional)</span></label>
                    <input 
                      value={brief.creativeDirection || ''}
                      onChange={(e) => setBrief({...brief, creativeDirection: e.target.value})}
                      className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
                      placeholder="e.g. Pivot to high-end audiophiles"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Key Selling Points</label>
                  <textarea 
                    value={brief.keyFeatures.join('\n')}
                    onChange={(e) => setBrief({...brief, keyFeatures: e.target.value.split('\n').filter(t => t.trim())})}
                    className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-3 h-24 focus:outline-none focus:border-yellow-500 transition resize-none"
                    placeholder={productionType === 'food-social' ? "Describe the food, ingredients, and vibe..." : "What makes this product special?"}
                  />
                  {brief.researchSources && brief.researchSources.length > 0 && (
                    <div className="text-[10px] text-white/30 mt-1">
                      <span className="font-bold">Sources:</span> {brief.researchSources.map((s,i) => (
                        <a key={i} href={s} target="_blank" rel="noreferrer" className="underline hover:text-yellow-400 mr-2 truncate max-w-[200px] inline-block align-bottom">{new URL(s).hostname}</a>
                      ))}
                    </div>
                  )}
                </div>
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
          <div className="flex-grow flex flex-col gap-6">
            <div className="flex-grow relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-purple-500/5 rounded-3xl"></div>
              <div className="relative glass rounded-3xl p-6 border border-white/10 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                        <span className="text-2xl">🍌</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">Brand DNA</h3>
                        <p className="text-white/40 text-xs">Identity Profile</p>
                      </div>
                    </div>
                    {brief.logoImage && (
                      <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-1.5 shadow-lg">
                        <img src={brief.logoImage} className="w-full h-full object-contain" alt="Brand Logo" />
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <i className="fa-solid fa-palette text-pink-400 text-sm"></i>
                      <span className="text-white/70 text-sm font-bold uppercase tracking-wider">Brand Tone</span>
                    </div>
                    {brief.tone.length > 0 ? (
                      <BrandToneVisualizer tones={brief.tone} />
                    ) : (
                      <div className="text-white/30 text-sm italic p-4 bg-white/5 rounded-xl text-center">
                        Define your brand tone to see visualization...
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-yellow-500/30 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <i className="fa-solid fa-chart-pie text-cyan-400 text-sm"></i>
                        <span className="text-white/70 text-xs font-bold uppercase tracking-wider">Age Demographics</span>
                      </div>
                      {brief.targetAudience ? (
                        <AgeDemographicsChart targetAudience={brief.targetAudience} />
                      ) : (
                        <div className="text-white/30 text-xs italic text-center py-4">
                          Define audience to see demographics...
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-yellow-500/30 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="fa-solid fa-bullseye text-purple-400 text-sm"></i>
                        <span className="text-white/70 text-xs font-bold uppercase tracking-wider">Key Features</span>
                      </div>
                      <div className="space-y-1.5">
                        {brief.keyFeatures.length > 0 ? brief.keyFeatures.slice(0, 4).map((f, i) => (
                          <p key={i} className="text-xs text-white/70 truncate flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"></span>
                            {f.trim()}
                          </p>
                        )) : <span className="text-white/30 text-xs italic">Add features...</span>}
                        {brief.keyFeatures.length > 4 && (
                          <p className="text-xs text-white/40">+{brief.keyFeatures.length - 4} more</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 border border-white/5 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fa-solid fa-users text-yellow-400 text-sm"></i>
                      <span className="text-white/70 text-xs font-bold uppercase tracking-wider">Target Audience</span>
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed">
                      {brief.targetAudience || <span className="text-white/30 italic">Define audience...</span>}
                    </p>
                  </div>

                  {(brief.visualStyle || brief.brandDna?.visualStyle) && (
                    <div className="bg-gradient-to-r from-yellow-500/10 to-transparent rounded-xl p-4 border-l-2 border-yellow-500 mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="fa-solid fa-eye text-yellow-400 text-xs"></i>
                        <span className="text-yellow-400/90 text-xs font-bold uppercase tracking-wider">Visual Style</span>
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed">
                        {brief.brandDna?.visualStyle || brief.visualStyle}
                      </p>
                    </div>
                  )}

                  {brief.brandDna && (
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex items-center gap-2 mb-4">
                        <i className="fa-solid fa-fingerprint text-cyan-400/70 text-xs"></i>
                        <span className="text-white/50 text-xs font-medium uppercase tracking-wider">Extended Profile</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {brief.brandDna.brandArchetype && (
                          <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                            <span className="text-white/40 text-[10px] uppercase tracking-wider block mb-1">Archetype</span>
                            <p className="text-white/90 text-sm font-medium">{brief.brandDna.brandArchetype}</p>
                          </div>
                        )}
                        {brief.brandDna.mood && (
                          <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                            <span className="text-white/40 text-[10px] uppercase tracking-wider block mb-1">Mood</span>
                            <p className="text-white/90 text-sm font-medium">{brief.brandDna.mood}</p>
                          </div>
                        )}
                      </div>

                      {brief.brandDna.colorPalette && brief.brandDna.colorPalette.length > 0 && (
                        <div className="mb-4">
                          <span className="text-white/40 text-[10px] uppercase tracking-wider block mb-2">Color Palette</span>
                          <div className="flex gap-2">
                            {brief.brandDna.colorPalette.slice(0, 5).map((color, i) => (
                              <div 
                                key={i} 
                                className="w-10 h-10 rounded-lg shadow-md border border-white/10 flex items-center justify-center group relative"
                                style={{ backgroundColor: color.startsWith('#') ? color : undefined }}
                                title={color}
                              >
                                {!color.startsWith('#') && (
                                  <span className="text-[8px] text-white/60 text-center leading-tight px-0.5">{color.slice(0, 6)}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {brief.brandDna.targetPsychographics && brief.brandDna.targetPsychographics.length > 0 && (
                        <div>
                          <span className="text-white/40 text-[10px] uppercase tracking-wider block mb-2">Psychographics</span>
                          <div className="flex flex-wrap gap-1.5">
                            {brief.brandDna.targetPsychographics.map((p, i) => (
                              <span key={i} className="px-2 py-1 bg-cyan-500/10 rounded text-[10px] text-cyan-300/80 border border-cyan-500/20">
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-6">
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
                <div className="h-48 border-2 border-dashed border-yellow-500/30 rounded-xl flex items-center justify-center text-white/20">
                  <div className="text-center">
                    <i className="fa-solid fa-palette text-3xl mb-2"></i>
                    <p className="text-sm">Upload a product image & generate<br/>to see the cohesive mood board collage.</p>
                  </div>
                </div>
              )}
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
