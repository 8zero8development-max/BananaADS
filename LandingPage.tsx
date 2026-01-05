import React, { useState, useEffect } from 'react';

// Social post ads (keeping these)
import adKFC from '@assets/poster-KFC_1767401674348.png';
import adKebab from '@assets/poster-King_Kebab_1767401686129.png';
import adPizza from '@assets/poster-Rocket_Pizza_&_Ice_Cream_1767401693311.png';
import adBurger from '@assets/poster-Dopey_Dan\'s_Burger_Ranch_(4)_1767401798890.png';

// Mood boards (keeping these)
import moodKFC from '@assets/download_(8)_1767402167301.png';
import moodPizza from '@assets/mood-board_(3)_1767402249246.png';
import moodNike from '@assets/mood-board_(4)_1767402268781.png';

// Custom workflow icons
import iconCinematic from '@assets/icons/cinematic-video.png';
import iconFoodSocial from '@assets/icons/food-socials.png';
import iconEmail from '@assets/icons/email-campaign.png';
import iconSocialPosters from '@assets/icons/social-posters.png';
import bananaDumbbells from '@assets/image_1767568037797.png';

// New workflow screenshots - Getting Started
import screenshotApiKey from '@/bananascreenshots/Input API .png';

// New workflow screenshots - Brand DNA Research
import screenshotBrandInput from '@/bananascreenshots/Input brand details.png';
import screenshotSearchingWeb from '@/bananascreenshots/Banana in your DNA.png';
import screenshotBrandDNA from '@/bananascreenshots/Retrieve brand name DNA.png';
import screenshotBrandDNA2 from '@/bananascreenshots/Retrieve Brand DNA 2.png';
import screenshotMoodBoard from '@/bananascreenshots/Full professional mood board.png';

// New workflow screenshots - Cinematic Video
import screenshotCinematicConcepts from '@/bananascreenshots/Cinematic Concepts.png';
import screenshotAnalyseConcept from '@/bananascreenshots/Analyse concept.png';
import screenshotCinematic1 from '@/bananascreenshots/Cinematic 1.png';
import screenshotCinematic2 from '@/bananascreenshots/Cinematic 2.png';
import screenshotCinematic3 from '@/bananascreenshots/Cinematic 3.png';
import screenshotCinematicGen from '@/bananascreenshots/Cinematic image generation.png';

// New workflow screenshots - Food Social
import screenshotFoodSocial1 from '@/bananascreenshots/Food Social 1.png';
import screenshotFoodSocialGen from '@/bananascreenshots/Food social generation.png';
import screenshotFoodSocial2 from '@/bananascreenshots/Food social too.png';

// New workflow screenshots - Email Campaign
import screenshotEmailGen from '@/bananascreenshots/Email generation.png';
import screenshotEmailConcepts from '@/bananascreenshots/Email concepts.png';
import screenshotEmail1 from '@/bananascreenshots/Email 1.png';
import screenshotEmailTo from '@/bananascreenshots/Email to.png';
import screenshotEmailTemplateGen from '@/bananascreenshots/Email template generation.png';
import screenshotEmailOutput1 from '@/bananascreenshots/Email output 1.png';
import screenshotEmailOutput2 from '@/bananascreenshots/Email output 2.png';
import screenshotEmailOutput3 from '@/bananascreenshots/Email output 3.png';
import screenshotEmailOutput5 from '@/bananascreenshots/Email output 5.png';
import screenshotEmailOutputFor from '@/bananascreenshots/Email output for.png';
import screenshotEmailCode from '@/bananascreenshots/Email output code.png';

// New workflow screenshots - Social Posters (Facebook)
import screenshotFacebookConcepts from '@/bananascreenshots/Facebook Concepts.png';
import screenshotFacebookOne from '@/bananascreenshots/Facebook One.png';
import screenshotFacebookToo from '@/bananascreenshots/Facebook too.png';
import screenshotFacebook3 from '@/bananascreenshots/Facebook3.png';

interface LandingPageProps {
  onGetStarted: () => void;
}

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string } | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
  prices: Price[];
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Carousel state for each workflow section
  const [brandDnaIndex, setBrandDnaIndex] = useState(0);
  const [cinematicIndex, setCinematicIndex] = useState(0);
  const [socialPostersIndex, setSocialPostersIndex] = useState(0);
  const [foodSocialIndex, setFoodSocialIndex] = useState(0);
  const [emailIndex, setEmailIndex] = useState(0);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setProducts(data.data);
        }
      })
      .catch(err => console.log('Products not available yet'));
  }, []);

  const handleCheckout = async (priceId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, email: 'guest@example.com' })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      onGetStarted();
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: '🧬',
      title: 'Brand DNA Research (automatic)',
      description: 'AI researches your brand, tone, audience, and positioning before generating anything.'
    },
    {
      icon: '🖼️',
      title: 'Professional Mood Boards',
      description: 'Lock aesthetic direction and kill endless feedback loops with AI-generated mood boards.'
    },
    {
      icon: '✨',
      title: '3 Creative Directions Per Campaign',
      description: 'Emotional, high-energy, or minimalist — pick your route, no revisions needed.'
    },
    {
      icon: '🎯',
      title: 'Your Real Product In Every Asset',
      description: 'Your actual product appears in every scene. Not stock photos. Not placeholders.'
    },
    {
      icon: '🎙️',
      title: 'Voiceovers Without Hiring Talent',
      description: 'Professional AI voiceovers with multiple voice options. No casting. No studio time.'
    },
    {
      icon: '🎬',
      title: 'Video-Ready Storyboards',
      description: 'Export-ready assets built for Veo video generation. Multi-format exports included.'
    }
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '£11.99',
      period: '/month',
      description: 'For creators and small brands',
      features: ['5 campaigns per month', 'Storyboards + scripts', 'Mood boards', 'Cheaper than one Canva Pro mistake'],
      cta: 'Sign Up Now',
      popular: false,
      originalPrice: null
    },
    {
      name: 'Lifetime',
      price: '£59.99',
      period: ' one-time',
      description: 'For people who understand leverage',
      features: ['Everything included', 'Video generation (Veo)', 'API access', 'Custom integrations', 'Because early movers win'],
      cta: 'Sign Up Now',
      popular: true,
      originalPrice: '£299'
    },
    {
      name: 'Professional',
      price: '£24.99',
      period: '/month',
      description: 'For businesses that run ads properly',
      features: ['Unlimited campaigns', 'Priority support', 'Export everything', 'This replaces freelancers'],
      cta: 'Sign Up Now',
      popular: false,
      originalPrice: null
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-yellow-500/10 py-4 px-8 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🍌</span>
          <span className="font-bold text-xl tracking-tight">
            <span className="text-yellow-400">BANANA</span>
            <span className="text-white">ADS</span>
          </span>
        </div>
        <div className="flex items-center space-x-6">
          <a href="#features" className="text-white/60 hover:text-yellow-400 transition text-sm font-medium">Features</a>
          <a href="#pricing" className="text-white/60 hover:text-yellow-400 transition text-sm font-medium">Pricing</a>
          <button
            onClick={() => {
              localStorage.removeItem('onboarding-completed');
              onGetStarted();
            }}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-2 rounded-full font-bold text-sm hover:scale-105 transition"
          >
            Get Started
          </button>
        </div>
      </nav>

      <section className="pt-28 pb-12 px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-1.5 mb-6">
            <span className="text-yellow-400 text-xs font-semibold tracking-wide uppercase">This isn't "AI help." This is an ad production line.</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-serif mb-3 leading-[1.1]">
            <span style={{ color: '#FFD700' }}>
              Stop Paying Agencies
            </span>
            <br />
            <span style={{ color: '#C0C0C0' }}>To Do What AI Can Do</span>
            <br />
            <span style={{ color: '#FFD700' }}>In Minutes</span>
          </h1>
          
          <div className="w-48 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent mx-auto mb-4"></div>

          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-5 leading-relaxed">
            BananaADS turns a rough idea into scroll-stopping ads, storyboards, scripts, visuals, and video — without meetings, retainers, or waiting weeks.
          </p>

          <div className="flex flex-wrap justify-center gap-5 mb-8 text-sm">
            <div className="flex items-center gap-2 text-white">
              <span className="text-green-500 text-lg font-bold">✓</span>
              <span>Your real product in every scene</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <span className="text-green-500 text-lg font-bold">✓</span>
              <span>3 creative directions per campaign</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <span className="text-green-500 text-lg font-bold">✓</span>
              <span>Export-ready ads in minutes</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <span className="text-green-500 text-lg font-bold">✓</span>
              <span>No designers. No editors. No bullshit.</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 mb-10">
            <button
              onClick={() => {
                localStorage.removeItem('onboarding-completed');
                onGetStarted();
              }}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-8 py-3 rounded-full font-bold text-base hover:scale-105 transition shadow-lg shadow-yellow-500/25"
            >
              Start Creating Free
            </button>
            <p className="text-white/40 text-xs">No credit card. Your API key stays in your browser.</p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 blur-3xl rounded-3xl"></div>
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="relative bg-black/50 backdrop-blur border border-yellow-500/20 rounded-2xl p-2 shadow-2xl transform hover:scale-105 transition-transform">
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-sm z-10">1</div>
                <img
                  src={screenshotBrandInput}
                  alt="Brand Brief - Tell us about your brand"
                  className="rounded-xl w-full"
                />
                <div className="mt-3 flex justify-center">
                  <div className="bg-black/80 border-2 border-yellow-500 rounded-lg px-4 py-2 flex items-center gap-2">
                    <span className="text-white text-sm font-medium">Brand Brief</span>
                    <span>🍌</span>
                  </div>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div className="relative bg-black/50 backdrop-blur border border-yellow-500/20 rounded-2xl p-2 shadow-2xl transform hover:scale-105 transition-transform md:-translate-y-4">
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-sm z-10">2</div>
                <img
                  src={screenshotCinematicConcepts}
                  alt="Creative Concepts - Select your vision"
                  className="rounded-xl w-full"
                />
                <div className="mt-3 flex justify-center">
                  <div className="bg-black/80 border-2 border-yellow-500 rounded-lg px-4 py-2 flex items-center gap-2">
                    <span className="text-white text-sm font-medium">Creative Concepts</span>
                    <span>🍌</span>
                  </div>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div className="relative bg-black/50 backdrop-blur border border-yellow-500/20 rounded-2xl p-2 shadow-2xl transform hover:scale-105 transition-transform">
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-sm z-10">3</div>
                <img
                  src={screenshotCinematic1}
                  alt="Production - Storyboard and video generation"
                  className="rounded-xl w-full"
                />
                <div className="mt-3 flex justify-center">
                  <div className="bg-black/80 border-2 border-yellow-500 rounded-lg px-4 py-2 flex items-center gap-2">
                    <span className="text-white text-sm font-medium">Production</span>
                    <span>🍌</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Positioning Section */}
      <section className="py-16 px-8 border-t border-white/5 bg-gradient-to-b from-transparent via-red-500/5 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif mb-6 leading-tight">
            <span className="text-white">Most ads fail for one reason:</span>
            <br />
            <span className="text-yellow-400">They don't understand the brand.</span>
          </h2>
          <div className="space-y-4 text-lg text-white/60 mb-8">
            <p>Agencies guess.</p>
            <p>Freelancers copy competitors.</p>
            <p>Templates look like templates.</p>
          </div>
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-8 mb-8">
            <p className="text-xl text-white font-semibold mb-4">BananaADS starts where everyone else skips: <span className="text-yellow-400">Brand DNA</span>.</p>
            <p className="text-white/60 mb-6">Before a single visual is generated, the system:</p>
            <div className="grid md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
              <div className="flex items-center gap-3">
                <span className="text-yellow-400 text-lg">✓</span>
                <span className="text-white/80">Researches your brand</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-yellow-400 text-lg">✓</span>
                <span className="text-white/80">Analyses tone, audience, competitors</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-yellow-400 text-lg">✓</span>
                <span className="text-white/80">Understands positioning</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-yellow-400 text-lg">✓</span>
                <span className="text-white/80">Builds a creative foundation</span>
              </div>
            </div>
          </div>
          <p className="text-xl text-white/80">That's why the output doesn't look "AI-ish".</p>
          <p className="text-2xl text-yellow-400 font-bold mt-2">It looks intentional.</p>
        </div>
      </section>

      <section className="py-10 px-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-6">
            <h2 className="text-3xl md:text-4xl font-serif leading-tight">
              <span className="text-yellow-400">Four Production Pipelines.</span>
              {' '}
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                One Input.
              </span>
            </h2>
          </div>
          <div className="relative hidden md:block">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 200" preserveAspectRatio="none">
              <path 
                d="M125 140 Q200 60 280 100 Q360 140 440 60 Q520 -20 600 100 Q680 220 760 100 Q840 -20 875 60" 
                stroke="#FFD700" 
                strokeWidth="3" 
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3 text-center md:-translate-y-4">
              <img src={iconCinematic} alt="Cinematic Video" className="w-32 h-32 mx-auto mb-1.5 rounded-lg object-cover" />
              <p className="text-white/70 text-xs font-medium">Cinematic Video</p>
            </div>
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3 text-center md:translate-y-4">
              <img src={iconSocialPosters} alt="Social Posters" className="w-32 h-32 mx-auto mb-1.5 rounded-lg object-cover" />
              <p className="text-white/70 text-xs font-medium">Social Posters</p>
            </div>
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3 text-center md:-translate-y-4">
              <img src={iconFoodSocial} alt="Food Socials" className="w-32 h-32 mx-auto mb-1.5 rounded-lg object-cover" />
              <p className="text-white/70 text-xs font-medium">Food Socials</p>
            </div>
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3 text-center md:translate-y-4">
              <img src={iconEmail} alt="Email Campaign" className="w-32 h-32 mx-auto mb-1.5 rounded-lg object-cover" />
              <p className="text-white/70 text-xs font-medium">Email Campaign</p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Showcase Section */}
      <section className="py-16 px-8 border-t border-white/5 bg-gradient-to-b from-transparent via-yellow-500/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-3">See The Complete Workflow</p>
            <h2 className="text-3xl md:text-4xl font-serif mb-3 leading-tight">
              <span className="text-yellow-400">Built for the</span>
              <br />
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                AI-First Creative Workflow
              </span>
            </h2>
            <p className="text-white/50 text-base max-w-xl mx-auto">
              From brand research to final export, see how BananaADS transforms your ideas into stunning campaigns
            </p>
          </div>

          {/* Brand DNA Research Workflow */}
          <div className="mb-12">
            <div className="flex flex-col items-center text-center gap-2 mb-6">
              <div className="w-14 h-14 flex items-center justify-center text-4xl drop-shadow-lg">
                🧬
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Your Brand Has DNA — We Decode It</h3>
                <p className="text-white/50 text-sm max-w-lg">BananaADS searches the web, reads how your brand speaks, understands who you're selling to, and locks tone, vibe, and positioning. So every ad feels like you, not a stock prompt.</p>
              </div>
            </div>
            {/* Swipe Cards Carousel */}
            <div className="relative">
              <div className="overflow-hidden px-4">
                <div 
                  className="flex transition-transform duration-500 ease-out gap-4"
                  style={{ transform: `translateX(-${brandDnaIndex * 280}px)` }}
                >
                  {[
                    { img: screenshotApiKey, label: 'Secure API Setup' },
                    { img: screenshotSearchingWeb, label: 'AI Web Research' },
                    { img: screenshotBrandDNA, label: 'Brand DNA Profile' },
                    { img: screenshotBrandDNA2, label: 'Extended Profile' },
                    { img: screenshotMoodBoard, label: 'AI Mood Board' }
                  ].map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`flex-shrink-0 w-64 transition-all duration-300 cursor-pointer ${brandDnaIndex === idx ? 'scale-105 z-10' : 'scale-95 opacity-70 hover:opacity-90'}`}
                      onClick={() => setBrandDnaIndex(idx)}
                    >
                      <div className="bg-black/60 backdrop-blur border-2 border-yellow-500/40 rounded-xl p-3 shadow-xl hover:border-yellow-500 transition-all">
                        <img src={item.img} alt={item.label} className="rounded-lg w-full h-40 object-cover" />
                        <p className="text-center text-sm text-white/80 mt-2 font-medium">{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Navigation Arrows */}
              <button 
                onClick={() => setBrandDnaIndex(prev => Math.max(0, prev - 1))}
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/80 border border-yellow-500/30 flex items-center justify-center text-yellow-400 hover:bg-yellow-500/20 transition-all z-20 ${brandDnaIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                disabled={brandDnaIndex === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button 
                onClick={() => setBrandDnaIndex(prev => Math.min(4, prev + 1))}
                className={`absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/80 border border-yellow-500/30 flex items-center justify-center text-yellow-400 hover:bg-yellow-500/20 transition-all z-20 ${brandDnaIndex === 4 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                disabled={brandDnaIndex === 4}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              {/* Dots Indicator */}
              <div className="flex justify-center gap-2 mt-4">
                {[0, 1, 2, 3, 4].map(idx => (
                  <button
                    key={idx}
                    onClick={() => setBrandDnaIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${brandDnaIndex === idx ? 'bg-yellow-400 w-6' : 'bg-white/20 hover:bg-white/40'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Cinematic Video Workflow */}
          <div className="mb-12">
            <div className="flex flex-col items-center text-center gap-2 mb-6">
              <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg shadow-orange-500/30">
                <img src={iconCinematic} alt="Cinematic Video" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Cinematic Video Ads</h3>
                <p className="text-white/50 text-sm max-w-lg">Broadcast-quality concepts without a production crew. 3 cinematic directions per brief, shot lists, storyboards, scripts, AI-generated visuals. Built for Veo video generation. This is what agencies charge £3–10k for. You generate it before lunch.</p>
              </div>
            </div>
            {/* Swipe Cards Carousel */}
            <div className="relative">
              <div className="overflow-hidden px-4">
                <div 
                  className="flex transition-transform duration-500 ease-out gap-4"
                  style={{ transform: `translateX(-${cinematicIndex * 280}px)` }}
                >
                  {[
                    { img: screenshotCinematicConcepts, label: '3 Creative Concepts' },
                    { img: screenshotAnalyseConcept, label: 'AI Director at Work' },
                    { img: screenshotCinematicGen, label: 'Generating Scenes' },
                    { img: screenshotCinematic1, label: 'Scene 1' },
                    { img: screenshotCinematic2, label: 'Scene 2' },
                    { img: screenshotCinematic3, label: 'Scene 3' }
                  ].map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`flex-shrink-0 w-64 transition-all duration-300 cursor-pointer ${cinematicIndex === idx ? 'scale-105 z-10' : 'scale-95 opacity-70 hover:opacity-90'}`}
                      onClick={() => setCinematicIndex(idx)}
                    >
                      <div className="bg-black/60 backdrop-blur border-2 border-orange-500/40 rounded-xl p-3 shadow-xl hover:border-orange-500 transition-all">
                        <img src={item.img} alt={item.label} className="rounded-lg w-full h-40 object-cover" />
                        <p className="text-center text-sm text-white/80 mt-2 font-medium">{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Navigation Arrows */}
              <button 
                onClick={() => setCinematicIndex(prev => Math.max(0, prev - 1))}
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/80 border border-orange-500/30 flex items-center justify-center text-orange-400 hover:bg-orange-500/20 transition-all z-20 ${cinematicIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                disabled={cinematicIndex === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button 
                onClick={() => setCinematicIndex(prev => Math.min(5, prev + 1))}
                className={`absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/80 border border-orange-500/30 flex items-center justify-center text-orange-400 hover:bg-orange-500/20 transition-all z-20 ${cinematicIndex === 5 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                disabled={cinematicIndex === 5}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              {/* Dots Indicator */}
              <div className="flex justify-center gap-2 mt-4">
                {[0, 1, 2, 3, 4, 5].map(idx => (
                  <button
                    key={idx}
                    onClick={() => setCinematicIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${cinematicIndex === idx ? 'bg-orange-400 w-6' : 'bg-white/20 hover:bg-white/40'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Food Social Workflow */}
          <div className="mb-12">
            <div className="flex flex-col items-center text-center gap-2 mb-6">
              <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg shadow-red-500/30">
                <img src={iconFoodSocial} alt="Food Social" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Food Social Content</h3>
                <p className="text-white/50 text-sm max-w-lg">Make people hungry. Then make them click. AI food photography, multiple variations per product, consistent brand styling, ready for socials immediately. Restaurants use this daily. Agencies hate it.</p>
              </div>
            </div>
            {/* Swipe Cards Carousel */}
            <div className="relative">
              <div className="overflow-hidden px-4">
                <div 
                  className="flex transition-transform duration-500 ease-out gap-4 justify-center"
                  style={{ transform: `translateX(-${foodSocialIndex * 280}px)` }}
                >
                  {[
                    { img: screenshotFoodSocialGen, label: 'AI Food Photographer' },
                    { img: screenshotFoodSocial1, label: 'Social Post Ready' },
                    { img: screenshotFoodSocial2, label: 'Multiple Variations' }
                  ].map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`flex-shrink-0 w-64 transition-all duration-300 cursor-pointer ${foodSocialIndex === idx ? 'scale-105 z-10' : 'scale-95 opacity-70 hover:opacity-90'}`}
                      onClick={() => setFoodSocialIndex(idx)}
                    >
                      <div className="bg-black/60 backdrop-blur border-2 border-red-500/40 rounded-xl p-3 shadow-xl hover:border-red-500 transition-all">
                        <img src={item.img} alt={item.label} className="rounded-lg w-full h-40 object-cover" />
                        <p className="text-center text-sm text-white/80 mt-2 font-medium">{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Navigation Arrows */}
              <button 
                onClick={() => setFoodSocialIndex(prev => Math.max(0, prev - 1))}
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/80 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all z-20 ${foodSocialIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                disabled={foodSocialIndex === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button 
                onClick={() => setFoodSocialIndex(prev => Math.min(2, prev + 1))}
                className={`absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/80 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all z-20 ${foodSocialIndex === 2 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                disabled={foodSocialIndex === 2}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              {/* Dots Indicator */}
              <div className="flex justify-center gap-2 mt-4">
                {[0, 1, 2].map(idx => (
                  <button
                    key={idx}
                    onClick={() => setFoodSocialIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${foodSocialIndex === idx ? 'bg-red-400 w-6' : 'bg-white/20 hover:bg-white/40'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Social Posters (Facebook) Workflow */}
          <div className="mb-12">
            <div className="flex flex-col items-center text-center gap-2 mb-6">
              <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg shadow-blue-500/30">
                <img src={iconSocialPosters} alt="Social Posters" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Social Posters (Facebook / Meta)</h3>
                <p className="text-white/50 text-sm max-w-lg">Ads designed to stop thumbs, not win design awards. Scroll-first layouts, clear hierarchy, message over decoration, optimised for feed behaviour. No Canva templates. No "designer ego".</p>
              </div>
            </div>
            {/* Swipe Cards Carousel */}
            <div className="relative">
              <div className="overflow-hidden px-4">
                <div 
                  className="flex transition-transform duration-500 ease-out gap-4"
                  style={{ transform: `translateX(-${socialPostersIndex * 280}px)` }}
                >
                  {[
                    { img: screenshotFacebookConcepts, label: 'Facebook Concepts' },
                    { img: screenshotFacebookOne, label: 'Post Design 1' },
                    { img: screenshotFacebookToo, label: 'Post Design 2' },
                    { img: screenshotFacebook3, label: 'Post Design 3' }
                  ].map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`flex-shrink-0 w-64 transition-all duration-300 cursor-pointer ${socialPostersIndex === idx ? 'scale-105 z-10' : 'scale-95 opacity-70 hover:opacity-90'}`}
                      onClick={() => setSocialPostersIndex(idx)}
                    >
                      <div className="bg-black/60 backdrop-blur border-2 border-blue-500/40 rounded-xl p-3 shadow-xl hover:border-blue-500 transition-all">
                        <img src={item.img} alt={item.label} className="rounded-lg w-full h-40 object-cover" />
                        <p className="text-center text-sm text-white/80 mt-2 font-medium">{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Navigation Arrows */}
              <button 
                onClick={() => setSocialPostersIndex(prev => Math.max(0, prev - 1))}
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/80 border border-blue-500/30 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 transition-all z-20 ${socialPostersIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                disabled={socialPostersIndex === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button 
                onClick={() => setSocialPostersIndex(prev => Math.min(3, prev + 1))}
                className={`absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/80 border border-blue-500/30 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 transition-all z-20 ${socialPostersIndex === 3 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                disabled={socialPostersIndex === 3}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              {/* Dots Indicator */}
              <div className="flex justify-center gap-2 mt-4">
                {[0, 1, 2, 3].map(idx => (
                  <button
                    key={idx}
                    onClick={() => setSocialPostersIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${socialPostersIndex === idx ? 'bg-blue-400 w-6' : 'bg-white/20 hover:bg-white/40'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Email Campaign Workflow */}
          <div>
            <div className="flex flex-col items-center text-center gap-2 mb-6">
              <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg shadow-purple-500/30">
                <img src={iconEmail} alt="Email Campaigns" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Email Campaigns</h3>
                <p className="text-white/50 text-sm max-w-lg">Emails people actually read. Full email concepts, section-by-section generation, visuals + copy aligned, export clean HTML. No Frankensteining templates. No copy-paste hell.</p>
              </div>
            </div>
            {/* Swipe Cards Carousel */}
            <div className="relative">
              <div className="overflow-hidden px-4">
                <div 
                  className="flex transition-transform duration-500 ease-out gap-4"
                  style={{ transform: `translateX(-${emailIndex * 280}px)` }}
                >
                  {[
                    { img: screenshotEmailGen, label: 'Campaign Setup' },
                    { img: screenshotEmailConcepts, label: '3 Email Concepts' },
                    { img: screenshotEmail1, label: 'Section Generation' },
                    { img: screenshotEmailTo, label: 'All Sections' },
                    { img: screenshotEmailOutput1, label: 'Hero Section' },
                    { img: screenshotEmailOutput2, label: 'Body Section' },
                    { img: screenshotEmailOutput3, label: 'Infographic' },
                    { img: screenshotEmailOutputFor, label: 'Rich Content' },
                    { img: screenshotEmailOutput5, label: 'Footer Section' },
                    { img: screenshotEmailTemplateGen, label: 'AI Generating' },
                    { img: screenshotEmailCode, label: 'Export HTML Code' }
                  ].map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`flex-shrink-0 w-64 transition-all duration-300 cursor-pointer ${emailIndex === idx ? 'scale-105 z-10' : 'scale-95 opacity-70 hover:opacity-90'}`}
                      onClick={() => setEmailIndex(idx)}
                    >
                      <div className="bg-black/60 backdrop-blur border-2 border-purple-500/40 rounded-xl p-3 shadow-xl hover:border-purple-500 transition-all">
                        <img src={item.img} alt={item.label} className="rounded-lg w-full h-40 object-cover" />
                        <p className="text-center text-sm text-white/80 mt-2 font-medium">{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Navigation Arrows */}
              <button 
                onClick={() => setEmailIndex(prev => Math.max(0, prev - 1))}
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/80 border border-purple-500/30 flex items-center justify-center text-purple-400 hover:bg-purple-500/20 transition-all z-20 ${emailIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                disabled={emailIndex === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button 
                onClick={() => setEmailIndex(prev => Math.min(10, prev + 1))}
                className={`absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/80 border border-purple-500/30 flex items-center justify-center text-purple-400 hover:bg-purple-500/20 transition-all z-20 ${emailIndex === 10 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                disabled={emailIndex === 10}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              {/* Dots Indicator */}
              <div className="flex justify-center gap-2 mt-4">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(idx => (
                  <button
                    key={idx}
                    onClick={() => setEmailIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${emailIndex === idx ? 'bg-purple-400 w-6' : 'bg-white/20 hover:bg-white/40'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-serif mb-3 leading-tight">
              <span className="text-yellow-400">This Is What It Produces</span>
              <br />
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Not "Concept Art"
              </span>
            </h2>
            <p className="text-white/50 text-base max-w-lg mx-auto">
              These aren't mockups. They're deployable ads. Used by restaurants, brands, and agencies who don't want to hire juniors. If it didn't convert, it wouldn't exist.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="group relative overflow-hidden rounded-2xl border border-yellow-500/20 hover:border-yellow-500/50 transition-all duration-300">
              <img src={adKFC} alt="KFC Zinger Ad" className="w-full h-auto transform group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <div>
                  <p className="text-yellow-400 font-bold text-lg">KFC Zinger</p>
                  <p className="text-white/70 text-sm">Spice. Crunch. Legend.</p>
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-yellow-500/20 hover:border-yellow-500/50 transition-all duration-300">
              <img src={adKebab} alt="King Kebab Ad" className="w-full h-auto transform group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <div>
                  <p className="text-yellow-400 font-bold text-lg">King Kebab</p>
                  <p className="text-white/70 text-sm">Shawarma Power Up</p>
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-yellow-500/20 hover:border-yellow-500/50 transition-all duration-300">
              <img src={adPizza} alt="Rocket Pizza Ad" className="w-full h-auto transform group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <div>
                  <p className="text-yellow-400 font-bold text-lg">Rocket Pizza</p>
                  <p className="text-white/70 text-sm">Unbeatable Pepperoni</p>
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-yellow-500/20 hover:border-yellow-500/50 transition-all duration-300">
              <img src={adBurger} alt="Dopey Dan's Burger Ranch Ad" className="w-full h-auto transform group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <div>
                  <p className="text-yellow-400 font-bold text-lg">Dopey Dan's</p>
                  <p className="text-white/70 text-sm">Saddle Up!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-serif mb-3 leading-tight">
              <span className="text-white">Make Clients Say</span>
              <br />
              <span className="text-yellow-400">"Yeah... That's It."</span>
            </h2>
            <p className="text-white/50 text-base max-w-lg mx-auto">
              Mood boards that lock aesthetic direction, kill endless feedback loops, and make decisions faster. You don't need taste. The system brings it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="group relative overflow-hidden rounded-2xl border border-yellow-500/20 hover:border-yellow-500/50 transition-all duration-300 shadow-lg shadow-black/20">
              <img src={moodKFC} alt="KFC Zinger Tower Mood Board" className="w-full h-auto transform group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <div>
                  <p className="text-yellow-400 font-bold text-lg">KFC Zinger Tower</p>
                  <p className="text-white/70 text-sm">Color palette + lifestyle imagery</p>
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-yellow-500/20 hover:border-yellow-500/50 transition-all duration-300 shadow-lg shadow-black/20">
              <img src={moodPizza} alt="Rocket Pizza Mood Board" className="w-full h-auto transform group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <div>
                  <p className="text-yellow-400 font-bold text-lg">Rocket Rush Pizza</p>
                  <p className="text-white/70 text-sm">Taste at warp speed</p>
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-yellow-500/20 hover:border-yellow-500/50 transition-all duration-300 shadow-lg shadow-black/20">
              <img src={moodNike} alt="Nike Monarch IV Mood Board" className="w-full h-auto transform group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <div>
                  <p className="text-yellow-400 font-bold text-lg">Nike Monarch IV</p>
                  <p className="text-white/70 text-sm">Engineered for your everyday</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-serif mb-3 leading-tight">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                What You Actually Get
              </span>
            </h2>
            <p className="text-white/50 text-base max-w-lg mx-auto">
              What you don't get: Meetings. Retainers. Waiting.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group bg-white/[0.02] hover:bg-white/[0.05] border border-yellow-500/10 hover:border-yellow-500/30 rounded-xl p-6 transition-all duration-300"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-bold mb-2 text-white group-hover:text-yellow-400 transition">
                  {feature.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-8 py-3 rounded-full font-bold text-base hover:scale-105 transition shadow-lg shadow-yellow-500/25"
            >
              Start Creating Free
            </button>
            <p className="text-white/40 text-xs mt-2">No credit card required</p>
          </div>
        </div>
      </section>

      <section className="py-16 px-8 bg-gradient-to-b from-transparent via-yellow-500/5 to-transparent relative overflow-hidden">
        <div className="absolute top-1/4 left-0 w-72 h-72 bg-yellow-500/10 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-orange-500/10 blur-[100px] rounded-full"></div>

        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-10">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Straight, No Diagram Bullshit</p>
            <h2 className="text-3xl md:text-4xl font-serif mb-3 leading-tight">
              <span className="text-yellow-400">How It Works</span>
              <br />
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                3 Steps. Done.
              </span>
            </h2>
            <p className="text-white/50 text-base max-w-lg mx-auto">
              No revisions. No meetings. Just results.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div className="relative">
              <div className="absolute left-[19px] top-[50px] bottom-[50px] w-[2px] bg-gradient-to-b from-yellow-400 via-yellow-500 to-orange-500 hidden md:block"></div>

              <div className="space-y-4">
                <div className="group relative bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 hover:border-yellow-500/40 rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-yellow-500/10">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 relative">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-black font-bold text-sm shadow-lg shadow-yellow-500/30">
                        01
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-white group-hover:text-yellow-400 transition">Brief Your Brand</h3>
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">~60 sec</span>
                      </div>
                      <p className="text-white/50 text-sm leading-relaxed">You answer a few questions. BananaADS does the research.</p>
                    </div>
                  </div>
                </div>

                <div className="group relative bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 hover:border-yellow-500/40 rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-yellow-500/10">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 relative">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-400 flex items-center justify-center text-black font-bold text-sm shadow-lg shadow-orange-500/30">
                        02
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-white group-hover:text-yellow-400 transition">Choose Your Direction</h3>
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">3 Options</span>
                      </div>
                      <p className="text-white/50 text-sm leading-relaxed">Pick from 3 creative routes: Emotional, High-energy, or Minimalist.</p>
                    </div>
                  </div>
                </div>

                <div className="group relative bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 hover:border-orange-500/40 rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/10">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 relative">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-black font-bold text-sm shadow-lg shadow-orange-500/30">
                        03
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition">Generate & Export</h3>
                        <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">Export-Ready</span>
                      </div>
                      <p className="text-white/50 text-sm leading-relaxed">You get: Storyboards, Scripts, Visuals, Video-ready assets. Featuring your real product.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 blur-3xl rounded-full"></div>
              <div className="relative bg-black/60 backdrop-blur-xl border border-yellow-500/20 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 px-6 py-4 border-b border-yellow-500/20">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="ml-4 text-white/40 text-sm font-medium">Campaign Pipeline</span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-4 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <span className="text-green-400 text-lg">✓</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-white/40 mb-1">Brand Brief</div>
                      <div className="font-bold text-green-400">AI Research Complete</div>
                    </div>
                    <div className="text-xs text-green-400/60">12 sources</div>
                  </div>

                  <div className="flex items-center gap-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                      <span className="text-yellow-400 text-lg">🎬</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-white/40 mb-1">Creative Concepts</div>
                      <div className="font-bold text-yellow-400">3 Directions Ready</div>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-6 h-6 rounded bg-yellow-500/30"></div>
                      <div className="w-6 h-6 rounded bg-orange-500/30"></div>
                      <div className="w-6 h-6 rounded bg-red-500/30"></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center animate-pulse">
                      <span className="text-orange-400 text-lg">🎥</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-white/40 mb-2">Production Assets</div>
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full rounded-full w-3/4 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="text-xs text-orange-400/60">75%</div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-2">
                    <div className="text-center p-2 bg-white/5 rounded-lg">
                      <div className="text-lg mb-1">📸</div>
                      <div className="text-[10px] text-white/40">Storyboards</div>
                    </div>
                    <div className="text-center p-2 bg-white/5 rounded-lg">
                      <div className="text-lg mb-1">📝</div>
                      <div className="text-[10px] text-white/40">Scripts</div>
                    </div>
                    <div className="text-center p-2 bg-white/5 rounded-lg">
                      <div className="text-lg mb-1">🎙️</div>
                      <div className="text-[10px] text-white/40">Voiceovers</div>
                    </div>
                    <div className="text-center p-2 bg-white/5 rounded-lg">
                      <div className="text-lg mb-1">🎬</div>
                      <div className="text-[10px] text-white/40">Video</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-16 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-3 py-1 mb-4">
              <span className="text-orange-400 text-xs font-semibold uppercase tracking-wide">Launch Pricing - Limited Time</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif mb-3 leading-tight">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Pay Agencies Thousands
              </span>
              <br />
              <span className="text-yellow-400">Or Pay Less Than a Takeaway</span>
            </h2>
            <p className="text-white/50 text-base">
              You can pay agencies thousands. Or pay BananaADS less than a takeaway.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {pricingPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`relative rounded-xl p-5 transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-b from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/50 scale-105'
                    : 'bg-white/[0.02] border border-white/10 hover:border-yellow-500/30'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wide">
                    Most Popular
                  </div>
                )}

                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                <p className="text-white/40 text-xs mb-4">{plan.description}</p>

                <div className="mb-4">
                  {plan.originalPrice && (
                    <div className="text-xs text-white/40 line-through mb-0.5">Reduced from {plan.originalPrice}</div>
                  )}
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-white/40 text-sm">{plan.period}</span>
                </div>

                <ul className="space-y-2 mb-5">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center gap-2 text-xs text-white/70">
                      <span className="text-yellow-400">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={onGetStarted}
                  className={`w-full py-2.5 rounded-full font-bold text-sm transition ${
                    plan.popular
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:scale-105'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-8 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-3 py-1 mb-5">
            <span className="text-yellow-400 text-xs font-semibold uppercase tracking-wide">The Ad Industry Won't Like This</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif mb-4 leading-tight">
            <span className="text-yellow-400">Agencies Sell Time.</span>
            <br />
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              BananaADS Sells Output.
            </span>
          </h2>
          <p className="text-white/50 text-base mb-4 max-w-lg mx-auto">
            If you run ads, sell products, or build brands — this saves you money every single month.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-6 text-xs text-white/60">
            <span>Run Ads</span>
            <span>&#8226;</span>
            <span>Sell Products</span>
            <span>&#8226;</span>
            <span>Build Brands</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-8 py-3 rounded-full font-bold text-base hover:scale-105 transition shadow-lg shadow-yellow-500/25"
            >
              Start Creating Free
            </button>
            <p className="text-white/40 text-xs">No credit card. No lock-in. No excuses.</p>
          </div>
        </div>
      </section>

      <footer className="py-6 px-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-1.5">
            <span className="text-lg">🍌</span>
            <span className="font-bold text-sm tracking-tight">
              <span className="text-yellow-400">BANANA</span>
              <span className="text-white">ADS</span>
            </span>
          </div>
          <p className="text-white/30 text-xs">
            © 2025 BananaAds. Powered by Google Gemini & Veo.
          </p>
          <div className="flex gap-4 text-xs text-white/40">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
