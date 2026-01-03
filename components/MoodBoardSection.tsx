import React, { useCallback } from 'react';
import { AdBrief } from '../types';
import { useGeminiService } from '../hooks/useGeminiService';

interface MoodBoardSectionProps {
  brief: AdBrief;
  onBriefChange: (brief: AdBrief) => void;
}

const MoodBoardSection: React.FC<MoodBoardSectionProps> = ({
  brief,
  onBriefChange,
}) => {
  const { generateMoodBoard, loading } = useGeminiService();

  const handleGenerateMoodBoard = useCallback(async () => {
    try {
      const image = await generateMoodBoard(brief, brief.productImage, brief.logoImage);
      onBriefChange({ ...brief, moodBoard: image });
    } catch (err) {
      console.error('Mood board generation failed:', err);
    }
  }, [brief, generateMoodBoard, onBriefChange]);

  const handleDownloadMoodBoard = useCallback(() => {
    if (!brief.moodBoard) return;
    const link = document.createElement('a');
    link.href = brief.moodBoard;
    link.download = 'NanoAds-MoodBoard.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [brief.moodBoard]);

  return (
    <div className="lg:pl-8 lg:border-l border-white/5 flex flex-col">
      <h2 className="text-2xl font-serif mb-6 text-white/80">Visual Identity</h2>

      {brief.brandName ? (
        <div className="flex-grow flex flex-col">
          <div className="bg-white/5 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white/70 uppercase text-xs tracking-widest">
                Mood Board
              </h3>
              {!brief.moodBoard && (
                <button
                  onClick={handleGenerateMoodBoard}
                  disabled={loading || brief.tone.length === 0}
                  className="text-xs bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-300 px-3 py-1.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-yellow-300 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Generate'
                  )}
                </button>
              )}
            </div>

            {brief.moodBoard ? (
              <div className="relative group overflow-hidden rounded-xl shadow-2xl border border-yellow-500/30">
                <img
                  src={brief.moodBoard}
                  className="w-full h-auto object-cover"
                  alt="Brand Mood Board"
                />
                <button
                  onClick={handleDownloadMoodBoard}
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
                  <p className="text-sm">
                    Upload a product image & generate<br />
                    to see the cohesive mood board collage.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex-grow glass rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-yellow-500/10 blur-[100px] rounded-full"></div>
            <h3 className="font-bold text-white/70 uppercase text-xs tracking-widest mb-4 relative z-10">
              Brand DNA
            </h3>
            <div className="space-y-4 relative z-10">
              <div>
                <span className="text-white/40 text-xs block mb-1">Tone</span>
                <div className="flex flex-wrap gap-2">
                  {brief.tone.length > 0 ? (
                    brief.tone.map((t, i) => (
                      <span key={i} className="px-2 py-1 bg-white/10 rounded text-xs text-white/80">
                        {t.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-white/20 text-sm italic">Define tone...</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-white/40 text-xs block mb-1">Audience</span>
                <p className="text-sm text-white/80">
                  {brief.targetAudience || <span className="text-white/20 italic">Define audience...</span>}
                </p>
              </div>

              {brief.visualStyle && (
                <div>
                  <span className="text-white/40 text-xs block mb-1">Inferred Visual Style</span>
                  <p className="text-sm text-white/80 border-l-2 border-yellow-500 pl-2">
                    {brief.visualStyle}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center opacity-30">
          <div className="text-center">
            <i className="fa-solid fa-layer-group text-4xl mb-4"></i>
            <p>Start your brief to see<br />visual identity suggestions</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(MoodBoardSection);