import React, { useState, useEffect } from 'react';
import { AdBrief, BrandDna } from '../../types';
import { 
  BrandProfile, 
  saveBrandProfile, 
  loadBrandProfiles, 
  deleteBrandProfile 
} from '../../utils/storageService';

interface BrandProfileManagerProps {
  brief: AdBrief;
  onLoadProfile: (profile: BrandProfile) => void;
}

const BrandProfileManager: React.FC<BrandProfileManagerProps> = ({
  brief,
  onLoadProfile,
}) => {
  const [profiles, setProfiles] = useState<BrandProfile[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [profileName, setProfileName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const loadedProfiles = loadBrandProfiles();
    setProfiles(loadedProfiles);
  }, []);

  const canSaveProfile = (): boolean => {
    return !!(brief.brandName && brief.brandDna);
  };

  const handleSaveProfile = () => {
    if (!canSaveProfile()) {
      setSaveError('Please complete brand research first to generate Brand DNA.');
      return;
    }

    if (!profileName.trim()) {
      setSaveError('Please enter a profile name.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const now = new Date().toISOString();
      const newProfile: BrandProfile = {
        id: `brand_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: profileName.trim(),
        brandDna: brief.brandDna!,
        // Save all AI-researched brand identity data
        brandName: brief.brandName,
        productName: brief.productName,
        targetAudience: brief.targetAudience,
        tone: brief.tone,
        keyFeatures: brief.keyFeatures,
        researchSources: brief.researchSources,
        productUrl: brief.productUrl,
        // Visual assets
        logoImage: brief.logoImage,
        moodBoard: brief.moodBoard,
        createdAt: now,
        updatedAt: now,
      };

      saveBrandProfile(newProfile);
      setProfiles(loadBrandProfiles());
      setProfileName('');
      setShowSaveForm(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProfile = (id: string) => {
    try {
      deleteBrandProfile(id);
      setProfiles(loadBrandProfiles());
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete profile:', error);
    }
  };

  const handleLoadProfile = (profile: BrandProfile) => {
    onLoadProfile(profile);
    setIsExpanded(false);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
            <i className="fa-solid fa-bookmark text-yellow-400 text-sm"></i>
          </div>
          <div className="text-left">
            <span className="text-sm font-medium text-white/90">Brand Profiles</span>
            <span className="text-xs text-white/40 ml-2">({profiles.length} saved)</span>
          </div>
        </div>
        <i className={`fa-solid fa-chevron-down text-white/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}></i>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 border-t border-white/10 space-y-4">
          {showSaveForm ? (
            <div className="bg-white/5 rounded-xl p-4 border border-yellow-500/30">
              <div className="flex items-center gap-2 mb-3">
                <i className="fa-solid fa-plus text-yellow-400 text-sm"></i>
                <span className="text-sm font-medium text-white/90">Save Current Brand</span>
              </div>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Enter profile name..."
                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-500 transition mb-3"
              />
              {saveError && (
                <p className="text-red-400 text-xs mb-3">{saveError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving || !canSaveProfile()}
                  className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSaveForm(false);
                    setProfileName('');
                    setSaveError(null);
                  }}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg text-sm transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSaveForm(true)}
              disabled={!canSaveProfile()}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed transition ${
                canSaveProfile()
                  ? 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-500/50'
                  : 'border-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              <i className="fa-solid fa-plus"></i>
              <span className="text-sm font-medium">Save Current Brand DNA</span>
            </button>
          )}

          {profiles.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <i className="fa-solid fa-folder-open text-white/40 text-xs"></i>
                <span className="text-xs uppercase tracking-wider text-white/40 font-medium">Saved Profiles</span>
              </div>
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="bg-white/5 rounded-xl p-3 border border-white/10 hover:border-white/20 transition group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {profile.logoImage ? (
                        <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/10 p-1 flex-shrink-0">
                          <img 
                            src={profile.logoImage} 
                            alt={profile.name} 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
                          <i className="fa-solid fa-building text-yellow-400/60 text-sm"></i>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium text-white/90 truncate">{profile.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-white/40">
                          <span>{formatDate(profile.updatedAt)}</span>
                          {profile.brandName && (
                            <>
                              <span className="text-white/20">|</span>
                              <span className="truncate text-yellow-400/70">{profile.brandName}</span>
                            </>
                          )}
                          {profile.brandDna?.brandArchetype && (
                            <>
                              <span className="text-white/20">|</span>
                              <span className="truncate">{profile.brandDna.brandArchetype}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        type="button"
                        onClick={() => handleLoadProfile(profile)}
                        className="p-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 transition opacity-0 group-hover:opacity-100"
                        title="Load this profile"
                      >
                        <i className="fa-solid fa-arrow-right-to-bracket text-xs"></i>
                      </button>
                      {deleteConfirmId === profile.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteProfile(profile.id)}
                            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition"
                            title="Confirm delete"
                          >
                            <i className="fa-solid fa-check text-xs"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 transition"
                            title="Cancel"
                          >
                            <i className="fa-solid fa-times text-xs"></i>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(profile.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                          title="Delete profile"
                        >
                          <i className="fa-solid fa-trash text-xs"></i>
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Show saved research data preview */}
                  {(profile.targetAudience || (profile.tone && profile.tone.length > 0)) && (
                    <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                      {profile.targetAudience && (
                        <p className="text-[10px] text-white/50 truncate">
                          <i className="fa-solid fa-users text-yellow-400/50 mr-1"></i>
                          {profile.targetAudience}
                        </p>
                      )}
                      {profile.tone && profile.tone.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {profile.tone.slice(0, 3).map((t, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded text-white/50">
                              {t}
                            </span>
                          ))}
                          {profile.tone.length > 3 && (
                            <span className="text-[9px] text-white/30">+{profile.tone.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {profile.brandDna?.colorPalette && profile.brandDna.colorPalette.length > 0 && (
                    <div className="flex gap-1 mt-2 pt-2 border-t border-white/5">
                      {profile.brandDna.colorPalette.slice(0, 5).map((color, i) => {
                        const isValidCssColor = color.startsWith('#') || 
                          color.startsWith('rgb') || 
                          color.startsWith('hsl') ||
                          /^[a-z]+$/i.test(color.trim());
                        return (
                          <div 
                            key={i} 
                            className="w-5 h-5 rounded border border-white/10"
                            style={{ backgroundColor: isValidCssColor ? color : '#333' }}
                            title={color}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-white/30">
              <i className="fa-solid fa-bookmark text-2xl mb-2 block"></i>
              <p className="text-sm">No saved brand profiles yet.</p>
              <p className="text-xs mt-1">Complete brand research to save your first profile.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandProfileManager;
