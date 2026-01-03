import React, { useState } from 'react';

interface HelpSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HelpSection {
  title: string;
  icon: string;
  content: React.ReactNode;
}

const HelpSystem: React.FC<HelpSystemProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<string>('getting-started');

  const helpSections: Record<string, HelpSection> = {
    'getting-started': {
      title: 'Getting Started',
      icon: 'fa-rocket',
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Welcome to BananaADS</h4>
          <p className="text-white/70">BananaADS is an AI-powered cinematography agent that helps you create broadcast-quality advertisement campaigns. Follow these steps to get started:</p>
          <ol className="list-decimal list-inside space-y-3 text-white/70">
            <li><strong className="text-white">Configure your API Key</strong> - Enter your Google Gemini API key to enable AI features. Get one free at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-banana hover:underline">Google AI Studio</a>.</li>
            <li><strong className="text-white">Choose a Production Type</strong> - Select from Cinematic Video, Social Poster, Food Social, or Email Campaign based on your needs.</li>
            <li><strong className="text-white">Fill in the Brief</strong> - Enter your brand name, product details, target audience, and tone preferences.</li>
            <li><strong className="text-white">Research & Generate</strong> - Use AI to research your brand and generate a mood board for visual consistency.</li>
            <li><strong className="text-white">Select a Concept</strong> - Choose from 3 AI-generated creative concepts tailored to your brief.</li>
            <li><strong className="text-white">Produce Content</strong> - Generate images, videos, and voiceovers for each scene or section.</li>
            <li><strong className="text-white">Export</strong> - Download your campaign as HTML or PDF for sharing and presentation.</li>
          </ol>
        </div>
      )
    },
    'production-types': {
      title: 'Production Types',
      icon: 'fa-film',
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Choose the Right Format</h4>
          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <i className="fa-solid fa-video text-banana"></i>
                <h5 className="font-semibold text-white">Cinematic Video</h5>
              </div>
              <p className="text-white/70 text-sm">Create broadcast-quality video advertisements with scene-by-scene storyboards, AI-generated visuals, animated videos, and professional voiceovers. Perfect for TV commercials, YouTube ads, and social media video content.</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <i className="fa-solid fa-image text-purple-400"></i>
                <h5 className="font-semibold text-white">Social Poster</h5>
              </div>
              <p className="text-white/70 text-sm">Design eye-catching social media posters in portrait format (3:4 ratio). Ideal for Instagram posts, Facebook ads, and Pinterest pins with compelling visuals and captions.</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <i className="fa-solid fa-utensils text-orange-400"></i>
                <h5 className="font-semibold text-white">Food Social</h5>
              </div>
              <p className="text-white/70 text-sm">Specialized for food and beverage brands. Creates appetizing food photography with integrated call-to-action overlays, perfect for restaurant promotions and food delivery apps.</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <i className="fa-solid fa-envelope text-blue-400"></i>
                <h5 className="font-semibold text-white">Email Campaign</h5>
              </div>
              <p className="text-white/70 text-sm">Design engaging marketing emails with AI-generated content. Creates 4 sections (Header, Hero, Body, Footer) with compelling subject lines, visual layouts, and strategic call-to-action placement.</p>
            </div>
          </div>
        </div>
      )
    },
    'email-campaigns': {
      title: 'Email Campaigns',
      icon: 'fa-envelope',
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Creating Email Campaigns</h4>
          <p className="text-white/70">Email campaigns in BananaADS are designed to create visually engaging marketing emails that implement your brand DNA.</p>
          <div className="space-y-3">
            <h5 className="font-semibold text-white">Email Structure</h5>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <span className="text-blue-400 font-semibold text-sm">Header</span>
                <p className="text-white/60 text-xs mt-1">Brand logo area and navigation links</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <span className="text-blue-400 font-semibold text-sm">Hero</span>
                <p className="text-white/60 text-xs mt-1">Main visual and headline</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <span className="text-blue-400 font-semibold text-sm">Body</span>
                <p className="text-white/60 text-xs mt-1">Product details and benefits</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <span className="text-blue-400 font-semibold text-sm">Footer</span>
                <p className="text-white/60 text-xs mt-1">CTA button and social links</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h5 className="font-semibold text-white">Tips for Great Email Campaigns</h5>
            <ul className="list-disc list-inside space-y-1 text-white/70 text-sm">
              <li>Upload your product image for brand-consistent visuals</li>
              <li>Include your logo for header section generation</li>
              <li>Define clear tone preferences (professional, friendly, urgent, etc.)</li>
              <li>Specify your target audience for personalized messaging</li>
              <li>Use the Polish feature to refine AI-generated copy</li>
            </ul>
          </div>
        </div>
      )
    },
    'export-options': {
      title: 'Export Options',
      icon: 'fa-download',
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Exporting Your Campaign</h4>
          <p className="text-white/70">BananaADS offers two export formats to share your campaigns:</p>
          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <i className="fa-solid fa-code text-green-400"></i>
                <h5 className="font-semibold text-white">HTML Export</h5>
              </div>
              <p className="text-white/70 text-sm">Creates a self-contained HTML file with all images embedded as data URLs. Perfect for:</p>
              <ul className="list-disc list-inside mt-2 text-white/60 text-sm">
                <li>Sharing via email as an attachment</li>
                <li>Viewing in any web browser</li>
                <li>Archiving campaigns locally</li>
                <li>Presenting to clients without internet</li>
              </ul>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <i className="fa-solid fa-file-pdf text-red-400"></i>
                <h5 className="font-semibold text-white">PDF Export</h5>
              </div>
              <p className="text-white/70 text-sm">Generates a professional PDF document with all campaign assets. Ideal for:</p>
              <ul className="list-disc list-inside mt-2 text-white/60 text-sm">
                <li>Printing physical copies</li>
                <li>Professional presentations</li>
                <li>Client deliverables</li>
                <li>Portfolio documentation</li>
              </ul>
            </div>
          </div>
          <div className="bg-banana/10 border border-banana/30 rounded-lg p-3 mt-4">
            <p className="text-banana text-sm"><i className="fa-solid fa-lightbulb mr-2"></i>Tip: Generate all scene images before exporting for a complete campaign dossier.</p>
          </div>
        </div>
      )
    },
    'ai-features': {
      title: 'AI Features',
      icon: 'fa-wand-magic-sparkles',
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">AI-Powered Features</h4>
          <p className="text-white/70">BananaADS leverages Google Gemini AI for intelligent content generation:</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-banana/20 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-magnifying-glass text-banana text-sm"></i>
              </div>
              <div>
                <h5 className="font-semibold text-white text-sm">Brand Research</h5>
                <p className="text-white/60 text-xs">AI searches the web to understand your brand positioning, target audience, and competitive landscape.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-palette text-purple-400 text-sm"></i>
              </div>
              <div>
                <h5 className="font-semibold text-white text-sm">Mood Board Generation</h5>
                <p className="text-white/60 text-xs">Creates visual mood boards that capture your brand's aesthetic and guide creative direction.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-lightbulb text-blue-400 text-sm"></i>
              </div>
              <div>
                <h5 className="font-semibold text-white text-sm">Concept Generation</h5>
                <p className="text-white/60 text-xs">Generates 3 unique creative concepts with hooks, summaries, and visual directions.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-image text-green-400 text-sm"></i>
              </div>
              <div>
                <h5 className="font-semibold text-white text-sm">Image Generation</h5>
                <p className="text-white/60 text-xs">Creates high-quality storyboard images using your product photos as reference.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-pen text-orange-400 text-sm"></i>
              </div>
              <div>
                <h5 className="font-semibold text-white text-sm">Script Polish</h5>
                <p className="text-white/60 text-xs">Refines and improves AI-generated copy for better engagement and clarity.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-video text-red-400 text-sm"></i>
              </div>
              <div>
                <h5 className="font-semibold text-white text-sm">Video Animation</h5>
                <p className="text-white/60 text-xs">Animates static images into cinematic video clips (requires paid API key).</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    'keyboard-shortcuts': {
      title: 'Tips & Tricks',
      icon: 'fa-keyboard',
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Tips & Tricks</h4>
          <div className="space-y-3">
            <div className="bg-white/5 rounded-lg p-3">
              <h5 className="font-semibold text-white text-sm mb-2">Optimize Image Quality</h5>
              <p className="text-white/60 text-xs">Upload high-resolution product images (at least 1024x1024) for best results. The AI uses your product image as a reference for brand consistency.</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <h5 className="font-semibold text-white text-sm mb-2">Refine with Edit Instructions</h5>
              <p className="text-white/60 text-xs">Use the "Edit with AI" feature to make specific changes to generated images. Be descriptive: "Add more dramatic lighting" or "Change background to sunset".</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <h5 className="font-semibold text-white text-sm mb-2">Save Your Progress</h5>
              <p className="text-white/60 text-xs">Your work is automatically saved to browser storage. You can close the tab and return later to continue where you left off.</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <h5 className="font-semibold text-white text-sm mb-2">Copy Visual Prompts</h5>
              <p className="text-white/60 text-xs">Use the "Copy" button on visual prompts to use them in other AI image generators like Midjourney or DALL-E.</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <h5 className="font-semibold text-white text-sm mb-2">Regenerate Concepts</h5>
              <p className="text-white/60 text-xs">Not satisfied with the concepts? Click "Regenerate" to get 3 new creative directions without losing your brief.</p>
            </div>
          </div>
        </div>
      )
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-banana/20 flex items-center justify-center">
              <i className="fa-solid fa-question text-banana"></i>
            </div>
            <h2 className="text-2xl font-bold text-white">Help Center</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
          >
            <i className="fa-solid fa-times text-white/60"></i>
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          <nav className="w-64 border-r border-white/10 p-4 overflow-y-auto">
            {Object.entries(helpSections).map(([key, section]) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`w-full text-left p-3 rounded-xl mb-2 transition flex items-center gap-3 ${
                  activeSection === key 
                    ? 'bg-banana/20 text-banana' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <i className={`fa-solid ${section.icon} w-5`}></i>
                <span className="text-sm font-medium">{section.title}</span>
              </button>
            ))}
          </nav>
          
          <div className="flex-1 p-6 overflow-y-auto">
            {helpSections[activeSection]?.content}
          </div>
        </div>
        
        <div className="p-4 border-t border-white/10 text-center">
          <p className="text-white/40 text-sm">
            Need more help? Visit <a href="https://docs.devin.ai" target="_blank" rel="noopener noreferrer" className="text-banana hover:underline">docs.devin.ai</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpSystem;
