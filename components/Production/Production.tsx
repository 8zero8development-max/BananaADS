import React, { memo, useMemo, useCallback, useState } from 'react';
import { AdProject, AppStep, Scene } from '../../types';
import BananaPro from '../shared/BananaPro';
import ProgressIndicator, { CompactProgress, InlineProgress } from '../shared/ProgressIndicator';
import EmailTemplateEditor from '../EmailEditor/EmailTemplateEditor';

interface ProductionProps {
  project: AdProject;
  setProject: React.Dispatch<React.SetStateAction<AdProject | null>>;
  setStep: React.Dispatch<React.SetStateAction<AppStep>>;
  selectedFoodPostIdx: number;
  setSelectedFoodPostIdx: React.Dispatch<React.SetStateAction<number>>;
  selectedSocialPostIdx: number;
  setSelectedSocialPostIdx: React.Dispatch<React.SetStateAction<number>>;
  selectedEmailSectionIdx: number;
  setSelectedEmailSectionIdx: React.Dispatch<React.SetStateAction<number>>;
  editInstruction: string;
  setEditInstruction: React.Dispatch<React.SetStateAction<string>>;
  copiedId: string | null;
  generateSceneImage: (idx: number, projectRef?: AdProject) => Promise<void>;
  generateSceneVideo: (idx: number) => Promise<void>;
  generateSocialVideo: (idx: number) => Promise<void>;
  playVoiceover: (idx: number) => Promise<void>;
  handlePolishScript: (idx: number) => Promise<void>;
  handleEditImage: (idx: number) => Promise<void>;
  handleCopyPrompt: (text: string, id: string) => Promise<void>;
  handleDownload: (url: string, filename: string) => void;
}

const Production: React.FC<ProductionProps> = ({
  project,
  setProject,
  setStep,
  selectedFoodPostIdx,
  setSelectedFoodPostIdx,
  selectedSocialPostIdx,
  setSelectedSocialPostIdx,
  selectedEmailSectionIdx,
  setSelectedEmailSectionIdx,
  editInstruction,
  setEditInstruction,
  copiedId,
  generateSceneImage,
  generateSceneVideo,
  generateSocialVideo,
  playVoiceover,
  handlePolishScript,
  handleEditImage,
  handleCopyPrompt,
  handleDownload
}) => {
  const scenesWithImages = useMemo(() => {
    return project.scenes.filter(scene => scene.imageUrl);
  }, [project.scenes]);

  const scenesWithVideos = useMemo(() => {
    return project.scenes.filter(scene => scene.videoUrl);
  }, [project.scenes]);

  const generationProgress = useMemo(() => {
    const total = project.scenes.length;
    const withImages = scenesWithImages.length;
    const withVideos = scenesWithVideos.length;
    return {
      total,
      imagesGenerated: withImages,
      videosGenerated: withVideos,
      imageProgress: total > 0 ? (withImages / total) * 100 : 0,
      videoProgress: total > 0 ? (withVideos / total) * 100 : 0,
    };
  }, [project.scenes.length, scenesWithImages.length, scenesWithVideos.length]);

  const handleStepChange = useCallback(() => {
    setStep(AppStep.CONCEPTS);
  }, [setStep]);

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
                      onClick={handleStepChange}
                      className="px-6 py-2 rounded-full border border-yellow-500/30 text-sm font-medium hover:bg-white/5 transition"
                    >
                      Change Concept
                    </button>
        </div>
      </div>

      {project.projectType === 'food-social' && (
        <FoodSocialLayout
          project={project}
          setProject={setProject}
          selectedFoodPostIdx={selectedFoodPostIdx}
          setSelectedFoodPostIdx={setSelectedFoodPostIdx}
          editInstruction={editInstruction}
          setEditInstruction={setEditInstruction}
          copiedId={copiedId}
          generateSceneImage={generateSceneImage}
          generateSocialVideo={generateSocialVideo}
          handlePolishScript={handlePolishScript}
          handleEditImage={handleEditImage}
          handleCopyPrompt={handleCopyPrompt}
          handleDownload={handleDownload}
        />
      )}

      {project.projectType === 'social' && (
        <SocialLayout
          project={project}
          setProject={setProject}
          selectedSocialPostIdx={selectedSocialPostIdx}
          setSelectedSocialPostIdx={setSelectedSocialPostIdx}
          editInstruction={editInstruction}
          setEditInstruction={setEditInstruction}
          copiedId={copiedId}
          generateSceneImage={generateSceneImage}
          generateSocialVideo={generateSocialVideo}
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

      {project.projectType === 'email' && (
        <EmailLayout
          project={project}
          selectedEmailSectionIdx={selectedEmailSectionIdx}
          setSelectedEmailSectionIdx={setSelectedEmailSectionIdx}
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
    </div>
  );
};

const FacebookPostMockup = memo<{
  brandName: string;
  logoImage?: string;
  postText: string;
  imageUrl?: string;
  videoUrl?: string;
}>(({ brandName, logoImage, postText, imageUrl, videoUrl }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-md mx-auto">
      {/* Facebook Header */}
      <div className="p-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
            {logoImage ? (
              <img src={logoImage} alt={brandName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {brandName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{brandName}</div>
            <div className="text-xs text-gray-500">Sponsored · Just now</div>
          </div>
          <div className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <i className="fa-solid fa-ellipsis-h"></i>
          </div>
        </div>
      </div>

      {/* Post Text */}
      <div className="px-4 pb-3">
        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
          {postText}
        </p>
      </div>

      {/* Post Image or Video */}
      {(videoUrl || imageUrl) && (
        <div className="bg-gray-100">
          {videoUrl ? (
            <video src={videoUrl} controls className="w-full object-cover" />
          ) : (
            <img src={imageUrl} alt="Post" className="w-full object-cover" />
          )}
        </div>
      )}

      {/* Facebook Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-gray-600">
          <button className="flex items-center space-x-2 hover:bg-gray-100 px-3 py-1 rounded transition">
            <i className="fa-solid fa-thumbs-up"></i>
            <span className="text-sm">Like</span>
          </button>
          <button className="flex items-center space-x-2 hover:bg-gray-100 px-3 py-1 rounded transition">
            <i className="fa-solid fa-comment"></i>
            <span className="text-sm">Comment</span>
          </button>
          <button className="flex items-center space-x-2 hover:bg-gray-100 px-3 py-1 rounded transition">
            <i className="fa-solid fa-share"></i>
            <span className="text-sm">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
});

FacebookPostMockup.displayName = 'FacebookPostMockup';

interface FoodSocialLayoutProps {
  project: AdProject;
  setProject: React.Dispatch<React.SetStateAction<AdProject | null>>;
  selectedFoodPostIdx: number;
  setSelectedFoodPostIdx: React.Dispatch<React.SetStateAction<number>>;
  editInstruction: string;
  setEditInstruction: React.Dispatch<React.SetStateAction<string>>;
  copiedId: string | null;
  generateSceneImage: (idx: number, projectRef?: AdProject) => Promise<void>;
  generateSocialVideo: (idx: number) => Promise<void>;
  handlePolishScript: (idx: number) => Promise<void>;
  handleEditImage: (idx: number) => Promise<void>;
  handleCopyPrompt: (text: string, id: string) => Promise<void>;
  handleDownload: (url: string, filename: string) => void;
}

const FoodSocialLayout = memo<FoodSocialLayoutProps>(({
  project,
  setProject,
  selectedFoodPostIdx,
  setSelectedFoodPostIdx,
  editInstruction,
  setEditInstruction,
  copiedId,
  generateSceneImage,
  generateSocialVideo,
  handlePolishScript,
  handleEditImage,
  handleCopyPrompt,
  handleDownload
}) => {
  const scene = useMemo(() => project.scenes[selectedFoodPostIdx], [project.scenes, selectedFoodPostIdx]);
  const idx = selectedFoodPostIdx;

  const handleMotionPromptChange = useCallback((value: string) => {
    setProject(prev => {
      if (!prev) return null;
      const newScenes = [...prev.scenes];
      newScenes[idx] = { ...newScenes[idx], motionPrompt: value };
      return { ...prev, scenes: newScenes };
    });
  }, [setProject, idx]);

  const handleAspectRatioChange = useCallback((value: string) => {
    setProject(prev => {
      if (!prev) return null;
      const newScenes = [...prev.scenes];
      newScenes[idx] = { ...newScenes[idx], aspectRatio: value };
      return { ...prev, scenes: newScenes };
    });
  }, [setProject, idx]);

  return (
    <div className="space-y-8">
      {scene && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-yellow-400">Post #{idx + 1}</span>
              <span className="bg-pink-500/10 text-pink-400 text-[10px] font-bold px-2 py-1 rounded">Instagram / FB</span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/2">
              <FacebookPostMockup
                brandName={project.brief.brandName}
                logoImage={project.brief.logoImage}
                postText={scene.audioScript}
                imageUrl={scene.imageUrl}
                videoUrl={scene.videoUrl}
              />
            </div>

            <div className="lg:w-1/2 glass rounded-[24px] p-6 flex flex-col">
              {scene.selectedCta && (
                <div className="mb-4 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Call to Action</span>
                  <span className="text-yellow-400 font-bold">{scene.selectedCta}</span>
                </div>
              )}

              <div className="mb-4">
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

              <div className="mb-4">
                <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold block mb-2">Motion Prompt</label>
                <textarea
                  rows={2}
                  value={scene.motionPrompt || ''}
                  onChange={(e) => handleMotionPromptChange(e.target.value)}
                  placeholder="Describe the motion: 'Slow zoom in', 'Product rotates', 'Steam rises', etc."
                  className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-2.5 text-sm focus:border-yellow-500 outline-none transition resize-none"
                />
              </div>

              <div className="mb-4">
                <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold block mb-2">Aspect Ratio</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAspectRatioChange('16:9')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                      (scene.aspectRatio || '16:9') === '16:9'
                        ? 'bg-yellow-500 text-black'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Landscape (16:9)
                  </button>
                  <button
                    onClick={() => handleAspectRatioChange('9:16')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                      scene.aspectRatio === '9:16'
                        ? 'bg-yellow-500 text-black'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Portrait (9:16)
                  </button>
                </div>
              </div>

              <div className="flex space-x-2 mb-4">
                <button 
                  onClick={() => generateSceneImage(idx)}
                  disabled={scene.isGeneratingImage}
                  className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-yellow-50 transition flex items-center space-x-2"
                >
                  {scene.isGeneratingImage ? <BananaPro role="artist" size="sm" /> : <i className="fa-solid fa-image"></i>}
                  <span>{scene.imageUrl ? "Regenerate" : "Generate"}</span>
                </button>
                <button 
                  onClick={() => generateSocialVideo(idx)}
                  disabled={scene.isGeneratingVideo || !scene.imageUrl}
                  className="gradient-accent text-black px-4 py-2 rounded-full text-xs font-bold hover:scale-105 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {scene.isGeneratingVideo ? <BananaPro role="cameraman" size="sm" /> : <i className="fa-solid fa-play"></i>}
                  <span>Animate Social Video</span>
                </button>
                {(scene.imageUrl || scene.videoUrl) && (
                  <button
                    onClick={() => handleDownload(scene.videoUrl || scene.imageUrl!, `FoodSocial-Post-${idx + 1}${scene.videoUrl ? '.mp4' : '.png'}`)}
                    className="bg-white/20 backdrop-blur text-white px-3 py-2 rounded-full text-xs font-bold hover:bg-white/30 transition"
                    title={scene.videoUrl ? "Download Video" : "Download Image"}
                  >
                    <i className="fa-solid fa-download"></i>
                  </button>
                )}
              </div>

              {scene.isGeneratingVideo && (
                <div className="mb-4 p-4 bg-black/40 rounded-xl border border-yellow-500/20">
                  <ProgressIndicator 
                    operation="video" 
                    isActive={true} 
                    state="processing"
                    size="sm"
                    customText="Rendering social video"
                  />
                </div>
              )}

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
        </>
      )}

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
                <div className="w-full h-full flex flex-col items-center justify-center p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-lg animate-banana-bounce">🍌</span>
                    <i className="fa-solid fa-image text-purple-400 text-xs animate-pulse"></i>
                  </div>
                  <CompactProgress operation="image" isActive={true} className="w-full" />
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
    </div>
  );
});

FoodSocialLayout.displayName = 'FoodSocialLayout';

interface SocialLayoutProps {
  project: AdProject;
  setProject: React.Dispatch<React.SetStateAction<AdProject | null>>;
  selectedSocialPostIdx: number;
  setSelectedSocialPostIdx: React.Dispatch<React.SetStateAction<number>>;
  editInstruction: string;
  setEditInstruction: React.Dispatch<React.SetStateAction<string>>;
  copiedId: string | null;
  generateSceneImage: (idx: number, projectRef?: AdProject) => Promise<void>;
  generateSocialVideo: (idx: number) => Promise<void>;
  handlePolishScript: (idx: number) => Promise<void>;
  handleEditImage: (idx: number) => Promise<void>;
  handleCopyPrompt: (text: string, id: string) => Promise<void>;
  handleDownload: (url: string, filename: string) => void;
}

const SocialLayout = memo<SocialLayoutProps>(({
  project,
  setProject,
  selectedSocialPostIdx,
  setSelectedSocialPostIdx,
  editInstruction,
  setEditInstruction,
  copiedId,
  generateSceneImage,
  generateSocialVideo,
  handlePolishScript,
  handleEditImage,
  handleCopyPrompt,
  handleDownload
}) => {
  const scene = useMemo(() => project.scenes[selectedSocialPostIdx], [project.scenes, selectedSocialPostIdx]);
  const idx = selectedSocialPostIdx;

  const handleMotionPromptChange = useCallback((value: string) => {
    setProject(prev => {
      if (!prev) return null;
      const newScenes = [...prev.scenes];
      newScenes[idx] = { ...newScenes[idx], motionPrompt: value };
      return { ...prev, scenes: newScenes };
    });
  }, [setProject, idx]);

  const handleAspectRatioChange = useCallback((value: string) => {
    setProject(prev => {
      if (!prev) return null;
      const newScenes = [...prev.scenes];
      newScenes[idx] = { ...newScenes[idx], aspectRatio: value };
      return { ...prev, scenes: newScenes };
    });
  }, [setProject, idx]);

  return (
    <div className="space-y-8">
      {scene && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-yellow-400">Post #{idx + 1}</span>
              <span className="bg-pink-500/10 text-pink-400 text-[10px] font-bold px-2 py-1 rounded">Instagram / FB</span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/2">
              <FacebookPostMockup
                brandName={project.brief.brandName}
                logoImage={project.brief.logoImage}
                postText={scene.audioScript}
                imageUrl={scene.imageUrl}
                videoUrl={scene.videoUrl}
              />
            </div>

            <div className="lg:w-1/2 glass rounded-[24px] p-6 flex flex-col">
              <div className="mb-4">
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

              <div className="mb-4">
                <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold block mb-2">Motion Prompt</label>
                <textarea
                  rows={2}
                  value={scene.motionPrompt || ''}
                  onChange={(e) => handleMotionPromptChange(e.target.value)}
                  placeholder="Describe the motion: 'Slow zoom in', 'Product rotates', 'Steam rises', etc."
                  className="w-full bg-white/5 border border-yellow-500/30 rounded-xl px-4 py-2.5 text-sm focus:border-yellow-500 outline-none transition resize-none"
                />
              </div>

              <div className="mb-4">
                <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold block mb-2">Aspect Ratio</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAspectRatioChange('16:9')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                      (scene.aspectRatio || '16:9') === '16:9'
                        ? 'bg-yellow-500 text-black'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Landscape (16:9)
                  </button>
                  <button
                    onClick={() => handleAspectRatioChange('9:16')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                      scene.aspectRatio === '9:16'
                        ? 'bg-yellow-500 text-black'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Portrait (9:16)
                  </button>
                </div>
              </div>

              <div className="flex space-x-2 mb-4">
                <button 
                  onClick={() => generateSceneImage(idx)}
                  disabled={scene.isGeneratingImage}
                  className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-yellow-50 transition flex items-center space-x-2"
                >
                  {scene.isGeneratingImage ? <BananaPro role="artist" size="sm" /> : <i className="fa-solid fa-image"></i>}
                  <span>{scene.imageUrl ? "Regenerate" : "Generate"}</span>
                </button>
                <button 
                  onClick={() => generateSocialVideo(idx)}
                  disabled={scene.isGeneratingVideo || !scene.imageUrl}
                  className="gradient-accent text-black px-4 py-2 rounded-full text-xs font-bold hover:scale-105 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {scene.isGeneratingVideo ? <BananaPro role="cameraman" size="sm" /> : <i className="fa-solid fa-play"></i>}
                  <span>Animate Social Video</span>
                </button>
                {(scene.imageUrl || scene.videoUrl) && (
                  <button
                    onClick={() => handleDownload(scene.videoUrl || scene.imageUrl!, `SocialPoster-Post-${idx + 1}${scene.videoUrl ? '.mp4' : '.png'}`)}
                    className="bg-white/20 backdrop-blur text-white px-3 py-2 rounded-full text-xs font-bold hover:bg-white/30 transition"
                    title={scene.videoUrl ? "Download Video" : "Download Image"}
                  >
                    <i className="fa-solid fa-download"></i>
                  </button>
                )}
              </div>

              {scene.isGeneratingVideo && (
                <div className="mb-4 p-4 bg-black/40 rounded-xl border border-yellow-500/20">
                  <ProgressIndicator 
                    operation="video" 
                    isActive={true} 
                    state="processing"
                    size="sm"
                    customText="Rendering social video"
                  />
                </div>
              )}

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
        </>
      )}

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
                <div className="w-full h-full flex flex-col items-center justify-center p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-lg animate-banana-bounce">🍌</span>
                    <i className="fa-solid fa-image text-purple-400 text-xs animate-pulse"></i>
                  </div>
                  <CompactProgress operation="image" isActive={true} className="w-full" />
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
    </div>
  );
});

SocialLayout.displayName = 'SocialLayout';

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

const VideoLayout = memo<VideoLayoutProps>(({
  project,
  copiedId,
  generateSceneImage,
  generateSceneVideo,
  playVoiceover,
  handlePolishScript,
  handleCopyPrompt,
  handleDownload
}) => {
  const scenes = useMemo(() => project.scenes, [project.scenes]);

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
                    <ProgressIndicator 
                      operation="image" 
                      isActive={true} 
                      state="processing"
                      size="lg"
                    />
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
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-8">
                <ProgressIndicator 
                  operation="video" 
                  isActive={true} 
                  state="processing"
                  size="lg"
                  customText="Rendering cinematic motion"
                />
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
});

VideoLayout.displayName = 'VideoLayout';

interface EmailLayoutProps {
  project: AdProject;
  selectedEmailSectionIdx: number;
  setSelectedEmailSectionIdx: React.Dispatch<React.SetStateAction<number>>;
  editInstruction: string;
  setEditInstruction: React.Dispatch<React.SetStateAction<string>>;
  copiedId: string | null;
  generateSceneImage: (idx: number, projectRef?: AdProject) => Promise<void>;
  handlePolishScript: (idx: number) => Promise<void>;
  handleEditImage: (idx: number) => Promise<void>;
  handleCopyPrompt: (text: string, id: string) => Promise<void>;
  handleDownload: (url: string, filename: string) => void;
}

const EmailLayout = memo<EmailLayoutProps>(({
  project,
  selectedEmailSectionIdx,
  setSelectedEmailSectionIdx,
  editInstruction,
  setEditInstruction,
  copiedId,
  generateSceneImage,
  handlePolishScript,
  handleEditImage,
  handleCopyPrompt,
  handleDownload
}) => {
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [savedEmailHTML, setSavedEmailHTML] = useState<string>('');
  
  const scene = useMemo(() => project.scenes[selectedEmailSectionIdx], [project.scenes, selectedEmailSectionIdx]);
  const idx = selectedEmailSectionIdx;

  const sectionLabels = ['Hero', 'Body', 'Infographic', 'Footer'];
  
  const allSectionsGenerated = project.scenes.every(s => s.imageUrl);

  const handleSaveTemplate = (html: string) => {
    setSavedEmailHTML(html);
    setShowTemplateEditor(false);
  };

  return (
    <div className="space-y-8">
      {/* Generate HTML Template Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Email Campaign Sections</h3>
          <p className="text-sm text-white/50">Generate all sections, then create your HTML email template</p>
        </div>
        <button
          onClick={() => setShowTemplateEditor(true)}
          disabled={!allSectionsGenerated}
          className={`bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-3 rounded-xl font-bold text-sm transition flex items-center gap-2 ${
            allSectionsGenerated ? 'hover:scale-105' : 'opacity-50 cursor-not-allowed'
          }`}
        >
          <i className="fa-solid fa-code"></i>
          Generate HTML Email
        </button>
      </div>

      {/* Email Template Editor Modal */}
      {showTemplateEditor && project.selectedConcept && (
        <EmailTemplateEditor
          brief={project.brief}
          concept={project.selectedConcept}
          scenes={project.scenes}
          onClose={() => setShowTemplateEditor(false)}
          onSave={handleSaveTemplate}
        />
      )}

      {/* Saved HTML Preview */}
      {savedEmailHTML && !showTemplateEditor && (
        <div className="glass rounded-2xl p-4 border border-green-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-check-circle text-green-400"></i>
              <span className="text-sm font-bold text-green-400">HTML Email Template Saved</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTemplateEditor(true)}
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
              >
                <i className="fa-solid fa-edit mr-1"></i>Edit
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([savedEmailHTML], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${project.brief.brandName}-email.html`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-1.5 rounded-lg text-xs font-medium transition"
              >
                <i className="fa-solid fa-download mr-1"></i>Download HTML
              </button>
            </div>
          </div>
          <p className="text-xs text-white/40">{savedEmailHTML.length.toLocaleString()} characters</p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {project.scenes.map((s, i) => (
          <div 
            key={i}
            onClick={() => setSelectedEmailSectionIdx(i)}
            className={`glass rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${selectedEmailSectionIdx === i ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-black' : 'opacity-70 hover:opacity-100'}`}
          >
            <div className="aspect-video bg-zinc-900 relative">
              {s.imageUrl ? (
                <img src={s.imageUrl} className="w-full h-full object-cover" alt={`Section ${i + 1}`} />
              ) : s.isGeneratingImage ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-lg animate-banana-bounce">🍌</span>
                    <i className="fa-solid fa-envelope text-blue-400 text-xs animate-pulse"></i>
                  </div>
                  <CompactProgress operation="image" isActive={true} className="w-full" />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <i className="fa-solid fa-envelope text-white/20 text-2xl"></i>
                </div>
              )}
              {selectedEmailSectionIdx === i && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <i className="fa-solid fa-check text-white text-xs"></i>
                </div>
              )}
            </div>
            <div className="p-3 bg-zinc-900/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400">{sectionLabels[i] || `Section ${i + 1}`}</span>
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
                  <img src={scene.imageUrl} className="w-full h-full object-cover" alt={`Section ${idx + 1}`} />
                ) : scene.isGeneratingImage ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 p-8">
                    <ProgressIndicator 
                      operation="image" 
                      isActive={true} 
                      state="processing"
                      size="lg"
                      customText="Generating email section"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <i className="fa-solid fa-envelope text-white/20 text-2xl"></i>
                    </div>
                    <p className="text-white/40 font-medium">Section visual not generated</p>
                  </div>
                )}
              </div>
              
              <div className="absolute bottom-4 left-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => generateSceneImage(idx)}
                  disabled={scene.isGeneratingImage}
                  className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-blue-50 transition flex items-center space-x-2"
                >
                  {scene.isGeneratingImage ? <BananaPro role="artist" size="sm" /> : <i className="fa-solid fa-image"></i>}
                  <span>{scene.imageUrl ? "Regenerate" : "Generate"}</span>
                </button>
                {scene.imageUrl && (
                  <button
                    onClick={() => handleDownload(scene.imageUrl!, `Email-${sectionLabels[idx] || `Section-${idx + 1}`}.png`)}
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
                  <span className="text-sm font-bold text-blue-400">{sectionLabels[idx] || `Section ${idx + 1}`}</span>
                  <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-1 rounded">Email Section</span>
                </div>
              </div>

              <div className="flex-1 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Email Content</label>
                  <button 
                    onClick={() => handlePolishScript(idx)}
                    disabled={scene.isPolishingScript}
                    className="text-[10px] bg-blue-500/10 hover:bg-blue-500/30 text-blue-300 px-2 py-1 rounded transition flex items-center gap-1"
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
                <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold block mb-2">Edit Section with AI</label>
                <div className="flex gap-0">
                  <div className="relative flex-grow">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"><i className="fa-solid fa-wand-magic-sparkles"></i></span>
                    <input 
                      type="text"
                      value={editInstruction}
                      onChange={(e) => setEditInstruction(e.target.value)}
                      placeholder="Change colors, add CTA button..."
                      className="w-full bg-white/5 border border-blue-500/30 rounded-l-xl pl-9 pr-4 py-2.5 text-sm focus:border-blue-500 outline-none transition"
                    />
                  </div>
                  <button 
                    onClick={() => handleEditImage(idx)}
                    disabled={!editInstruction || !scene.imageUrl || scene.isGeneratingImage}
                    className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-y border-r border-blue-500/30 px-4 py-2.5 rounded-r-xl font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <span className="text-[9px] text-white/40">Visual Prompt</span>
                      <button 
                        onClick={() => handleCopyPrompt(scene.visualPrompt, `${idx}-vis`)}
                        className="text-[9px] text-white/40 hover:text-white transition"
                      >
                        {copiedId === `${idx}-vis` ? <span className="text-green-400">Copied</span> : 'Copy'}
                      </button>
                    </div>
                    <p className="text-white/60 text-[11px] leading-relaxed italic line-clamp-3">"{scene.visualPrompt}"</p>
                  </div>
                </div>
              </details>

              <div className="mt-auto pt-4 flex items-center space-x-3 border-t border-white/5">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-white/10 border-2 border-black flex items-center justify-center text-[8px]"><i className="fa-solid fa-robot"></i></div>
                  <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-black flex items-center justify-center text-[8px] text-white"><i className="fa-solid fa-envelope"></i></div>
                </div>
                <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">AI Email Designer</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

EmailLayout.displayName = 'EmailLayout';

export default Production;
