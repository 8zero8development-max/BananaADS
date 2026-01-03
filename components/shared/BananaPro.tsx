import React from 'react';

export type BananaRole = 'default' | 'research' | 'artist' | 'director' | 'cameraman' | 'voice' | 'writer';

interface BananaProProps {
  role?: BananaRole;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

const BananaPro: React.FC<BananaProProps> = ({ role = 'default', size = 'md', text, className = '' }) => {
  const sizeConfig = {
    sm: { text: 'text-2xl', sub: 'text-[0.6rem]', emojiSize: 'text-lg' },
    md: { text: 'text-4xl', sub: 'text-[0.7rem]', emojiSize: 'text-2xl' },
    lg: { text: 'text-6xl', sub: 'text-xs', emojiSize: 'text-4xl' },
    xl: { text: 'text-8xl', sub: 'text-sm', emojiSize: 'text-5xl' }
  };

  const personas: Record<BananaRole, { 
    banana: string; 
    accessory: string; 
    animation: string; 
    color: string;
    accessoryPos: string;
  }> = {
    default: { banana: '🍌', accessory: '', animation: 'animate-banana-wiggle', color: 'text-yellow-400', accessoryPos: '' },
    research: { banana: '🍌', accessory: '🧐', animation: 'animate-banana-scan', color: 'text-blue-400', accessoryPos: 'absolute -bottom-1 -right-2' },
    artist: { banana: '🍌', accessory: '🎨', animation: 'animate-banana-bounce', color: 'text-pink-400', accessoryPos: 'absolute -top-1 -right-2' },
    director: { banana: '🍌', accessory: '🎬', animation: 'animate-banana-wiggle', color: 'text-purple-400', accessoryPos: 'absolute bottom-0 -left-2 rotate-[-20deg]' },
    cameraman: { banana: '🍌', accessory: '📹', animation: 'animate-banana-pulse', color: 'text-red-500', accessoryPos: 'absolute top-1/2 -right-3 -translate-y-1/2' },
    voice: { banana: '🍌', accessory: '🎙️', animation: 'animate-banana-vibrate', color: 'text-green-400', accessoryPos: 'absolute bottom-0 -right-2' },
    writer: { banana: '🍌', accessory: '✍️', animation: 'animate-banana-write', color: 'text-orange-400', accessoryPos: 'absolute bottom-0 -right-1' },
  };

  const p = personas[role];
  const s = sizeConfig[size];

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={`relative ${p.animation} inline-block`}>
        <span className={`${s.text} filter drop-shadow-lg`}>{p.banana}</span>
        {p.accessory && (
          <span className={`${s.emojiSize} ${p.accessoryPos} filter drop-shadow-md`}>{p.accessory}</span>
        )}
      </div>
      {text && (
        <p className={`${p.color} font-bold ${s.sub} uppercase tracking-widest animate-pulse text-center whitespace-nowrap`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default BananaPro;
