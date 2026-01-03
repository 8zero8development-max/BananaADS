import React from 'react';

interface HeaderProps {
  onBackToLanding?: () => void;
  onReconfigureKey: () => void;
  onClearData: () => void;
  onExport: () => void;
  hasProject: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onBackToLanding,
  onReconfigureKey,
  onClearData,
  onExport,
  hasProject,
}) => {
  return (
    <nav className="fixed top-0 w-full z-50 glass border-b border-yellow-500/10 py-4 px-8 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="text-white/40 hover:text-white transition"
          >
            <i className="fa-solid fa-arrow-left"></i>
          </button>
        )}
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🍌</span>
          <span className="font-bold text-xl tracking-tight">
            <span className="text-banana">BANANA</span>
            <span className="text-white">ADS</span>
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-6 text-sm font-medium text-white/60">
        <button
          onClick={onReconfigureKey}
          className="hover:text-banana transition flex items-center gap-2"
        >
          <i className="fa-solid fa-key"></i>
          <span className="hidden sm:inline">API Key</span>
        </button>

        <button
          onClick={onClearData}
          className="hover:text-red-400 transition flex items-center gap-2"
          title="Clear all saved data"
        >
          <i className="fa-solid fa-trash"></i>
          <span className="hidden sm:inline">Clear Data</span>
        </button>

        <a href="#" className="hover:text-banana transition">
          Projects
        </a>

        <button
          onClick={onExport}
          disabled={!hasProject}
          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Export Ad
        </button>
      </div>
    </nav>
  );
};

export default React.memo(Header);