import React from 'react';
import { AdProject, AppStep } from '../../types';
import BananaPro from '../shared/BananaPro';

interface ProductionProps {
  project: AdProject;
  setProject: React.Dispatch<React.SetStateAction<AdProject | null>>;
  setStep: React.Dispatch<React.SetStateAction<AppStep>>;
  selectedFoodPostIdx: number;
  setSelectedFoodPostIdx: React.Dispatch<React.SetStateAction<number>>;
  selectedSocialPostIdx: number;
  setSelectedSocialPostIdx: React.Dispatch<React.SetStateAction<number>>;
  editInstruction: string;
  setEditInstruction: React.Dispatch<React.SetStateAction<string>>;
  copiedId: string | null;
  generateSceneImage: (idx: number, projectRef?: AdProject) => Promise<void>;
  generateSceneVideo: (idx: number) => Promise<void>;
  playVoiceover: (idx: number) => Promise<void>;
  handlePolishScript: (idx: number) => Promise<void>;
  handleEditImage: (idx: number) => Promise<void>;
  handleCopyPrompt: (text: string, id: string) => Promise<void>;
  handleDownload: (url: string, filename: string) => void;
}

const Production: React.FC<ProductionProps> = ({
  project,
  setStep,
  selectedFoodPostIdx,
  setSelectedFoodPostIdx,
  selectedSocialPostIdx,
  setSelectedSocialPostIdx,
  editInstruction,
  setEditInstruction,
  copiedId,
  generateSceneImage,
  generateSceneVideo,
  playVoiceover,
  handlePolishScript,
  handleEditImage,
  handleCopyPrompt,
  handleDownload
}) => {
  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-serif gradient-text">{project.selectedConcept?.title}</h1>
            <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">Selected</span>
          </div>
          {project.projectType === 'food-social' && project.scenes.length > 0 && (
            <p className="text-white/50">Generating {project.scenes.length} posts with different CTAs</p>
          )}
        </div>
        <div className="flex space-x-4">
          <button 
            onClick={() => setStep(AppStep.CONCEPTS)}
            className="px-6 py-2 rounded-full border border-yellow-500/30 text-sm font-medium hover:bg-white/5 transition"
          >
            Change Concept
          </button>
        </div>
      </div>

      {project.projectType === 'food-social' && (
        <FoodSocialLayout
          project={project}
          selectedFoodPostIdx={selectedFoodPostIdx}
          setSelectedFoodPostIdx={setSelectedFoodPostIdx}
          editInstruction={editInstruction}
          setEditInstruction={setEditInstruction}
          copiedId={copiedId}
          generateSceneImage={generateSceneImage}
          handlePolishScript={handlePolishScript}
          handleEditImage={handleEditImage}
          handleCopyPrompt={handleCopyPrompt}
          handleDownload={handleDownload}
        />
      )}

      {project.projectType === 'social' && (
        <SocialLayout
          project={project}
          selectedSocialPostIdx={selectedSocialPostIdx}
          setSelectedSocialPostIdx={setSelectedSocialPostIdx}
          editInstruction={editInstruction}
          setEditInstruction={setEditInstruction}
          copiedId={copiedId}
          generateSceneImage={generateSceneImage}
          handlePolishScript={handlePolishScript}
          handleEditImage={handleEditImage}
          handleCopyPrompt={handleCopyPrompt}
          handleDownload={handleDownload}
        />
      )}

      {project.projectType === 'video' && (
        <VideoLayout
          project={project}
          copiedId={copiedId}
          generateSceneImage={generateSceneImage}
          generateSceneVideo={generateSceneVideo}
          playVoiceover={playVoiceover}
          handlePolishScript={handlePolishScript}
          handleCopyPrompt={handleCopyPrompt}
          handleDownload={handleDownload}
        />
      )}
    </div>
  );
};

interface FoodSocialLayoutProps {
  project: AdProject;
  selectedFoodPostIdx: number;
  setSelectedFoodPostIdx: React.Dispatch<React.SetStateAction<number>>;
  editInstruction: string;
  setEditInstruction: React.Dispatch<React.SetStateAction<string>>;
  copiedId: string | null;
  generateSceneImage: (idx: number, projectRef?: AdProject) => Promise<void>;
  handlePolishScript: (idx: number) => Promise<void>;
  handleEditImage: (idx: number) => Promise<void>;
  handleCopyPrompt: (text: string, id: string) => Promise<void>;
  handleDownload: (url: string, filename: string) => void;
}

const FoodSocialLayout: React.FC<FoodSocialLayoutProps> = ({
  project,
  selectedFoodPostIdx,
  setSelectedFoodPostIdx,
  editInstruction,
  setEditInstruction,
  copiedId,
  generateSceneImage,
  handlePolishScript,
  handleEditImage,
  handleCopyPrompt,
  handleDownload
}) => {
  const scene = project.scenes[selectedFoodPostIdx];
  const idx = selectedFoodPostIdx;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4">
        {project.scenes.map((s, i) => (
          <div 
            key={i}
            onClick={() => setSelectedFoodPostIdx(i)}
            className={`glass rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${selectedFoodPostIdx === i ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-black' : 'opacity-70 hover:opacity-100'}`}
          >
            <div className="aspect-video bg-zinc-900 relative">
              {s.imageUrl ? (
                <img src={s.imageUrl} className="w-full h-full object-cover" alt={`Post ${i + 1}`} />
              ) : s.isGeneratingImage ? (
                <div className="w-full h-full flex items-center justify-center">
                  <BananaPro role="artist" size="sm" />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <i className="fa-solid fa-image text-white/20 text-2xl"></i>
                </div>
              )}
              {selectedFoodPostIdx === i && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                  <i className="fa-solid fa-check text-black text-xs"></i>
                </div>
              )}
            </div>
            <div className="p-3 bg-zinc-900/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-yellow-400">Post #{i + 1}</span>
                {s.selectedCta && (
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full truncate max-w-[120px]">{s.selectedCta}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {scene && (
        <div className="glass rounded-[40px] overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-3/5 bg-black relative group">
              <div className="aspect-video w-full">
                {scene.imageUrl ? (
                  <img src={scene.imageUrl} className="w-full h-full object-cover" alt={`Post ${idx + 1}`} />
                ) : scene.isGeneratingImage ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900">
                    <BananaPro role="artist" size="md" />
                    <p className="text-sm font-bold tracking-widest uppercase mt-4">Auto-Rendering...</p>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <i className="fa-solid fa-image text-white/20 text-2xl"></i>
                    </div>
                    <p className="text-white/40 font-medium">Image not generated</p>
                  </div>
                )}
              </div>
              
              <div className="absolute bottom-4 left-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => generateSceneImage(idx)}
                  disabled={scene.isGeneratingImage}
                  className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-yellow-50 transition flex items-center space-x-2"
                >
                  {scene.isGeneratingImage ? <BananaPro role="artist" size="sm" /> : <i className="fa-solid fa-image"></i>}
                  <span>{scene.imageUrl ? "Regenerate" : "Generate"}</span>
                </button>
                {scene.imageUrl && (
                  <button
                    onClick={() => handleDownload(scene.imageUrl!, `FoodSocial-Post-${idx + 1}.png`)}
                    className="bg-white/20 backdrop-blur text-white px-3 py-2 rounded-full text-xs font-bold hover:bg-white/30 transition"
                  >
                    <i className="fa-solid fa-download"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="lg:w-2/5 p-6 flex flex-col border-l border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-yellow-400">Post #{idx + 1}</span>
                  <span className="bg-pink-500/10 text-pink-400 text-[10px] font-bold px-2 py-1 rounded">Instagram / FB</span>
                </div>
              </div>

              {scene.selectedCta && (
                <div className="mb-4 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Call to Action</span>
                  <span className="text-yellow-400 font-bold">{scene.selectedCta}</span>
                </div>
              )}

              <div className="flex-1 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Post Caption</label>
                  <button 
                    onClick={() => handlePolishScript(idx)}
                    disabled={scene.isPolishingScript}
                    className="text-[10px] bg-yellow-500/10 hover:bg-yellow-500/30 text-yellow-300 px-2 py-1 rounded transition flex items-center gap-1"
                  >
                    {scene.isPolishingScript ? <BananaPro role="writer" size="sm" /> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                    <span>Polish</span>
                  </button>
                </div>
                <div className="bg-black/30 rounded-xl p-4 max-h-[200px] overflow-y-auto">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{scene.audioScript}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold block mb-2">Edit Image with AI</label>
                <div className="flex gap-0">
                  <div className="relative flex-grow">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"><i className="fa-solid fa-wand-magic-sparkles"></i></span>
                    <input 
                      type="text"
                      value={editInstruction}
                      onChange={(e) => setEditInstruction(e.target.value)}
                      placeholder="Add smoke, change background..."
                      className="w-full bg-white/5 border border-yellow-500/30 rounded-l-xl pl-9 pr-4 py-2.5 text-sm focus:border-yellow-500 outline-none transition"
                    />
                  </div>
                  <button 
                    onClick={() => handleEditImage(idx)}
                    disabled={!editInstruction || !scene.imageUrl || scene.isGeneratingImage}
                    className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border-y border-r border-yellow-500/30 px-4 py-2.5 rounded-r-xl font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <details className="group">
                <summary className="text-[10px] uppercase tracking-widest text-white/30 font-bold cursor-pointer hover:text-white/50 transition flex items-center gap-2 mb-2">
                  <i className="fa-solid fa-chevron-right text-[8px] transition-transform group-open:rotate-90"></i>
                  Advanced Prompts
                </summary>
                <div className="space-y-3 pl-4 border-l border-white/10">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] text-white/40">Graphic Design Prompt</span>
                      <button 
                        onClick={() => handleCopyPrompt(scene.visualPrompt, `${idx}-vis`)}
                        className="text-[9px] text-white/40 hover:text-white transition"
                      >
                        {copiedId === `${idx}-vis` ? <span className="text-green-400">Copied</span> : 'Copy'}
                      </button>
                    </div>
                    <p className="text-white/60 text-[11px] leading-relaxed italic line-clamp-3">"{scene.visualPrompt}"</p>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] text-white/40">Nano Banana Prompt</span>
                      <button 
                        onClick={() => handleCopyPrompt(`generate_img("Generate a high-end cinematic advertising shot. Description: ${scene.visualPrompt}. 8k, professional lighting, photorealistic.")`, `${idx}-nano`)}
                        className="text-[9px] text-white/40 hover:text-white transition"
                      >
                        {copiedId === `${idx}-nano` ? <span className="text-green-400">Copied</span> : 'Copy'}
                      </button>
                    </div>
                    <div className="bg-black/40 rounded p-2 border border-yellow-500/20">
                      <p className="text-white/50 text-[10px] font-mono line-clamp-2">generate_img("...")</p>
                    </div>
                  </div>
                </div>
              </details>

              <div className="mt-auto pt-4 flex items-center space-x-3 border-t border-white/5">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-white/10 border-2 border-black flex items-center justify-center text-[8px]"><i className="fa-solid fa-robot"></i></div>
                  <div className="w-6 h-6 rounded-full bg-yellow-500 border-2 border-black flex items-center justify-center text-[8px] text-black"><i className="fa-solid fa-wand-magic-sparkles"></i></div>
                </div>
                <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">AI Assisted</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SocialLayoutProps {
  project: AdProject;
  selectedSocialPostIdx: number;
  setSelectedSocialPostIdx: React.Dispatch<React.SetStateAction<number>>;
  editInstruction: string;
  setEditInstruction: React.Dispatch<React.SetStateAction<string>>;
  copiedId: string | null;
  generateSceneImage: (idx: number, projectRef?: AdProject) => Promise<void>;
  handlePolishScript: (idx: number) => Promise<void>;
  handleEditImage: (idx: number) => Promise<void>;
  handleCopyPrompt: (text: string, id: string) => Promise<void>;
  handleDownload: (url: string, filename: string) => void;
}

const SocialLayout: React.FC<SocialLayoutProps> = ({
  project,
  selectedSocialPostIdx,
  setSelectedSocialPostIdx,
  editInstruction,
  setEditInstruction,
  copiedId,
  generateSceneImage,
  handlePolishScript,
  handleEditImage,
  handleCopyPrompt,
  handleDownload
}) => {
  const scene = project.scenes[selectedSocialPostIdx];
  const idx = selectedSocialPostIdx;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4">
        {project.scenes.map((s, i) => (
          <div 
            key={i}
            onClick={() => setSelectedSocialPostIdx(i)}
            className={`glass rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${selectedSocialPostIdx === i ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-black' : 'opacity-70 hover:opacity-100'}`}
          >
            <div className="aspect-[3/4] bg-zinc-900 relative">
              {s.imageUrl ? (
                <img src={s.imageUrl} className="w-full h-full object-cover" alt={`Post ${i + 1}`} />
              ) : s.isGeneratingImage ? (
                <div className="w-full h-full flex items-center justify-center">
                  <BananaPro role="artist" size="sm" />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <i className="fa-solid fa-image text-white/20 text-2xl"></i>
                </div>
              )}
              {selectedSocialPostIdx === i && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                  <i className="fa-solid fa-check text-black text-xs"></i>
                </div>
              )}
            </div>
            <div className="p-3 bg-zinc-900/50">
              <span className="text-xs font-bold text-yellow-400">Post #{i + 1}</span>
            </div>
          </div>
        ))}
      </div>

      {scene && (
        <div className="glass rounded-[40px] overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-5/12 bg-black relative group flex items-center justify-center">
              <div className="aspect-[3/4] h-[500px]">
                {scene.imageUrl ? (
                  <img src={scene.imageUrl} className="w-full h-full object-cover" alt={`Post ${idx + 1}`} />
                ) : scene.isGeneratingImage ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900">
                    <BananaPro role="artist" size="md" />
                    <p className="text-sm font-bold tracking-widest uppercase mt-4">Auto-Rendering...</p>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <i className="fa-solid fa-image text-white/20 text-2xl"></i>
                    </div>
                    <p className="text-white/40 font-medium">Image not generated</p>
                  </div>
                )}
              </div>
              
              <div className="absolute bottom-4 left-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => generateSceneImage(idx)}
                  disabled={scene.isGeneratingImage}
                  className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-yellow-50 transition flex items-center space-x-2"
                >
                  {scene.isGeneratingImage ? <BananaPro role="artist" size="sm" /> : <i className="fa-solid fa-image"></i>}
                  <span>{scene.imageUrl ? "Regenerate" : "Generate"}</span>
                </button>
                {scene.imageUrl && (
                  <button
                    onClick={() => handleDownload(scene.imageUrl!, `SocialPoster-Post-${idx + 1}.png`)}
                    className="bg-white/20 backdrop-blur text-white px-3 py-2 rounded-full text-xs font-bold hover:bg-white/30 transition"
                  >
                    <i className="fa-solid fa-download"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="lg:w-7/12 p-6 flex flex-col border-l border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-yellow-400">Post #{idx + 1}</span>
                  <span className="bg-pink-500/10 text-pink-400 text-[10px] font-bold px-2 py-1 rounded">Instagram / FB</span>
                </div>
              </div>

              <div className="flex-1 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Post Caption</label>
                  <button 
                    onClick={() => handlePolishScript(idx)}
                    disabled={scene.isPolishingScript}
                    className="text-[10px] bg-yellow-500/10 hover:bg-yellow-500/30 text-yellow-300 px-2 py-1 rounded transition flex items-center gap-1"
                  >
                    {scene.isPolishingScript ? <BananaPro role="writer" size="sm" /> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                    <span>Polish</span>
                  </button>
                </div>
                <div className="bg-black/30 rounded-xl p-4 max-h-[200px] overflow-y-auto">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{scene.audioScript}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold block mb-2">Edit Image with AI</label>
                <div className="flex gap-0">
                  <div className="relative flex-grow">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"><i className="fa-solid fa-wand-magic-sparkles"></i></span>
                    <input 
                      type="text"
                      value={editInstruction}
                      onChange={(e) => setEditInstruction(e.target.value)}
                      placeholder="Change colors, add effects..."
                      className="w-full bg-white/5 border border-yellow-500/30 rounded-l-xl pl-9 pr-4 py-2.5 text-sm focus:border-yellow-500 outline-none transition"
                    />
                  </div>
                  <button 
                    onClick={() => handleEditImage(idx)}
                    disabled={!editInstruction || !scene.imageUrl || scene.isGeneratingImage}
                    className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border-y border-r border-yellow-500/30 px-4 py-2.5 rounded-r-xl font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <details className="group">
                <summary className="text-[10px] uppercase tracking-widest text-white/30 font-bold cursor-pointer hover:text-white/50 transition flex items-center gap-2 mb-2">
                  <i className="fa-solid fa-chevron-right text-[8px] transition-transform group-open:rotate-90"></i>
                  Advanced Prompts
                </summary>
                <div className="space-y-3 pl-4 border-l border-white/10">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] text-white/40">Graphic Design Prompt</span>
                      <button 
                        onClick={() => handleCopyPrompt(scene.visualPrompt, `${idx}-vis`)}
                        className="text-[9px] text-white/40 hover:text-white transition"
                      >
                        {copiedId === `${idx}-vis` ? <span className="text-green-400">Copied</span> : 'Copy'}
                      </button>
                    </div>
                    <p className="text-white/60 text-[11px] leading-relaxed italic line-clamp-3">"{scene.visualPrompt}"</p>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] text-white/40">Nano Banana Prompt</span>
                      <button 
                        onClick={() => handleCopyPrompt(`generate_img("Generate a high-end cinematic advertising shot. Description: ${scene.visualPrompt}. 8k, professional lighting, photorealistic.")`, `${idx}-nano`)}
                        className="text-[9px] text-white/40 hover:text-white transition"
                      >
                        {copiedId === `${idx}-nano` ? <span className="text-green-400">Copied</span> : 'Copy'}
                      </button>
                    </div>
                    <div className="bg-black/40 rounded p-2 border border-yellow-500/20">
                      <p className="text-white/50 text-[10px] font-mono line-clamp-2">generate_img("...")</p>
                    </div>
                  </div>
                </div>
              </details>

              <div className="mt-auto pt-4 flex items-center space-x-3 border-t border-white/5">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-white/10 border-2 border-black flex items-center justify-center text-[8px]"><i className="fa-solid fa-robot"></i></div>
                  <div className="w-6 h-6 rounded-full bg-yellow-500 border-2 border-black flex items-center justify-center text-[8px] text-black"><i className="fa-solid fa-wand-magic-sparkles"></i></div>
                </div>
                <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">AI Assisted</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface VideoLayoutProps {
  project: AdProject;
  copiedId: string | null;
  generateSceneImage: (idx: number, projectRef?: AdProject) => Promise<void>;
  generateSceneVideo: (idx: number) => Promise<void>;
  playVoiceover: (idx: number) => Promise<void>;
  handlePolishScript: (idx: number) => Promise<void>;
  handleCopyPrompt: (text: string, id: string) => Promise<void>;
  handleDownload: (url: string, filename: string) => void;
}

const VideoLayout: React.FC<VideoLayoutProps> = ({
  project,
  copiedId,
  generateSceneImage,
  generateSceneVideo,
  playVoiceover,
  handlePolishScript,
  handleCopyPrompt,
  handleDownload
}) => {
  return (
    <div className="space-y-12">
      {project.scenes.map((scene, idx) => (
        <div key={idx} className={`glass rounded-[40px] overflow-hidden flex flex-col md:flex-row min-h-[400px]`}>
          <div className="md:w-3/5 bg-black relative group flex items-center justify-center bg-zinc-900/50">
            <div className="relative aspect-video w-full">
              {scene.videoUrl ? (
                <video 
                  src={scene.videoUrl} 
                  controls 
                  className="w-full h-full object-cover"
                />
              ) : scene.imageUrl ? (
                <img 
                  src={scene.imageUrl} 
                  className="w-full h-full object-cover" 
                  alt={`Scene ${scene.sceneNumber}`}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-4 p-12 text-center bg-black">
                  {scene.isGeneratingImage ? (
                    <>
                      <BananaPro role="artist" size="md" />
                      <p className="text-sm font-bold tracking-widest uppercase">Auto-Rendering...</p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                        <i className="fa-solid fa-camera-movie text-white/20 text-3xl"></i>
                      </div>
                      <div>
                        <p className="font-bold text-lg text-white/40">Visualization Required</p>
                        <p className="text-sm text-white/20">Scene {scene.sceneNumber} visualization not generated</p>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              {(scene.imageUrl || scene.videoUrl) && (
                <button
                  onClick={() => handleDownload(scene.videoUrl || scene.imageUrl!, `NanoAds-Scene-${scene.sceneNumber}${scene.videoUrl ? '.mp4' : '.png'}`)}
                  className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-md transition z-20 opacity-0 group-hover:opacity-100 border border-white/10"
                  title="Download Asset"
                >
                  <i className="fa-solid fa-download"></i>
                </button>
              )}
            </div>
            
            <div className="absolute bottom-6 left-6 flex space-x-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <button 
                onClick={() => generateSceneImage(idx)}
                disabled={scene.isGeneratingImage}
                className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-yellow-50 transition flex items-center space-x-2"
              >
                {scene.isGeneratingImage ? <BananaPro role="artist" size="sm" /> : <i className="fa-solid fa-image"></i>}
                <span>{scene.imageUrl ? "Regenerate Image" : "Generate Image"}</span>
              </button>
              
              <button 
                onClick={() => generateSceneVideo(idx)}
                disabled={scene.isGeneratingVideo || !scene.imageUrl}
                className="gradient-accent text-black px-4 py-2 rounded-full text-xs font-bold hover:scale-105 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scene.isGeneratingVideo ? <BananaPro role="cameraman" size="sm" /> : <i className="fa-solid fa-play"></i>}
                <span>Animate Cinematic Video</span>
              </button>
            </div>
            {(scene.isGeneratingVideo) && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                <BananaPro role="cameraman" size="md" />
                <p className="text-sm font-bold tracking-widest uppercase mt-4">Rendering Cinematic Motion...</p>
              </div>
            )}
          </div>
          
          <div className="md:w-2/5 p-10 flex flex-col border-l border-white/5">
            <div className="flex items-center justify-between mb-8">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
                Scene {scene.sceneNumber}
              </span>
              <span className="bg-yellow-500/10 text-yellow-400 text-[10px] font-bold px-2 py-1 rounded">Veo Optimized (8s)</span>
              <button 
                onClick={() => playVoiceover(idx)}
                disabled={scene.isGeneratingVoice}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-yellow-500/20 hover:text-yellow-400 transition"
              >
                {scene.isGeneratingVoice ? <BananaPro role="voice" size="sm" /> : <i className="fa-solid fa-volume-high"></i>}
              </button>
            </div>
            
            <div className="mb-8">
              <div className="flex justify-between items-end mb-2">
                <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold block">
                  Cinematography Prompt
                </label>
                <button 
                  onClick={() => handleCopyPrompt(scene.visualPrompt, `${idx}-vis`)}
                  className="text-[10px] text-white/40 hover:text-white transition flex items-center gap-1.5"
                >
                  {copiedId === `${idx}-vis` ? (
                    <><i className="fa-solid fa-check text-green-400"></i> <span className="text-green-400 font-bold">Copied</span></>
                  ) : (
                    <><i className="fa-regular fa-copy"></i> Copy</>
                  )}
                </button>
              </div>
              <p className="text-white/80 text-sm leading-relaxed italic border-l-2 border-yellow-500/30 pl-4">"{scene.visualPrompt}"</p>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-end mb-2">
                <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold block">Nano Banana Prompt <span className="text-[9px] font-normal normal-case text-white/20">(Image Gen)</span></label>
                <button 
                  onClick={() => handleCopyPrompt(
                    `Generate a high-end cinematic advertising shot. Description: ${scene.visualPrompt}. 8k, professional lighting, photorealistic.`, 
                    `${idx}-nano`
                  )}
                  className="text-[10px] text-white/40 hover:text-white transition flex items-center gap-1.5"
                >
                  {copiedId === `${idx}-nano` ? (
                    <><i className="fa-solid fa-check text-green-400"></i> <span className="text-green-400 font-bold">Copied</span></>
                  ) : (
                    <><i className="fa-regular fa-copy"></i> Copy</>
                  )}
                </button>
              </div>
              <div className="bg-black/40 rounded p-3 border border-yellow-500/20 relative group">
                <p className="text-white/60 text-xs font-mono break-words leading-tight">
                  <span className="text-yellow-500/50">generate_img(</span>
                  "Generate a high-end cinematic advertising shot. Description: <span className="text-white">{scene.visualPrompt}</span>. 8k, professional lighting, photorealistic."
                  <span className="text-yellow-500/50">)</span>
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold block">
                  Audio Script
                </label>
                <button 
                  onClick={() => handlePolishScript(idx)}
                  disabled={scene.isPolishingScript}
                  className="text-[10px] bg-yellow-500/10 hover:bg-yellow-500/30 text-yellow-300 px-2 py-1 rounded transition flex items-center gap-1"
                >
                  {scene.isPolishingScript ? <BananaPro role="writer" size="sm" /> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                  <span>Polish Copy</span>
                </button>
              </div>
              <p className="text-xl font-medium leading-snug whitespace-pre-wrap">{scene.audioScript}</p>
            </div>
            <div className="mt-auto pt-10 flex items-center space-x-4">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-black flex items-center justify-center text-[10px]"><i className="fa-solid fa-robot"></i></div>
                <div className="w-8 h-8 rounded-full bg-yellow-500 border-2 border-black flex items-center justify-center text-[10px] text-black"><i className="fa-solid fa-wand-magic-sparkles"></i></div>
              </div>
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">AI Assisted Production</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Production;
