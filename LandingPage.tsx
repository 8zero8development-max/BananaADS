import React, { useState, useEffect } from 'react';

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
      icon: '🔍',
      title: 'Brand DNA Analysis',
      description: 'AI automatically researches your brand using Google Search to determine the perfect target audience and tone.'
    },
    {
      icon: '🎨',
      title: 'AI Mood Boards',
      description: 'Generate professional aesthetic mood boards based on your product image and brand vibe.'
    },
    {
      icon: '💡',
      title: 'Creative Concepts',
      description: 'Get 3 unique cinematic directions tailored to your campaign goals - emotional, high-energy, or minimalist.'
    },
    {
      icon: '📸',
      title: 'Smart Product Placement',
      description: 'Your actual product appears in every generated storyboard scene, ensuring brand consistency.'
    },
    {
      icon: '🗣️',
      title: 'Neural Voiceovers',
      description: 'Professional AI voiceovers using multiple voice options for your advertisement scripts.'
    },
    {
      icon: '🎥',
      title: 'Cinematic Video',
      description: 'Transform static storyboards into HD video clips using cutting-edge AI video generation.'
    }
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '$29',
      period: '/month',
      description: 'Perfect for small brands and creators',
      features: ['5 Ad Campaigns/month', 'AI Storyboards', 'Script Generation', 'Mood Boards', 'Email Support'],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Professional',
      price: '$79',
      period: '/month',
      description: 'For growing businesses and agencies',
      features: ['Unlimited Campaigns', 'AI Storyboards', 'Script Generation', 'Neural Voiceovers', 'Priority Support', 'Export to All Formats'],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$199',
      period: '/month',
      description: 'For large teams and studios',
      features: ['Everything in Pro', 'Video Generation (Veo)', 'Custom Branding', 'API Access', 'Dedicated Account Manager', 'Custom Integrations'],
      cta: 'Contact Sales',
      popular: false
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
            onClick={onGetStarted}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-2 rounded-full font-bold text-sm hover:scale-105 transition"
          >
            Get Started
          </button>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-2 mb-8">
            <span className="text-yellow-400 text-sm font-medium">Powered by Google Gemini & Veo</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Create Broadcast-Quality
            </span>
            <br />
            <span className="text-yellow-400">Ads in Minutes</span>
          </h1>
          
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            From brief to cinematic render. Our AI cinematography agent generates storyboards, 
            scripts, voiceovers, and videos for your brand.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button 
              onClick={onGetStarted}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition shadow-lg shadow-yellow-500/25"
            >
              Start Creating Free
            </button>
            <a 
              href="#features"
              className="border border-white/20 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/5 transition"
            >
              See How It Works
            </a>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 blur-3xl rounded-3xl"></div>
            <div className="relative bg-black/50 backdrop-blur border border-yellow-500/20 rounded-2xl p-2 shadow-2xl">
              <img 
                src="/app-screenshot.png" 
                alt="Banana Ads Interface"
                className="rounded-xl w-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = `
                    <div class="aspect-video bg-gradient-to-br from-zinc-900 to-black rounded-xl flex items-center justify-center">
                      <div class="text-center">
                        <div class="text-6xl mb-4">🍌</div>
                        <p class="text-white/40 text-sm">App Preview</p>
                      </div>
                    </div>
                  `;
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-white/40 text-sm uppercase tracking-widest mb-8">Trusted by innovative brands</p>
          <div className="flex justify-center items-center gap-12 flex-wrap opacity-50">
            <span className="text-2xl font-bold text-white/60">TechCorp</span>
            <span className="text-2xl font-bold text-white/60">ModernBrand</span>
            <span className="text-2xl font-bold text-white/60">StartupCo</span>
            <span className="text-2xl font-bold text-white/60">CreativeStudio</span>
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
        </div>
      </section>

      <section className="py-24 px-8 bg-gradient-to-b from-transparent to-yellow-500/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-serif mb-6">
                <span className="text-yellow-400">3 Steps</span>
                <br />
                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  to Your Perfect Ad
                </span>
              </h2>
              
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold">1</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Brief Your Brand</h3>
                    <p className="text-white/50">Enter your brand details and let AI research your target audience automatically.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold">2</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Choose Your Concept</h3>
                    <p className="text-white/50">Select from 3 AI-generated creative directions tailored to your goals.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold">3</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Generate & Export</h3>
                    <p className="text-white/50">Get storyboards, scripts, voiceovers, and video - all with your actual product.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 blur-3xl rounded-full"></div>
              <div className="relative bg-black/50 backdrop-blur border border-yellow-500/20 rounded-2xl p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4">
                    <span className="text-3xl">🍌</span>
                    <div>
                      <div className="text-sm text-white/40">Brand Brief</div>
                      <div className="font-bold text-yellow-400">Complete</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4">
                    <span className="text-3xl">🎬</span>
                    <div>
                      <div className="text-sm text-white/40">Creative Concepts</div>
                      <div className="font-bold text-yellow-400">3 Options Ready</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4">
                    <span className="text-3xl">🎥</span>
                    <div>
                      <div className="text-sm text-white/40">Production</div>
                      <div className="font-bold text-green-400">Generating...</div>
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
            <h2 className="text-4xl md:text-5xl font-serif mb-4">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Simple, Transparent
              </span>
              <br />
              <span className="text-yellow-400">Pricing</span>
            </h2>
            <p className="text-white/50 text-lg">
              Start free, upgrade when you're ready.
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
          <div className="text-6xl mb-6">🍌</div>
          <h2 className="text-4xl md:text-5xl font-serif mb-6">
            <span className="text-yellow-400">Ready to Create</span>
            <br />
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Your Next Great Ad?
            </span>
          </h2>
          <p className="text-white/50 text-lg mb-10">
            Join thousands of brands using AI to create stunning advertisements.
          </p>
          <button 
            onClick={onGetStarted}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition shadow-lg shadow-yellow-500/25"
          >
            Start Creating for Free
          </button>
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
