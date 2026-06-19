import {
  FileText, Shield, Users, Zap, ClipboardCheck,
  BarChart3, ArrowRight, Check, Menu, X, ChevronRight
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white'}`}>
      <div className="max-w-page mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-ink rounded-[8px] flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-[20px] text-ink">
            WeldDoc
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-[15px] font-medium text-dim hover:text-ink transition-colors">Features</a>
          <a href="#how-it-works" className="text-[15px] font-medium text-dim hover:text-ink transition-colors">How It Works</a>
          <a href="#pricing" className="text-[15px] font-medium text-dim hover:text-ink transition-colors">Pricing</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <a href="#" className="text-[15px] font-medium text-dim hover:text-ink transition-colors px-4 py-2">
            Log in
          </a>
          <a href="#" className="text-[15px] font-semibold text-white bg-ink px-5 py-2.5 rounded-buttons hover:bg-ink/80 transition-colors">
            Sign up free
          </a>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-border px-6 py-5 flex flex-col gap-4">
          <a href="#features" className="text-[15px] font-medium text-dim">Features</a>
          <a href="#how-it-works" className="text-[15px] font-medium text-dim">How It Works</a>
          <a href="#pricing" className="text-[15px] font-medium text-dim">Pricing</a>
          <div className="flex gap-3 pt-3 border-t border-border">
            <a href="#" className="text-[15px] font-medium text-dim">Log in</a>
            <a href="#" className="text-[15px] font-semibold text-white bg-ink px-5 py-2.5 rounded-buttons">Sign up free</a>
          </div>
        </div>
      )}
    </nav>
  );
}

function Hero() {
  return (
    <section className="pt-32 pb-16 px-6">
      <div className="max-w-page mx-auto text-center">
        <div className="inline-flex items-center px-4 py-1.5 bg-surface border border-border rounded-tags text-[13px] font-semibold text-dim mb-6">
          Trusted by 500+ fabrication shops
        </div>

        <h1 className="font-display font-bold text-[44px] md:text-[56px] leading-[1.08] text-ink max-w-[820px] mx-auto mb-6">
          The intelligent platform for welding procedure management
        </h1>

        <p className="text-[18px] leading-[1.6] text-dim max-w-[600px] mx-auto mb-10">
          Digitize WPS, PQR, and welder qualifications. Ensure compliance, eliminate paper trails, and keep every weld traceable.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#"
            className="text-[16px] font-semibold text-white bg-ink px-7 py-3.5 rounded-buttons hover:bg-ink/80 transition-colors flex items-center gap-2"
          >
            Start free trial
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#"
            className="text-[16px] font-semibold text-ink border border-border bg-white px-7 py-3.5 rounded-buttons hover:bg-surface transition-colors"
          >
            Book a demo
          </a>
        </div>
      </div>

      <div className="max-w-page mx-auto mt-16">
        <img
          src="https://images.pexels.com/photos/2381463/pexels-photo-2381463.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&dpr=1"
          alt="Welding workshop"
          className="w-full h-[300px] md:h-[460px] object-cover rounded-cards shadow-card"
        />
      </div>
    </section>
  );
}

function TrustStrip() {
  const companies = ['ArcelorMittal', 'Bechtel', 'Fluor Corp', 'Kiewit', 'Turner Industries'];

  return (
    <section className="py-14 px-6 border-y border-border">
      <div className="max-w-page mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {companies.map((name) => (
            <span key={name} className="text-[17px] font-semibold text-muted tracking-wide">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const features = [
    {
      icon: FileText,
      title: 'WPS & PQR Management',
      description: 'Create, version, and approve Welding Procedure Specifications and Procedure Qualification Records in one place.',
      image: 'https://images.pexels.com/photos/2381463/pexels-photo-2381463.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&dpr=1',
    },
    {
      icon: Users,
      title: 'Welder Qualifications',
      description: 'Track certifications, test results, and renewal dates. Get alerts before qualifications expire.',
      image: 'https://images.pexels.com/photos/3862132/pexels-photo-3862132.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&dpr=1',
    },
    {
      icon: Shield,
      title: 'Code Compliance',
      description: 'Built-in validation against AWS D1.1, ASME IX, and other major welding codes. Stay audit-ready.',
      image: 'https://images.pexels.com/photos/5691658/pexels-photo-5691658.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&dpr=1',
    },
    {
      icon: ClipboardCheck,
      title: 'Digital Weld Logs',
      description: 'Replace paper travellers with digital logs. Record joint details, NDE results, and inspector sign-offs.',
      image: 'https://images.pexels.com/photos/4491881/pexels-photo-4491881.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&dpr=1',
    },
    {
      icon: Zap,
      title: 'Instant Traceability',
      description: 'Link every weld to its WPS, PQR, welder, and heat number. Full chain of custody from start to closeout.',
      image: 'https://images.pexels.com/photos/3862377/pexels-photo-3862377.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&dpr=1',
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reporting',
      description: 'Dashboards for reject rates, productivity, and qualification status. Export audit packages in one click.',
      image: 'https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&dpr=1',
    },
  ];

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener('scroll', updateScrollState);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector('div')?.offsetWidth || 340;
    el.scrollBy({ left: direction === 'left' ? -cardWidth - 24 : cardWidth + 24, behavior: 'smooth' });
  };

  return (
    <section id="features" className="py-20">
      <div className="max-w-page mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="font-display font-bold text-[36px] md:text-[44px] leading-[1.15] text-ink">
              Everything your weld program needs
            </h2>
            <p className="text-[18px] text-dim mt-4 max-w-[540px]">
              Six core capabilities designed for fabrication shops that take quality seriously.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="w-11 h-11 rounded-full border border-border flex items-center justify-center hover:bg-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowRight className="w-5 h-5 text-ink rotate-180" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="w-11 h-11 rounded-full border border-border flex items-center justify-center hover:bg-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowRight className="w-5 h-5 text-ink" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-6 md:px-[max(1.5rem,calc((100vw-1200px)/2+1.5rem))]"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {features.map(({ icon: Icon, title, description, image }) => (
          <div
            key={title}
            className="relative flex-shrink-0 w-[300px] md:w-[360px] h-[440px] md:h-[520px] rounded-[20px] overflow-hidden snap-start group cursor-pointer"
          >
            <img
              src={image}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent" />
            <div className="relative z-10 p-6 md:p-8 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-[8px] bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="text-[22px] md:text-[26px] font-bold text-white leading-tight mb-3">
                {title}
              </h3>
              <p className="text-[15px] leading-[1.6] text-white/70 max-w-[280px]">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const steps = [
    {
      number: '01',
      title: 'Import or create procedures',
      description: 'Upload existing WPS/PQR documents or build new ones with guided templates that enforce code requirements automatically.',
      image: 'https://images.pexels.com/photos/4491461/pexels-photo-4491461.jpeg?auto=compress&cs=tinysrgb&w=700&h=500&dpr=1',
    },
    {
      number: '02',
      title: 'Assign & qualify welders',
      description: 'Map welders to the procedures they\'re qualified for. The system tracks continuity and alerts on upcoming expirations.',
      image: 'https://images.pexels.com/photos/3862130/pexels-photo-3862130.jpeg?auto=compress&cs=tinysrgb&w=700&h=500&dpr=1',
    },
    {
      number: '03',
      title: 'Record & trace every weld',
      description: 'Log production welds with complete traceability — materials, parameters, NDE results, all linked automatically.',
      image: 'https://images.pexels.com/photos/5691660/pexels-photo-5691660.jpeg?auto=compress&cs=tinysrgb&w=700&h=500&dpr=1',
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const viewportCenter = window.innerHeight / 2;
      let closestIndex = 0;
      let closestDistance = Infinity;

      stepRefs.current.forEach((ref, i) => {
        if (!ref) return;
        const rect = ref.getBoundingClientRect();
        const elementCenter = rect.top + rect.height / 2;
        const distance = Math.abs(elementCenter - viewportCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      });

      setActiveStep(closestIndex);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section id="how-it-works" className="py-20 px-6">
      <div className="max-w-page mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-[36px] md:text-[44px] leading-[1.15] text-ink">
            From paper to production in three steps
          </h2>
        </div>

        <div ref={sectionRef} className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          <div className="md:col-span-4 md:sticky md:top-32 md:self-start">
            <div className="flex flex-col gap-2">
              {steps.map(({ number, title }, i) => (
                <button
                  key={number}
                  onClick={() => {
                    stepRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className={`text-left px-5 py-4 rounded-cards transition-all duration-300 ${
                    activeStep === i
                      ? 'bg-white shadow-card border border-border'
                      : 'hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[13px] font-bold transition-colors duration-300 ${activeStep === i ? 'text-ink' : 'text-muted'}`}>
                      {number}
                    </span>
                    <span className={`text-[15px] font-semibold transition-colors duration-300 ${activeStep === i ? 'text-ink' : 'text-dim'}`}>
                      {title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-8 flex flex-col gap-16">
            {steps.map(({ number, title, description, image }, i) => (
              <div
                key={number}
                ref={(el) => { stepRefs.current[i] = el; }}
                className={`transition-opacity duration-500 ${
                  activeStep === i ? 'opacity-100' : 'md:opacity-40'
                }`}
              >
                <div className="bg-ink rounded-feature p-6 md:p-8">
                  <div className="bg-white rounded-cards p-6 mb-5">
                    <h3 className="text-[20px] font-semibold text-ink mb-2">
                      {title}
                    </h3>
                    <p className="text-[16px] leading-[1.5] text-dim mb-4">
                      {description}
                    </p>
                    <button className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink border border-border px-4 py-2 rounded-buttons hover:bg-surface transition-colors">
                      Learn more
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <img
                    src={image}
                    alt={title}
                    className="w-full h-[220px] md:h-[280px] object-cover rounded-cards"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HighlightCard() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-page mx-auto">
        <div className="bg-ink rounded-feature p-10 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] opacity-10 blur-sm">
            <img
              src="https://images.pexels.com/photos/2381463/pexels-photo-2381463.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1"
              alt=""
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          <div className="relative z-10 max-w-[560px]">
            <h2 className="font-display font-bold text-[32px] md:text-[44px] leading-[1.15] text-white mb-5">
              Ready for your next audit?
            </h2>
            <p className="text-[17px] leading-[1.6] text-white/60 mb-8">
              Generate complete documentation packages — WPS, PQR, welder certs, and weld maps — in minutes, not days.
            </p>
            <a
              href="#"
              className="inline-flex items-center text-[16px] font-semibold text-ink bg-white px-7 py-3.5 rounded-buttons hover:bg-white/90 transition-colors gap-2"
            >
              Get started free
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: 'Starter',
      price: '$49',
      period: '/month',
      description: 'For small shops getting started with digital weld docs.',
      features: ['Up to 50 WPS/PQR', '10 welder profiles', 'Basic weld logging', 'Email support'],
      highlighted: false,
    },
    {
      name: 'Professional',
      price: '$149',
      period: '/month',
      description: 'For growing fabrication operations that need full traceability.',
      features: ['Unlimited WPS/PQR', 'Unlimited welders', 'Full traceability', 'Code compliance checks', 'Audit report generation', 'Priority support'],
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For multi-site operations with custom integration needs.',
      features: ['Everything in Professional', 'Multi-site management', 'SSO & advanced security', 'API access', 'Custom integrations', 'Dedicated account manager'],
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 px-6">
      <div className="max-w-page mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-[36px] md:text-[44px] leading-[1.15] text-ink">
            Simple, transparent pricing
          </h2>
          <p className="text-[18px] text-dim mt-4">
            No hidden fees. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(({ name, price, period, description, features, highlighted }) => (
            <div
              key={name}
              className={`rounded-feature p-8 transition-all duration-300 hover:shadow-elevated ${
                highlighted
                  ? 'bg-white border-2 border-ink shadow-elevated relative'
                  : 'bg-white border border-border'
              }`}
            >
              {highlighted && (
                <div className="inline-flex items-center px-3 py-1 bg-ink rounded-tags text-[12px] font-bold text-white mb-4">
                  Most Popular
                </div>
              )}
              <h3 className="text-[13px] font-semibold text-dim uppercase tracking-wider mb-2">
                {name}
              </h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="font-display text-[40px] font-bold text-ink">
                  {price}
                </span>
                {period && (
                  <span className="text-[16px] text-dim">{period}</span>
                )}
              </div>
              <p className="text-[15px] leading-[1.5] text-dim mb-6">
                {description}
              </p>
              <a
                href="#"
                className={`block text-center text-[16px] font-semibold px-5 py-3 rounded-buttons transition-colors mb-8 ${
                  highlighted
                    ? 'bg-ink text-white hover:bg-ink/80'
                    : 'bg-surface text-ink border border-border hover:bg-border/50'
                }`}
              >
                {price === 'Custom' ? 'Contact sales' : 'Start free trial'}
              </a>
              <ul className="space-y-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-ink mt-0.5 flex-shrink-0" />
                    <span className="text-[15px] text-dim">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-ink relative overflow-hidden">
      <div className="max-w-page mx-auto px-6 pt-16 pb-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 mb-20">
          <div>
            <h2 className="font-display font-bold text-[32px] md:text-[42px] leading-[1.1] uppercase text-white">
              WELDDOC
            </h2>
            <p className="font-display font-bold text-[32px] md:text-[42px] leading-[1.1] uppercase text-white/40">
              YOUR WELDS
            </p>
          </div>

          <div className="flex items-center gap-8 md:gap-10">
            <a href="#features" className="text-[15px] font-medium text-white/70 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-[15px] font-medium text-white/70 hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="text-[15px] font-medium text-white/70 hover:text-white transition-colors">Pricing</a>
            <a href="#" className="text-[15px] font-medium text-white/70 hover:text-white transition-colors">About Us</a>
          </div>

          <div className="flex items-center gap-3">
            <a href="#" className="w-9 h-9 border border-white/20 rounded-[8px] flex items-center justify-center hover:border-white hover:text-white text-white/60 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="#" className="w-9 h-9 border border-white/20 rounded-[8px] flex items-center justify-center hover:border-white hover:text-white text-white/60 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </div>
        </div>

        <div className="mt-8 mb-12">
          <span className="font-display font-bold text-[100px] md:text-[180px] lg:text-[240px] text-white/[0.03] uppercase leading-[0.85] block">
            WeldDoc
          </span>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center">
          <a href="#" className="text-[14px] text-white/40 hover:text-white transition-colors">Privacy Policy</a>
          <p className="text-[14px] text-white/40">
            &copy; 2026 WeldDoc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <TrustStrip />
      <Features />
      <HowItWorks />
      <HighlightCard />
      <Pricing />
      <Footer />
    </div>
  );
}

export default App;
