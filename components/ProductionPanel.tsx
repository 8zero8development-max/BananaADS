import React, { useState, useCallback } from 'react';
import { AdProject, Scene } from '../types';
import { useGeminiService } from '../hooks/useGeminiService';
import { decodeBase64, decodeAudioData } from '../utils/audioUtils';

interface ProductionPanelProps {
  project: AdProject;
  onChangeConcept: () => void;
  onUpdateProject: (project: AdProject) => void;
  onExport: () => void;
}

const ProductionPanel: React.FC<ProductionPanelProps> = ({
  project,
  onChangeConcept,
  onUpdateProject,
  onExport,
}) => {
  const {
    generateStoryboardImage,
    generateFoodHeroImage,
    editHeroImage,
    generateCinematicVideo,
    generateVoiceover,
    polishSceneScript,
    generateFoodSocialPost,
    loading,
    error,
  } = useGeminiService();

  const [editInstruction, setEditInstruction] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generateSceneImage = useCallback(async (idx: number) => {
    onUpdateProject({
      ...project,
      scenes: project.scenes.map((scene, i) =>
        i === idx ? { ...scene, isGeneratingImage: true } : scene
      ),
    });

    try {
      let imageUrl: string;

      if (project.projectType === 'food-social' && project.selectedConcept) {
        imageUrl = await generateFoodHeroImage(
          project.brief,
          project.selectedConcept,
          project.scenes[idx].selectedCta || ''
        );
      } else {
        const previousSceneImage = idx > 0 ? project.scenes[idx - 1].imageUrl : undefined;
        const aspectRatio = project.projectType === 'video' ? '16:9' : '3:4';

        imageUrl = await generateStoryboardImage(
          project.scenes[idx].visualPrompt,
          project.brief.productImage,
          previousSceneImage,
          aspectRatio
        );
      }

      onUpdateProject({
        ...project,
        scenes: project.scenes.map((scene, i) =>
          i === idx ? { ...scene, imageUrl, isGeneratingImage: false } : scene
        ),
      });
    } catch (err) {
      console.error('Error generating image:', err);
      onUpdateProject({
        ...project,
        scenes: project.scenes.map((scene, i) =>
          i === idx ? { ...scene, isGeneratingImage: false } : scene
        ),
      });
    }
  }, [project, generateStoryboardImage, generateFoodHeroImage, onUpdateProject]);

  const handleEditImage = useCallback(async (idx: number) => {
    if (!project.scenes[idx].imageUrl || !editInstruction) return;

    onUpdateProject({
      ...project,
      scenes: project.scenes.map((scene, i) =>
        i === idx ? { ...scene, isGeneratingImage: true } : scene
      ),
    });

    try {
      const newUrl = await editHeroImage(project.scenes[idx].imageUrl!, editInstruction);
      onUpdateProject({
        ...project,
        scenes: project.scenes.map((scene, i) =>
          i === idx ? { ...scene, imageUrl: newUrl, isGeneratingImage: false } : scene
        ),
      });
      setEditInstruction('');
    } catch (err) {
      console.error('Edit failed:', err);
      onUpdateProject({
        ...project,
        scenes: project.scenes.map((scene, i) =>
          i === idx ? { ...scene, isGeneratingImage: false } : scene
        ),
      });
    }
  }, [project, editInstruction, editHeroImage, onUpdateProject]);

  const generateSceneVideo = useCallback(async (idx: number) => {
    onUpdateProject({
      ...project,
      scenes: project.scenes.map((scene, i) =>
        i === idx ? { ...scene, isGeneratingVideo: true } : scene
      ),
    });

    try {
      const videoUrl = await generateCinematicVideo(
        project.scenes[idx].visualPrompt,
        project.scenes[idx].imageUrl
      );
      onUpdateProject({
        ...project,
        scenes: project.scenes.map((scene, i) =>
          i === idx ? { ...scene, videoUrl, isGeneratingVideo: false } : scene
        ),
      });
    } catch (err) {
      console.error('Error generating video:', err);
      onUpdateProject({
        ...project,
        scenes: project.scenes.map((scene, i) =>
          i === idx ? { ...scene, isGeneratingVideo: false } : scene
        ),
      });
    }
  }, [project, generateCinematicVideo, onUpdateProject]);

  const playVoiceover = useCallback(async (idx: number) => {
    onUpdateProject({
      ...project,
      scenes: project.scenes.map((scene, i) =>
        i === idx ? { ...scene, isGeneratingVoice: true } : scene
      ),
    });

    try {
      const base64Audio = await generateVoiceover(
        project.scenes[idx].audioScript,
        project.brief.voiceName
      );
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000
      });
      const decodedData = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(decodedData, audioCtx, 24000, 1);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();
    } catch (err) {
      console.error('Error generating voiceover:', err);
    } finally {
      onUpdateProject({
        ...project,
        scenes: project.scenes.map((scene, i) =>
          i === idx ? { ...scene, isGeneratingVoice: false } : scene
        ),
      });
    }
  }, [project, generateVoiceover, onUpdateProject]);

  const handlePolishScript = useCallback(async (idx: number) => {
    onUpdateProject({
      ...project,
      scenes: project.scenes.map((scene, i) =>
        i === idx ? { ...scene, isPolishingScript: true } : scene
      ),
    });

    try {
      const polished = await polishSceneScript(
        project.scenes[idx].audioScript,
        project.brief.tone
      );
      onUpdateProject({
        ...project,
        scenes: project.scenes.map((scene, i) =>
          i === idx ? { ...scene, audioScript: polished, isPolishingScript: false } : scene
        ),
      });
    } catch (err) {
      console.error('Failed to polish script:', err);
      onUpdateProject({
        ...project,
        scenes: project.scenes.map((scene, i) =>
          i === idx ? { ...scene, isPolishingScript: false } : scene
        ),
      });
    }
  }, [project, polishSceneScript, onUpdateProject]);

  const handleCtaChange = useCallback(async (idx: number, newCta: string) => {
    onUpdateProject({
      ...project,
      scenes: project.scenes.map((scene, i) =>
        i === idx ? { ...scene, selectedCta: newCta } : scene
      ),
    });

    // Regenerate image with new CTA
    await generateSceneImage(idx);

    // Regenerate caption for food socials
    if (project.projectType === 'food-social' && project.selectedConcept) {
      onUpdateProject({
        ...project,
        scenes: project.scenes.map((scene, i) =>
          i === idx ? { ...scene, isPolishingScript: true } : scene
        ),
      });

      try {
        const caption = await generateFoodSocialPost(
          project.brief,
          project.selectedConcept,
          { ...project.scenes[idx], selectedCta: newCta }
        );
        onUpdateProject({
          ...project,
          scenes: project.scenes.map((scene, i) =>
            i === idx ? { ...scene, audioScript: caption, isPolishingScript: false } : scene
          ),
        });
      } catch (err) {
        console.error('Failed to regenerate caption:', err);
        onUpdateProject({
          ...project,
          scenes: project.scenes.map((scene, i) =>
            i === idx ? { ...scene, isPolishingScript: false } : scene
          ),
        });
      }
    }
  }, [project, generateSceneImage, generateFoodSocialPost, onUpdateProject]);

  const handleCopyPrompt = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  const handleDownload = useCallback((url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  if (project.projectType === 'food-social') {
    return <FoodSocialPanel
      project={project}
      onChangeConcept={onChangeConcept}
      onUpdateProject={onUpdateProject}
      onExport={onExport}
      editInstruction={editInstruction}
      setEditInstruction={setEditInstruction}
      copiedId={copiedId}
      onCopyPrompt={handleCopyPrompt}
      onDownload={handleDownload}
      onEditImage={handleEditImage}
      onPolishScript={handlePolishScript}
      onCtaChange={handleCtaChange}
      loading={loading}
      error={error}
    />;
  }

  if (project.projectType === 'social') {
    return <SocialPanel
      project={project}
      onChangeConcept={onChangeConcept}
      onUpdateProject={onUpdateProject}
      onExport={onExport}
      editInstruction={editInstruction}
      setEditInstruction={setEditInstruction}
      copiedId={copiedId}
      onCopyPrompt={handleCopyPrompt}
      onDownload={handleDownload}
      onEditImage={handleEditImage}
      onPolishScript={handlePolishScript}
      loading={loading}
      error={error}
    />;
  }

  return <VideoPanel
    project={project}
    onChangeConcept={onChangeConcept}
    onUpdateProject={onUpdateProject}
    onExport={onExport}
    copiedId={copiedId}
    onCopyPrompt={handleCopyPrompt}
    onDownload={handleDownload}
    onGenerateImage={generateSceneImage}
    onGenerateVideo={generateSceneVideo}
    onPlayVoiceover={playVoiceover}
    onPolishScript={handlePolishScript}
    loading={loading}
    error={error}
  />;
};

// Food Social Panel Component
interface FoodSocialPanelProps {
  project: AdProject;
  onChangeConcept: () => void;
  onUpdateProject: (project: AdProject) => void;
  onExport: () => void;
  editInstruction: string;
  setEditInstruction: (instruction: string) => void;
  copiedId: string | null;
  onCopyPrompt: (text: string, id: string) => void;
  onDownload: (url: string, filename: string) => void;
  onEditImage: (idx: number) => void;
  onPolishScript: (idx: number) => void;
  onCtaChange: (idx: number, newCta: string) => void;
  loading: boolean;
  error: string | null;
}

const FoodSocialPanel: React.FC<FoodSocialPanelProps> = ({
  project,
  onChangeConcept,
  onUpdateProject,
  onExport,
  editInstruction,
  setEditInstruction,
  copiedId,
  onCopyPrompt,
  onDownload,
  onEditImage,
  onPolishScript,
  onCtaChange,
  loading,
  error,
}) => {
  const [selectedFoodPostIdx, setSelectedFoodPostIdx] = useState(0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-serif gradient-text">
              {project.selectedConcept?.title}
            </h1>
            <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              Selected
            </span>
          </div>
          <p className="text-white/50">
            Generating {project.scenes.length} posts with different CTAs
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={onChangeConcept}
            className="px-6 py-2 rounded-full border border-yellow-500/30 text-sm font-medium hover:bg-white/5 transition"
          >
            Change Concept
          </button>
        </div>
      </div>

      {/* Compact Gallery */}
      <div className="grid grid-cols-3 gap-4">
        {project.scenes.map((scene, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedFoodPostIdx(idx)}
            className={`glass rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${
              selectedFoodPostIdx === idx
                ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-black'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <div className="aspect-video bg-zinc-900 relative">
              {scene.imageUrl ? (
                <img src={scene.imageUrl} className="w-full h-full object-cover" alt={`Post ${idx + 1}`} />
              ) : scene.isGeneratingImage ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <i className="fa-solid fa-image text-white/20 text-2xl"></i>
                </div>
              )}
              {selectedFoodPostIdx === idx && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                  <i className="fa-solid fa-check text-black text-xs"></i>
                </div>
              )}
            </div>
            <div className="p-3 bg-zinc-900/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-yellow-400">Post #{idx + 1}</span>
                {scene.selectedCta && (
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                    {scene.selectedCta}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Panel */}
      {project.scenes[selectedFoodPostIdx] && (() => {
        const scene = project.scenes[selectedFoodPostIdx];
        const idx = selectedFoodPostIdx;
        return (
          <div className="glass rounded-[40px] overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Image Preview */}
              <div className="lg:w-3/5 bg-black relative group">
                <div className="aspect-video w-full">
                  {scene.imageUrl ? (
                    <img src={scene.imageUrl} className="w-full h-full object-cover" alt={`Post ${idx + 1}`} />
                  ) : scene.isGeneratingImage ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900">
                      <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
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

                {/* Action Buttons */}
                <div className="absolute bottom-4 left-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onUpdateProject({
                      ...project,
                      scenes: project.scenes.map((s, i) =>
                        i === idx ? { ...s, isGeneratingImage: true } : s
                      ),
                    }).then(() => generateSceneImage(idx))}
                    disabled={scene.isGeneratingImage}
                    className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-yellow-50 transition flex items-center space-x-2"
                  >
                    {scene.isGeneratingImage ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <i className="fa-solid fa-image"></i>
                    )}
                    <span>{scene.imageUrl ? 'Regenerate' : 'Generate'}</span>
                  </button>
                  {scene.imageUrl && (
                    <button
                      onClick={() => onDownload(scene.imageUrl!, `FoodSocial-Post-${idx + 1}.png`)}
                      className="bg-white/20 backdrop-blur text-white px-3 py-2 rounded-full text-xs font-bold hover:bg-white/30 transition"
                    >
                      <i className="fa-solid fa-download"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Caption & Actions */}
              <div className="lg:w-2/5 p-6 flex flex-col border-l border-white/5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-yellow-400">Post #{idx + 1}</span>
                    <span className="bg-pink-500/10 text-pink-400 text-[10px] font-bold px-2 py-1 rounded">
                      Instagram / FB
                    </span>
                  </div>
                </div>

                {/* CTA Badge */}
                {scene.selectedCta && (
                  <div className="mb-4 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                    <span className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">
                      Call to Action
                    </span>
                    <span className="text-yellow-400 font-bold">{scene.selectedCta}</span>
                  </div>
                )}

                {/* Caption */}
                <div className="flex-1 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold">
                      Post Caption
                    </label>
                    <button
                      onClick={() => onPolishScript(idx)}
                      disabled={scene.isPolishingScript}
                      className="text-[10px] bg-yellow-500/10 hover:bg-yellow-500/30 text-yellow-300 px-2 py-1 rounded transition flex items-center gap-1"
                    >
                      {scene.isPolishingScript ? (
                        <div className="w-3 h-3 border border-yellow-300 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                      )}
                      <span>Polish</span>
                    </button>
                  </div>
                  <div className="bg-black/30 rounded-xl p-4 max-h-[200px] overflow-y-auto">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{scene.audioScript}</p>
                  </div>
                </div>

                {/* Edit Image */}
                <div className="mb-4">
                  <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold block mb-2">
                    Edit Image with AI
                  </label>
                  <div className="flex gap-0">
                    <div className="relative flex-grow">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                      </span>
                      <input
                        type="text"
                        value={editInstruction}
                        onChange={(e) => setEditInstruction(e.target.value)}
                        placeholder="Add smoke, change background..."
                        className="w-full bg-white/5 border border-yellow-500/30 rounded-l-xl pl-9 pr-4 py-2.5 text-sm focus:border-yellow-500 outline-none transition"
                      />
                    </div>
                    <button
                      onClick={() => onEditImage(idx)}
                      disabled={!editInstruction || !scene.imageUrl || scene.isGeneratingImage}
                      className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border-y border-r border-yellow-500/30 px-4 py-2.5 rounded-r-xl font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {/* Advanced Prompts */}
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
                          onClick={() => onCopyPrompt(scene.visualPrompt, `${idx}-vis`)}
                          className="text-[9px] text-white/40 hover:text-white transition"
                        >
                          {copiedId === `${idx}-vis` ? <span className="text-green-400">Copied</span> : 'Copy'}
                        </button>
                      </div>
                      <p className="text-white/60 text-[11px] leading-relaxed italic line-clamp-3">
                        "{scene.visualPrompt}"
                      </p>
                    </div>
                  </div>
                </details>

                {/* Footer */}
                <div className="mt-auto pt-4 flex items-center space-x-3 border-t border-white/5">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-white/10 border-2 border-black flex items-center justify-center text-[8px]">
                      <i className="fa-solid fa-robot"></i>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-yellow-500 border-2 border-black flex items-center justify-center text-[8px] text-black">
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                    </div>
                  </div>
                  <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">
                    AI Assisted
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};

// Social Panel Component (similar structure to Food Social but for social posts)
interface SocialPanelProps {
  project: AdProject;
  onChangeConcept: () => void;
  onUpdateProject: (project: AdProject) => void;
  onExport: () => void;
  editInstruction: string;
  setEditInstruction: (instruction: string) => void;
  copiedId: string | null;
  onCopyPrompt: (text: string, id: string) => void;
  onDownload: (url: string, filename: string) => void;
  onEditImage: (idx: number) => void;
  onPolishScript: (idx: number) => void;
  loading: boolean;
  error: string | null;
}

const SocialPanel: React.FC<SocialPanelProps> = ({
  project,
  onChangeConcept,
  onUpdateProject,
  onExport,
  editInstruction,
  setEditInstruction,
  copiedId,
  onCopyPrompt,
  onDownload,
  onEditImage,
  onPolishScript,
  loading,
  error,
}) => {
  const [selectedSocialPostIdx, setSelectedSocialPostIdx] = useState(0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-serif gradient-text">
              {project.selectedConcept?.title}
            </h1>
            <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              Selected
            </span>
          </div>
          <p className="text-white/50">
            Generating {project.scenes.length} social media posts
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={onChangeConcept}
            className="px-6 py-2 rounded-full border border-yellow-500/30 text-sm font-medium hover:bg-white/5 transition"
          >
            Change Concept
          </button>
        </div>
      </div>

      {/* Gallery */}
      <div className="grid grid-cols-3 gap-4">
        {project.scenes.map((scene, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedSocialPostIdx(idx)}
            className={`glass rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${
              selectedSocialPostIdx === idx
                ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-black'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <div className="aspect-[3/4] bg-zinc-900 relative">
              {scene.imageUrl ? (
                <img src={scene.imageUrl} className="w-full h-full object-cover" alt={`Post ${idx + 1}`} />
              ) : scene.isGeneratingImage ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <i className="fa-solid fa-image text-white/20 text-2xl"></i>
                </div>
              )}
              {selectedSocialPostIdx === idx && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                  <i className="fa-solid fa-check text-black text-xs"></i>
                </div>
              )}
            </div>
            <div className="p-3 bg-zinc-900/50">
              <span className="text-xs font-bold text-yellow-400">Post #{idx + 1}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Panel */}
      {project.scenes[selectedSocialPostIdx] && (() => {
        const scene = project.scenes[selectedSocialPostIdx];
        const idx = selectedSocialPostIdx;
        return (
          <div className="glass rounded-[40px] overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Image Preview */}
              <div className="lg:w-5/12 bg-black relative group flex items-center justify-center">
                <div className="aspect-[3/4] h-[500px]">
                  {scene.imageUrl ? (
                    <img src={scene.imageUrl} className="w-full h-full object-cover" alt={`Post ${idx + 1}`} />
                  ) : scene.isGeneratingImage ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900">
                      <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
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

                {/* Action Buttons */}
                <div className="absolute bottom-4 left-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onUpdateProject({
                      ...project,
                      scenes: project.scenes.map((s, i) =>
                        i === idx ? { ...s, isGeneratingImage: true } : s
                      ),
                    }).then(() => generateSceneImage(idx))}
                    disabled={scene.isGeneratingImage}
                    className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-yellow-50 transition flex items-center space-x-2"
                  >
                    {scene.isGeneratingImage ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <i className="fa-solid fa-image"></i>
                    )}
                    <span>{scene.imageUrl ? 'Regenerate' : 'Generate'}</span>
                  </button>
                  {scene.imageUrl && (
                    <button
                      onClick={() => onDownload(scene.imageUrl!, `SocialPoster-Post-${idx + 1}.png`)}
                      className="bg-white/20 backdrop-blur text-white px-3 py-2 rounded-full text-xs font-bold hover:bg-white/30 transition"
                    >
                      <i className="fa-solid fa-download"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Caption & Actions */}
              <div className="lg:w-7/12 p-6 flex flex-col border-l border-white/5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-yellow-400">Post #{idx + 1}</span>
                    <span className="bg-pink-500/10 text-pink-400 text-[10px] font-bold px-2 py-1 rounded">
                      Instagram / FB
                    </span>
                  </div>
                </div>

                {/* Caption */}
                <div className="flex-1 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold">
                      Post Caption
                    </label>
                    <button
                      onClick={() => onPolishScript(idx)}
                      disabled={scene.isPolishingScript}
                      className="text-[10px] bg-yellow-500/10 hover:bg-yellow-500/30 text-yellow-300 px-2 py-1 rounded transition flex items-center gap-1"
                    >
                      {scene.isPolishingScript ? (
                        <div className="w-3 h-3 border border-yellow-300 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                      )}
                      <span>Polish</span>
                    </button>
                  </div>
                  <div className="bg-black/30 rounded-xl p-4 max-h-[200px] overflow-y-auto">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{scene.audioScript}</p>
                  </div>
                </div>

                {/* Edit Image */}
                <div className="mb-4">
                  <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold block mb-2">
                    Edit Image with AI
                  </label>
                  <div className="flex gap-0">
                    <div className="relative flex-grow">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                      </span>
                      <input
                        type="text"
                        value={editInstruction}
                        onChange={(e) => setEditInstruction(e.target.value)}
                        placeholder="Change colors, add effects..."
                        className="w-full bg-white/5 border border-yellow-500/30 rounded-l-xl pl-9 pr-4 py-2.5 text-sm focus:border-yellow-500 outline-none transition"
                      />
                    </div>
                    <button
                      onClick={() => onEditImage(idx)}
                      disabled={!editInstruction || !scene.imageUrl || scene.isGeneratingImage}
                      className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border-y border-r border-yellow-500/30 px-4 py-2.5 rounded-r-xl font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {/* Advanced Prompts */}
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
                          onClick={() => onCopyPrompt(scene.visualPrompt, `${idx}-vis`)}
                          className="text-[9px] text-white/40 hover:text-white transition"
                        >
                          {copiedId === `${idx}-vis` ? <span className="text-green-400">Copied</span> : 'Copy'}
                        </button>
                      </div>
                      <p className="text-white/60 text-[11px] leading-relaxed italic line-clamp-3">
                        "{scene.visualPrompt}"
                      </p>
                    </div>
                  </div>
                </details>

                {/* Footer */}
                <div className="mt-auto pt-4 flex items-center space-x-3 border-t border-white/5">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-white/10 border-2 border-black flex items-center justify-center text-[8px]">
                      <i className="fa-solid fa-robot"></i>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-yellow-500 border-2 border-black flex items-center justify-center text-[8px] text-black">
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                    </div>
                  </div>
                  <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">
                    AI Assisted
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};

// Video Panel Component
interface VideoPanelProps {
  project: AdProject;
  onChangeConcept: () => void;
  onUpdateProject: (project: AdProject) => void;
  onExport: () => void;
  copiedId: string | null;
  onCopyPrompt: (text: string, id: string) => void;
  onDownload: (url: string, filename: string) => void;
  onGenerateImage: (idx: number) => void;
  onGenerateVideo: (idx: number) => void;
  onPlayVoiceover: (idx: number) => void;
  onPolishScript: (idx: number) => void;
  loading: boolean;
  error: string | null;
}

const VideoPanel: React.FC<VideoPanelProps> = ({
  project,
  onChangeConcept,
  onUpdateProject,
  onExport,
  copiedId,
  onCopyPrompt,
  onDownload,
  onGenerateImage,
  onGenerateVideo,
  onPlayVoiceover,
  onPolishScript,
  loading,
  error,
}) => {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-serif gradient-text">
              {project.selectedConcept?.title}
            </h1>
            <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              Selected
            </span>
          </div>
          <p className="text-white/50">
            Cinematic storyboard with {project.scenes.length} scenes
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={onChangeConcept}
            className="px-6 py-2 rounded-full border border-yellow-500/30 text-sm font-medium hover:bg-white/5 transition"
          >
            Change Concept
          </button>
        </div>
      </div>

      {/* Scenes */}
      {project.scenes.map((scene, idx) => (
        <div key={idx} className="glass rounded-[40px] overflow-hidden flex flex-col md:flex-row min-h-[400px]">
          {/* Visual Preview */}
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
                      <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
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
                  onClick={() => onDownload(scene.videoUrl || scene.imageUrl!, `NanoAds-Scene-${scene.sceneNumber}${scene.videoUrl ? '.mp4' : '.png'}`)}
                  className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-md transition z-20 opacity-0 group-hover:opacity-100 border border-white/10"
                  title="Download Asset"
                >
                  <i className="fa-solid fa-download"></i>
                </button>
              )}

              {/* Action Buttons */}
              <div className="absolute bottom-6 left-6 flex space-x-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button
                  onClick={() => onGenerateImage(idx)}
                  disabled={scene.isGeneratingImage}
                  className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-yellow-50 transition flex items-center space-x-2"
                >
                  {scene.isGeneratingImage ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <i className="fa-solid fa-image"></i>
                  )}
                  <span>{scene.imageUrl ? 'Regenerate Image' : 'Generate Image'}</span>
                </button>

                <button
                  onClick={() => onGenerateVideo(idx)}
                  disabled={scene.isGeneratingVideo || !scene.imageUrl}
                  className="gradient-accent text-black px-4 py-2 rounded-full text-xs font-bold hover:scale-105 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {scene.isGeneratingVideo ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <i className="fa-solid fa-play"></i>
                  )}
                  <span>Animate Cinematic Video</span>
                </button>
              </div>

              {scene.isGeneratingVideo && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-bold tracking-widest uppercase mt-4">Rendering Cinematic Motion...</p>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="md:w-2/5 p-10 flex flex-col border-l border-white/5">
            <div className="flex items-center justify-between mb-8">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
                Scene {scene.sceneNumber}
              </span>
              <span className="bg-yellow-500/10 text-yellow-400 text-[10px] font-bold px-2 py-1 rounded">
                Veo Optimized (8s)
              </span>
              <button
                onClick={() => onPlayVoiceover(idx)}
                disabled={scene.isGeneratingVoice}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-yellow-500/20 hover:text-yellow-400 transition"
              >
                {scene.isGeneratingVoice ? (
                  <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <i className="fa-solid fa-volume-high"></i>
                )}
              </button>
            </div>

            {/* Cinematography Prompt */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-2">
                <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold block">
                  Cinematography Prompt
                </label>
                <button
                  onClick={() => onCopyPrompt(scene.visualPrompt, `${idx}-vis`)}
                  className="text-[10px] text-white/40 hover:text-white transition flex items-center gap-1.5"
                >
                  {copiedId === `${idx}-vis` ? (
                    <><i className="fa-solid fa-check text-green-400"></i> <span className="text-green-400 font-bold">Copied</span></>
                  ) : (
                    <><i className="fa-regular fa-copy"></i> Copy</>
                  )}
                </button>
              </div>
              <p className="text-white/80 text-sm leading-relaxed italic border-l-2 border-yellow-500/30 pl-4">
                "{scene.visualPrompt}"
              </p>
            </div>

            {/* Nano Banana Prompt */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-2">
                <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold block">
                  Nano Banana Prompt <span className="text-[9px] font-normal normal-case text-white/20">(Image Gen)</span>
                </label>
                <button
                  onClick={() => onCopyPrompt(
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

            {/* Audio Script */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold block">
                  Audio Script
                </label>
                <button
                  onClick={() => onPolishScript(idx)}
                  disabled={scene.isPolishingScript}
                  className="text-[10px] bg-yellow-500/10 hover:bg-yellow-500/30 text-yellow-300 px-2 py-1 rounded transition flex items-center gap-1"
                >
                  {scene.isPolishingScript ? (
                    <div className="w-3 h-3 border border-yellow-300 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                  )}
                  <span>Polish Copy</span>
                </button>
              </div>
              <p className="text-xl font-medium leading-snug whitespace-pre-wrap">{scene.audioScript}</p>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-10 flex items-center space-x-4">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-black flex items-center justify-center text-[10px]">
                  <i className="fa-solid fa-robot"></i>
                </div>
                <div className="w-8 h-8 rounded-full bg-yellow-500 border-2 border-black flex items-center justify-center text-[10px] text-black">
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                </div>
              </div>
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                AI Assisted Production
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(ProductionPanel);