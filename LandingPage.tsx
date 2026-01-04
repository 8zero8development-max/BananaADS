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
      title: 'Brand DNA Research',
      description: 'AI automatically researches your brand using Google Search to determine the perfect target audience and tone.'
    },
    {
      icon: '🖼️',
      title: 'Mood Board Generator',
      description: 'Generate professional aesthetic mood boards based on your product image and brand vibe.'
    },
    {
      icon: '✨',
      title: 'Creative Direction',
      description: 'Get 3 unique cinematic directions tailored to your campaign goals - emotional, high-energy, or minimalist.'
    },
    {
      icon: '🎯',
      title: 'Real Product Integration',
      description: 'Your actual product appears in every generated storyboard scene, ensuring brand consistency.'
    },
    {
      icon: '🎙️',
      title: 'AI Voiceover Studio',
      description: 'Professional AI voiceovers using multiple voice options for your advertisement scripts.'
    },
    {
      icon: '🎬',
      title: 'Video Generation',
      description: 'Transform static storyboards into HD video clips using cutting-edge AI video generation.'
    }
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '£11.99',
      period: '/month',
      description: 'Perfect for small brands and creators',
      features: ['5 Ad Campaigns/month', 'AI Storyboards', 'Script Generation', 'Mood Boards', 'Email Support'],
      cta: 'Sign Up Now',
      popular: false,
      originalPrice: null
    },
    {
      name: 'Lifetime',
      price: '£59.99',
      period: '/lifetime',
      description: 'Limited time deal',
      features: ['Everything in Pro', 'Video Generation (Veo)', 'Custom Branding', 'API Access', 'Dedicated Account Manager', 'Custom Integrations'],
      cta: 'Sign Up Now',
      popular: true,
      originalPrice: '£299'
    },
    {
      name: 'Professional',
      price: '£24.99',
      period: '/month',
      description: 'For growing businesses and agencies',
      features: ['Unlimited Campaigns', 'AI Storyboards', 'Script Generation', 'Neural Voiceovers', 'Priority Support', 'Export to All Formats'],
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

      <section className="pt-32 pb-20 px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-2 mb-8">
            <span className="text-yellow-400 text-sm font-medium">The #1 AI Ad Creation Tool for 2026</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-serif mb-4 leading-tight">
            <span style={{ color: '#FFD700' }}>
              Launch Scroll-Stopping Ads
            </span>
            <br />
            <span style={{ color: '#C0C0C0' }}>In Minutes, Not Weeks</span>
          </h1>
          
          <div className="w-64 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent mx-auto mb-6"></div>
          
          <div className="text-4xl md:text-6xl font-bold mb-6 tracking-wider flex items-center justify-center">
            <span className="text-white">RIPENYOUR</span>
            <span style={{ color: '#FFD700' }}>REVENUE</span>
            <span className="ml-2 text-4xl md:text-6xl">🍌</span>
          </div>

          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-6 leading-relaxed">
            The AI-first ad workflow that turns a simple brief into concepts, storyboards, scripts, voiceovers, and cinematic video.
          </p>

          <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm">
            <div className="flex items-center gap-2 text-white">
              <span className="text-green-500 text-lg font-bold">✓</span>
              <span>Your actual product in every scene</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <span className="text-green-500 text-lg font-bold">✓</span>
              <span>3 creative directions per brief</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <span className="text-green-500 text-lg font-bold">✓</span>
              <span>Export-ready in minutes</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 mb-16">
            <button
              onClick={() => {
                localStorage.removeItem('onboarding-completed');
                onGetStarted();
              }}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition shadow-lg shadow-yellow-500/25"
            >
              Start Creating Free
            </button>
            <p className="text-white/40 text-sm">No credit card required. Your API key stays in your browser.</p>
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

      <section className="py-12 px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-6 mb-8">
            <img 
              src={bananaDumbbells} 
              alt="Banana with dumbbells" 
              className="h-24 md:h-32 w-auto object-contain"
            />
            <h2 className="text-4xl md:text-5xl font-serif">
              <span className="text-yellow-400">Four Powerful</span>
              <br />
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Creative Workflows
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative">
            <div className="bg-white/[0.02] border-2 border-yellow-500 rounded-xl p-4 text-center md:-translate-y-4">
              <img src={iconCinematic} alt="Cinematic Video" className="w-20 h-20 mx-auto mb-2 rounded-lg object-cover" />
              <p className="text-white/70 text-sm font-medium">Cinematic Video</p>
            </div>
            <div className="bg-white/[0.02] border-2 border-yellow-500 rounded-xl p-4 text-center md:translate-y-4">
              <img src={iconSocialPosters} alt="Social Posters" className="w-20 h-20 mx-auto mb-2 rounded-lg object-cover" />
              <p className="text-white/70 text-sm font-medium">Social Posters</p>
            </div>
            <div className="bg-white/[0.02] border-2 border-yellow-500 rounded-xl p-4 text-center md:-translate-y-4">
              <img src={iconFoodSocial} alt="Food Socials" className="w-20 h-20 mx-auto mb-2 rounded-lg object-cover" />
              <p className="text-white/70 text-sm font-medium">Food Socials</p>
            </div>
            <div className="bg-white/[0.02] border-2 border-yellow-500 rounded-xl p-4 text-center md:translate-y-4">
              <img src={iconEmail} alt="Email Campaign" className="w-20 h-20 mx-auto mb-2 rounded-lg object-cover" />
              <p className="text-white/70 text-sm font-medium">Email Campaign</p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Showcase Section */}
      <section className="py-24 px-8 border-t border-white/5 bg-gradient-to-b from-transparent via-yellow-500/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-white/40 text-sm uppercase tracking-widest mb-4">See The Complete Workflow</p>
            <h2 className="text-4xl md:text-5xl font-serif mb-4">
              <span className="text-yellow-400">Built for the</span>
              <br />
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                AI-First Creative Workflow
              </span>
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              From brand research to final export, see how BananaADS transforms your ideas into stunning campaigns
            </p>
          </div>

          {/* Brand DNA Research Workflow */}
          <div className="mb-20">
            <div className="flex flex-col items-center text-center gap-3 mb-10">
              <div className="w-20 h-20 flex items-center justify-center text-5xl drop-shadow-lg">
                🍌
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">Brand DNA Research</h3>
                <p className="text-white/50 text-lg">AI analyzes your brand to create the perfect campaign foundation</p>
              </div>
            </div>
            {/* Carousel */}
            <div className="relative">
              <div className="overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${brandDnaIndex * 100}%)` }}
                >
                  {[
                    { img: screenshotApiKey, label: 'Secure API Setup' },
                    { img: screenshotSearchingWeb, label: 'AI Web Research' },
                    { img: screenshotBrandDNA, label: 'Brand DNA Profile' },
                    { img: screenshotBrandDNA2, label: 'Extended Profile' },
                    { img: screenshotMoodBoard, label: 'AI Mood Board' }
                  ].map((item, idx) => (
                    <div key={idx} className="w-full flex-shrink-0 px-2">
                      <div className="bg-black/50 backdrop-blur border border-yellow-500/30 rounded-2xl p-4 shadow-2xl max-w-4xl mx-auto">
                        <img src={item.img} alt={item.label} className="rounded-xl w-full" />
                        <p className="text-center text-lg text-white/70 mt-4 font-medium">{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Navigation Arrows */}
              <button 
                onClick={() => setBrandDnaIndex(prev => Math.max(0, prev - 1))}
                className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 rounded-full bg-black/80 border border-yellow-500/30 flex items-center justify-center text-yellow-400 hover:bg-yellow-500/20 transition-all ${brandDnaIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                disabled={brandDnaIndex === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button 
                onClick={() => setBrandDnaIndex(prev => Math.min(4, prev + 1))}
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 rounded-full bg-black/80 border border-yellow-500/30 flex items-center justify-center text-yellow-400 hover:bg-yellow-500/20 transition-all ${brandDnaIndex === 4 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                disabled={brandDnaIndex === 4}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              {/* Dots Indicator */}
              <div className="flex justify-center gap-2 mt-6">
                {[0, 1, 2, 3, 4].map(idx => (
                  <button
                    key={idx}
                    onClick={() => setBrandDnaIndex(idx)}
                    className={`w-3 h-3 rounded-full transition-all ${brandDnaIndex === idx ? 'bg-yellow-400 w-8' : 'bg-white/20 hover:bg-white/40'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Cinematic Video Workflow */}
          <div className="mb-20">
            <div className="flex flex-col items-center text-center gap-3 mb-10">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg shadow-orange-500/30">
                <img src={iconCinematic} alt="Cinematic Video" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">Cinematic Video Ads</h3>
                <p className="text-white/50 text-lg">Create broadcast-quality video storyboards with AI</p>
              </div>
            </div>
            {/* Carousel */}
            <div className="relative">
              <div className="overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${cinematicIndex * 100}%)` }}
                >
                  {[
                    { img: screenshotCinematicConcepts, label: '3 Creative Concepts' },
                    { img: screenshotAnalyseConcept, label: 'AI Director at Work' },
                    { img: screenshotCinematicGen, label: 'Generating Scenes' },
                    { img: screenshotCinematic1, label: 'Scene 1' },
                    { img: screenshotCinematic2, label: 'Scene 2' },
                    { img: screenshotCinematic3, label: 'Scene 3' }
                  ].map((item, idx) => (
                    <div key={idx} className="w-full flex-shrink-0 px-2">
                      <div className="bg-black/50 backdrop-blur border border-orange-500/30 rounded-2xl p-4 shadow-2xl max-w-4xl mx-auto">
                        <img src={item.img} alt={item.label} className="rounded-xl w-full" />
                        <p className="text-center text-lg text-white/70 mt-4 font-medium">{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Navigation Arrows */}
              <button 
                onClick={() => setCinematicIndex(prev => Math.max(0, prev - 1))}
                className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 rounded-full bg-black/80 border border-orange-500/30 flex items-center justify-center text-orange-400 hover:bg-orange-500/20 transition-all ${cinematicIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                disabled={cinematicIndex === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button 
                onClick={() => setCinematicIndex(prev => Math.min(5, prev + 1))}
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 rounded-full bg-black/80 border border-orange-500/30 flex items-center justify-center text-orange-400 hover:bg-orange-500/20 transition-all ${cinematicIndex === 5 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                disabled={cinematicIndex === 5}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              {/* Dots Indicator */}
              <div className="flex justify-center gap-2 mt-6">
                {[0, 1, 2, 3, 4, 5].map(idx => (
                  <button
                    key={idx}
                    onClick={() => setCinematicIndex(idx)}
                    className={`w-3 h-3 rounded-full transition-all ${cinematicIndex === idx ? 'bg-orange-400 w-8' : 'bg-white/20 hover:bg-white/40'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Food Social Workflow */}
          <div className="mb-20">
            <div className="flex flex-col items-center text-center gap-3 mb-10">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg shadow-red-500/30">
                <img src={iconFoodSocial} alt="Food Social" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">Food Social Posts</h3>
                <p className="text-white/50 text-lg">Mouth-watering food photography for social media</p>
              </div>
            </div>
            {/* Carousel */}
            <div className="relative">
              <div className="overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${foodSocialIndex * 100}%)` }}
                >
                  {[
                    { img: screenshotFoodSocialGen, label: 'AI Food Photographer' },
                    { img: screenshotFoodSocial1, label: 'Social Post Ready' },
                    { img: screenshotFoodSocial2, label: 'Multiple Variations' }
                  ].map((item, idx) => (
                    <div key={idx} className="w-full flex-shrink-0 px-2">
                      <div className="bg-black/50 backdrop-blur border border-red-500/30 rounded-2xl p-4 shadow-2xl max-w-4xl mx-auto">
                        <img src={item.img} alt={item.label} className="rounded-xl w-full" />
                        <p className="text-center text-lg text-white/70 mt-4 font-medium">{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Navigation Arrows */}
              <button 
                onClick={() => setFoodSocialIndex(prev => Math.max(0, prev - 1))}
                className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 rounded-full bg-black/80 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all ${foodSocialIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                disabled={foodSocialIndex === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button 
                onClick={() => setFoodSocialIndex(prev => Math.min(2, prev + 1))}
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 rounded-full bg-black/80 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all ${foodSocialIndex === 2 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                disabled={foodSocialIndex === 2}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              {/* Dots Indicator */}
              <div className="flex justify-center gap-2 mt-6">
                {[0, 1, 2].map(idx => (
                  <button
                    key={idx}
                    onClick={() => setFoodSocialIndex(idx)}
                    className={`w-3 h-3 rounded-full transition-all ${foodSocialIndex === idx ? 'bg-red-400 w-8' : 'bg-white/20 hover:bg-white/40'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Social Posters (Facebook) Workflow */}
          <div className="mb-20">
            <div className="flex flex-col items-center text-center gap-3 mb-10">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/30">
                <img src={iconSocialPosters} alt="Social Posters" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">Social Posters</h3>
                <p className="text-white/50 text-lg">Eye-catching Facebook posts designed to engage your audience</p>
              </div>
            </div>
            {/* Carousel */}
            <div className="relative">
              <div className="overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${socialPostersIndex * 100}%)` }}
                >
                  {[
                    { img: screenshotFacebookConcepts, label: 'Facebook Concepts' },
                    { img: screenshotFacebookOne, label: 'Post Design 1' },
                    { img: screenshotFacebookToo, label: 'Post Design 2' },
                    { img: screenshotFacebook3, label: 'Post Design 3' }
                  ].map((item, idx) => (
                    <div key={idx} className="w-full flex-shrink-0 px-2">
                      <div className="bg-black/50 backdrop-blur border border-blue-500/30 rounded-2xl p-4 shadow-2xl max-w-4xl mx-auto">
                        <img src={item.img} alt={item.label} className="rounded-xl w-full" />
                        <p className="text-center text-lg text-white/70 mt-4 font-medium">{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Navigation Arrows */}
              <button 
                onClick={() => setSocialPostersIndex(prev => Math.max(0, prev - 1))}
                className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 rounded-full bg-black/80 border border-blue-500/30 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 transition-all ${socialPostersIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                disabled={socialPostersIndex === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button 
                onClick={() => setSocialPostersIndex(prev => Math.min(3, prev + 1))}
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 rounded-full bg-black/80 border border-blue-500/30 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 transition-all ${socialPostersIndex === 3 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                disabled={socialPostersIndex === 3}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              {/* Dots Indicator */}
              <div className="flex justify-center gap-2 mt-6">
                {[0, 1, 2, 3].map(idx => (
                  <button
                    key={idx}
                    onClick={() => setSocialPostersIndex(idx)}
                    className={`w-3 h-3 rounded-full transition-all ${socialPostersIndex === idx ? 'bg-blue-400 w-8' : 'bg-white/20 hover:bg-white/40'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Email Campaign Workflow */}
          <div>
            <div className="flex flex-col items-center text-center gap-3 mb-10">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg shadow-purple-500/30">
                <img src={iconEmail} alt="Email Campaigns" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">Email Campaigns</h3>
                <p className="text-white/50 text-lg">Complete email templates with AI-generated visuals and copy</p>
              </div>
            </div>
            {/* Carousel */}
            <div className="relative">
              <div className="overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${emailIndex * 100}%)` }}
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
                    <div key={idx} className="w-full flex-shrink-0 px-2">
                      <div className="bg-black/50 backdrop-blur border border-purple-500/30 rounded-2xl p-4 shadow-2xl max-w-4xl mx-auto">
                        <img src={item.img} alt={item.label} className="rounded-xl w-full" />
                        <p className="text-center text-lg text-white/70 mt-4 font-medium">{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Navigation Arrows */}
              <button 
                onClick={() => setEmailIndex(prev => Math.max(0, prev - 1))}
                className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 rounded-full bg-black/80 border border-purple-500/30 flex items-center justify-center text-purple-400 hover:bg-purple-500/20 transition-all ${emailIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                disabled={emailIndex === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button 
                onClick={() => setEmailIndex(prev => Math.min(10, prev + 1))}
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 rounded-full bg-black/80 border border-purple-500/30 flex items-center justify-center text-purple-400 hover:bg-purple-500/20 transition-all ${emailIndex === 10 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                disabled={emailIndex === 10}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              {/* Dots Indicator */}
              <div className="flex justify-center gap-2 mt-6">
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

      <section className="py-24 px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif mb-4">
              <span className="text-yellow-400">Scroll-Stop</span>
              <br />
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Ads That Convert
              </span>
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              See what our AI cinematography agent can create for your brand
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      <section className="py-24 px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif mb-4">
              <span className="text-white">Impress Your Clients with</span>
              <br />
              <span className="text-yellow-400">Professional Mood Boards</span>
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              AI-generated mood boards that capture your brand essence and wow stakeholders
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <section id="features" className="py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif mb-4">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Everything You Need to Create
              </span>
              <br />
              <span className="text-yellow-400">Award-Winning Ads</span>
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Our AI agents handle every step of the creative process, from research to final render.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group bg-white/[0.02] hover:bg-white/[0.05] border border-yellow-500/10 hover:border-yellow-500/30 rounded-2xl p-8 transition-all duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-yellow-400 transition">
                  {feature.title}
                </h3>
                <p className="text-white/50 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition shadow-lg shadow-yellow-500/25"
            >
              Start Creating Free
            </button>
            <p className="text-white/40 text-sm mt-3">No credit card required</p>
          </div>
        </div>
      </section>

      <section className="py-24 px-8 bg-gradient-to-b from-transparent via-yellow-500/5 to-transparent relative overflow-hidden">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-yellow-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-orange-500/10 blur-[120px] rounded-full"></div>

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <p className="text-white/40 text-sm uppercase tracking-widest mb-4">How It Works</p>
            <h2 className="text-4xl md:text-5xl font-serif mb-4">
              <span className="text-yellow-400">3 Simple Steps</span>
              <br />
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                to Your Perfect Ad
              </span>
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              From brand brief to broadcast-ready campaign in minutes, not weeks
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="relative">
              <div className="absolute left-[23px] top-[60px] bottom-[60px] w-[2px] bg-gradient-to-b from-yellow-400 via-yellow-500 to-orange-500 hidden md:block"></div>

              <div className="space-y-6">
                <div className="group relative bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 hover:border-yellow-500/40 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-yellow-500/10">
                  <div className="flex gap-5">
                    <div className="flex-shrink-0 relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-black font-bold text-lg shadow-lg shadow-yellow-500/30">
                        01
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white group-hover:text-yellow-400 transition">Brief Your Brand</h3>
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">~60 sec</span>
                      </div>
                      <p className="text-white/50 leading-relaxed">Enter your brand details and let AI research your target audience, tone, and key selling points automatically using Google Search.</p>
                    </div>
                  </div>
                </div>

                <div className="group relative bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 hover:border-yellow-500/40 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-yellow-500/10">
                  <div className="flex gap-5">
                    <div className="flex-shrink-0 relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-400 flex items-center justify-center text-black font-bold text-lg shadow-lg shadow-orange-500/30">
                        02
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white group-hover:text-yellow-400 transition">Choose Your Concept</h3>
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">3 Options</span>
                      </div>
                      <p className="text-white/50 leading-relaxed">Select from 3 AI-generated creative directions - emotional, high-energy, or minimalist - each with a unique thumbnail preview.</p>
                    </div>
                  </div>
                </div>

                <div className="group relative bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 hover:border-orange-500/40 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/10">
                  <div className="flex gap-5">
                    <div className="flex-shrink-0 relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-black font-bold text-lg shadow-lg shadow-orange-500/30">
                        03
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition">Generate & Export</h3>
                        <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">Export-Ready</span>
                      </div>
                      <p className="text-white/50 leading-relaxed">Get storyboards, scripts, voiceovers, and cinematic video - all featuring your actual product, ready to download.</p>
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

      <section id="pricing" className="py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-2 mb-6">
              <span className="text-orange-400 text-sm font-medium">Launch Pricing - Limited Time</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif mb-4">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Simple, Transparent
              </span>
              <br />
              <span className="text-yellow-400">Pricing</span>
            </h2>
            <p className="text-white/50 text-lg">
              Start free, upgrade when you're ready. Lock in launch pricing today.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pricingPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`relative rounded-2xl p-8 transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-b from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/50 scale-105'
                    : 'bg-white/[0.02] border border-white/10 hover:border-yellow-500/30'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}

                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-white/40 text-sm mb-6">{plan.description}</p>

                <div className="mb-6">
                  {plan.originalPrice && (
                    <div className="text-sm text-white/40 line-through mb-1">Reduced from {plan.originalPrice}</div>
                  )}
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-white/40">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center gap-2 text-sm text-white/70">
                      <span className="text-yellow-400">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={onGetStarted}
                  className={`w-full py-3 rounded-full font-bold transition ${
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

      <section className="py-24 px-8 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-2 mb-8">
            <span className="text-yellow-400 text-sm font-medium">The Must-Have SaaS Tool for 2026</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-serif mb-6">
            <span className="text-yellow-400">Stop Waiting Weeks</span>
            <br />
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              For Your Next Ad Campaign
            </span>
          </h2>
          <p className="text-white/50 text-lg mb-6 max-w-2xl mx-auto">
            Join creators, agencies, and brands who are already using AI to launch scroll-stopping ads in minutes instead of weeks.
          </p>
          <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm text-white/60">
            <span>Gemini + Veo Inside</span>
            <span>&#8226;</span>
            <span>Multi-format Creative</span>
            <span>&#8226;</span>
            <span>Brief to Export</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition shadow-lg shadow-yellow-500/25"
            >
              Start Creating Free
            </button>
            <p className="text-white/40 text-sm">No credit card required. Your API key stays in your browser.</p>
          </div>
        </div>
      </section>

      <footer className="py-12 px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🍌</span>
            <span className="font-bold tracking-tight">
              <span className="text-yellow-400">BANANA</span>
              <span className="text-white">ADS</span>
            </span>
          </div>
          <p className="text-white/30 text-sm">
            © 2025 BananaAds. Powered by Google Gemini & Veo.
          </p>
          <div className="flex gap-6 text-sm text-white/40">
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
