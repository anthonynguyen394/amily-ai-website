import { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Phone,
  Star,
  Wrench,
  ArrowRight,
  Check,
  Menu,
  X,
  ChevronRight,
  Clock,
  Shield,
  Zap,
  MessageSquare,
  Search,
  TrendingUp,
  Plus,
  Sparkles,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);


/* ═══════════════════════════════════════════════════════════════
   A. NAVBAR -- "The Floating Island"
   ═══════════════════════════════════════════════════════════════ */

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Services', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <nav
      ref={navRef}
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out
        ${scrolled
          ? 'bg-cream/80 backdrop-blur-xl border border-cream-dark shadow-lg'
          : 'bg-white/40 backdrop-blur-sm border border-white/50'
        }
        rounded-full px-4 sm:px-6 py-3 flex items-center justify-between gap-4 sm:gap-8
        w-[calc(100%-2rem)] max-w-4xl`}
    >
      {/* Logo */}
      <a href="#" className="flex items-center gap-2 shrink-0">
        <img
          src="/assets/logo-full-transparent.png"
          alt="Amily AI"
          className="w-8 h-8 rounded-lg"
        />
        <span
          className={`font-heading font-bold text-lg tracking-tight transition-colors duration-500
            ${scrolled ? 'text-navy' : 'text-navy'}`}
        >
          amily<span className="text-terracotta">.ai</span>
        </span>
      </a>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center gap-6">
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className={`text-sm font-semibold lift-hover transition-colors duration-500
              ${scrolled ? 'text-charcoal hover:text-terracotta' : 'text-navy/80 hover:text-navy'}`}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* CTA */}
      <a
        href="#pricing"
        className="hidden md:inline-flex btn-magnetic bg-terracotta text-white px-5 py-2 rounded-full text-sm font-bold items-center gap-2"
      >
        <span className="btn-bg bg-navy"></span>
        <span className="btn-label flex items-center gap-2">
          Book a Free Call <ArrowRight size={14} />
        </span>
      </a>

      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className={`md:hidden transition-colors duration-500 ${scrolled ? 'text-navy' : 'text-navy'}`}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-cream/95 backdrop-blur-xl border border-cream-dark rounded-3xl p-6 md:hidden shadow-xl">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-charcoal font-semibold text-lg hover:text-terracotta transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#pricing"
              onClick={() => setMobileOpen(false)}
              className="btn-magnetic bg-terracotta text-white px-5 py-3 rounded-full text-sm font-bold text-center"
            >
              <span className="btn-bg bg-navy"></span>
              <span className="btn-label">Book a Free Discovery Call</span>
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}


/* ═══════════════════════════════════════════════════════════════
   B. HERO SECTION -- split layout: copy on the left, big Amily on
   the right with 4 orbiting bubble badges + decorative micro-shapes.
   ═══════════════════════════════════════════════════════════════ */

function Hero() {
  const heroRef = useRef(null);
  const videoRef = useRef(null);
  const [activeBeat, setActiveBeat] = useState('');
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || reducedMotion) return;
    const onTime = () => {
      const t = v.currentTime;
      // v7 (10s) pose order: wave (0-1.2) -> laptop (2.6-4.0)
      //   -> thumbs-up (4.3-6.3) -> phone (6.9-7.9) -> xfade-to-wave (8-9)
      //   -> palindrome wave loop-back (9-10). No bubble on the closing wave by design.
      const beat =
        t >= 0.2 && t < 1.2 ? 'saved' :
        t >= 2.6 && t < 4.0 ? 'laptop' :
        t >= 4.3 && t < 6.3 ? 'stars' :
        t >= 6.9 && t < 7.9 ? 'phone' : '';
      setActiveBeat((prev) => (prev === beat ? prev : beat));
    };
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('seeked', onTime);
    v.addEventListener('play', onTime);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('seeked', onTime);
      v.removeEventListener('play', onTime);
    };
  }, [reducedMotion]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from('.hero-deco-blob', { opacity: 0, scale: 0.7, duration: 1.0 })
        .from('.hero-character-wrap', { x: 60, opacity: 0, scale: 0.92, duration: 0.9 }, '-=0.7')
        .from('.hero-heading', { y: 40, opacity: 0, duration: 0.8 }, '-=0.5')
        .from('.hero-desc', { y: 30, opacity: 0, duration: 0.7 }, '-=0.4')
        .from('.hero-cta', { y: 30, opacity: 0, duration: 0.7 }, '-=0.3')
        .from('.hero-trust', { y: 20, opacity: 0, duration: 0.6 }, '-=0.3')
        .from('.hero-float-badge', { opacity: 0, scale: 0.8, duration: 0.6, stagger: 0.15 }, '-=0.4')
        .from('.hero-deco', { opacity: 0, scale: 0.5, duration: 0.5, stagger: 0.08 }, '-=0.5');
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 1200px 800px at 20% 10%, rgba(232, 176, 78, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse 1000px 700px at 85% 30%, rgba(201, 123, 93, 0.18) 0%, transparent 50%),
          radial-gradient(ellipse 800px 600px at 50% 80%, rgba(30, 58, 95, 0.08) 0%, transparent 50%),
          linear-gradient(180deg, #faf5eb 0%, #f6eedc 100%)
        `,
      }}
    >
      {/* Soft pastel anchor blob (top-left) -- matches reference layout */}
      <div
        aria-hidden
        className="hero-deco-blob absolute -top-16 -left-16 w-72 h-72 rounded-full bg-gradient-to-br from-terracotta/20 to-mustard/10 blur-2xl pointer-events-none"
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-24 pb-24 md:pt-28 md:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-[42fr_58fr] gap-10 lg:gap-16 items-center">

          {/* ── LEFT: copy + CTAs + trust ── */}
          <div className="text-center lg:text-left order-2 lg:order-1">

            <h1 className="hero-heading font-drama font-extrabold text-5xl md:text-6xl xl:text-7xl tracking-tight leading-[1.02] text-charcoal">
              Stop losing jobs to<br />
              <span className="relative inline-block">
                <span className="relative z-10">missed calls.</span>
                <span className="absolute bottom-1 left-0 w-full h-[0.28em] bg-gradient-to-r from-mustard to-terracotta rounded-sm -z-0"></span>
              </span>
            </h1>

            <p className="hero-desc mt-8 max-w-2xl mx-auto lg:mx-0 text-lg md:text-xl text-charcoal/75 leading-relaxed">
              G'day, I'm <span className="font-bold text-terracotta">Amily</span> — your local AI guide for Melbourne small business. I help tradies, cafes, and professional services stop losing jobs to missed calls, get more Google reviews, and put AI to work. <span className="font-semibold text-charcoal">No tech headache. No lock-in.</span>
            </p>

            <div className="hero-cta mt-10 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start items-center lg:items-start">
              <a
                href="#pricing"
                className="btn-magnetic inline-flex items-center gap-2 rounded-full bg-navy text-white px-7 py-4 text-base font-bold shadow-xl shadow-navy/25"
              >
                <span className="btn-bg bg-terracotta"></span>
                <span className="btn-label flex items-center gap-2">
                  Book a free 15-min chat <ArrowRight size={16} />
                </span>
              </a>
              <a
                href="#features"
                className="btn-magnetic inline-flex items-center gap-2 rounded-full bg-white/55 backdrop-blur-md border border-white/60 px-7 py-4 text-base font-bold text-navy hover:bg-white transition"
              >
                <span className="btn-label">See how it works</span>
              </a>
            </div>

            <div className="hero-trust mt-12 flex flex-wrap justify-center lg:justify-start gap-x-8 gap-y-3 text-sm font-semibold text-navy/70">
              <span className="flex items-center gap-2">
                <Check size={16} className="text-terracotta" /> No lock-in contracts
              </span>
              <span className="flex items-center gap-2">
                <Check size={16} className="text-terracotta" /> Local Melbourne 03 number
              </span>
              <span className="flex items-center gap-2">
                <Check size={16} className="text-terracotta" /> 30-day ROI promise
              </span>
            </div>
          </div>

          {/* ── RIGHT: huge Amily + bubble badges + decorative micro-shapes ── */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="hero-character-wrap relative w-[180px] sm:w-[400px] lg:w-[480px] xl:w-[560px] aspect-square animate-float">

{/* The character -- 8s video loop; reduced-motion users get the still PNG */}
              {reducedMotion ? (
                <img
                  src="/assets/amily-01-waving-transparent.png"
                  alt="Amily — your friendly AI guide for Melbourne small business"
                  className="relative z-10 w-full h-full object-contain drop-shadow-[0_18px_50px_rgba(30,58,95,0.20)]"
                />
              ) : (
                <video
                  ref={videoRef}
                  poster="/assets/amily-01-waving-transparent.png"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  aria-label="Amily — your friendly AI guide for Melbourne small business"
                  className="relative z-10 w-full h-full object-cover"
                >
                  <source src="/video/amily-hero-loop-v7-alpha.webm" type="video/webm" />
                  <source src="/video/amily-hero-loop-v7.mp4" type="video/mp4" />
                </video>
              )}

              {/* Mobile-only static pill: compact social proof visible on small screens */}
              <div className="lg:hidden absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-white/85 rounded-full px-3 py-1.5 shadow-lg z-20 whitespace-nowrap">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} className="text-mustard fill-mustard" />
                ))}
                <span className="text-charcoal text-xs font-bold ml-1">4.9 Google</span>
              </div>

              {/* 4 orbiting BUBBLE badges (hidden lg:flex per CLAUDE.md rule) */}
              <div
                className="hero-float-badge beat-phone absolute top-[8%] -right-6 lg:-right-12 hidden lg:flex bg-white/90 backdrop-blur-md border border-white/85 rounded-2xl px-5 py-3.5 shadow-xl z-20"
                style={{
                  opacity: activeBeat === 'phone' ? 1 : 0,
                  transform: activeBeat === 'phone' ? 'scale(1)' : 'scale(0.7)',
                  pointerEvents: activeBeat === 'phone' ? 'auto' : 'none',
                }}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare size={18} className="text-navy" />
                  <span className="text-charcoal text-sm lg:text-base font-semibold whitespace-nowrap">Call answered in 0.3s</span>
                </div>
              </div>

              <div
                className="hero-float-badge beat-stars absolute top-[8%] -right-6 lg:-right-12 hidden lg:flex bg-white/90 backdrop-blur-md border border-white/85 rounded-2xl px-5 py-3.5 shadow-xl z-20"
                style={{
                  opacity: activeBeat === 'stars' ? 1 : 0,
                  transform: activeBeat === 'stars' ? 'scale(1)' : 'scale(0.7)',
                  pointerEvents: activeBeat === 'stars' ? 'auto' : 'none',
                }}
              >
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} className="text-mustard fill-mustard" />
                  ))}
                  <span className="text-charcoal text-base font-semibold ml-2 whitespace-nowrap">4.9 Google reviews</span>
                </div>
              </div>

              <div
                className="hero-float-badge beat-laptop absolute top-[8%] -right-6 lg:-right-12 hidden lg:flex bg-white/90 backdrop-blur-md border border-white/85 rounded-2xl px-5 py-3.5 shadow-xl z-20"
                style={{
                  opacity: activeBeat === 'laptop' ? 1 : 0,
                  transform: activeBeat === 'laptop' ? 'scale(1)' : 'scale(0.7)',
                  pointerEvents: activeBeat === 'laptop' ? 'auto' : 'none',
                }}
              >
                <div className="flex items-center gap-3">
                  <Zap size={18} className="text-terracotta" />
                  <span className="text-charcoal text-sm lg:text-base font-semibold whitespace-nowrap">12 jobs booked today</span>
                </div>
              </div>

              <div
                className="hero-float-badge beat-saved absolute top-[8%] -right-6 lg:-right-12 hidden lg:flex bg-white/90 backdrop-blur-md border border-white/85 rounded-2xl px-5 py-3.5 shadow-xl z-20"
                style={{
                  opacity: activeBeat === 'saved' ? 1 : 0,
                  transform: activeBeat === 'saved' ? 'scale(1)' : 'scale(0.7)',
                  pointerEvents: activeBeat === 'saved' ? 'auto' : 'none',
                }}
              >
                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-green-600" />
                  <span className="text-charcoal text-sm lg:text-base font-semibold whitespace-nowrap">$4,200 saved this month</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════
   B2. MARQUEE TICKER -- sliding facts bar (from v1)
   ═══════════════════════════════════════════════════════════════ */

function MarqueeTicker() {
  const items = [
    '$52,000/yr lost to missed calls',
    '95% of AI projects never ship',
    '3.5★ average costs 30% of customers',
    'Cancel anytime',
    'Built in Melbourne',
  ];

  const ItemList = () => (
    <div className="flex items-center gap-16 pr-16 shrink-0">
      {items.map((text, i) => (
        <span key={i} className="whitespace-nowrap">{text}</span>
      ))}
    </div>
  );

  return (
    <section className="relative bg-navy text-cream overflow-hidden py-5 border-y border-navy-dark">
      <div className="flex gap-16 font-drama text-2xl md:text-3xl font-bold" style={{ animation: 'marquee 35s linear infinite' }}>
        <ItemList />
        <ItemList />
        <ItemList />
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════
   C. FEATURES -- "Interactive Functional Artifacts" (from v2)
   ═══════════════════════════════════════════════════════════════ */

/* Card 1: Diagnostic Shuffler -- AI Voice Receptionist */
function ShufflerCard() {
  const [order, setOrder] = useState([0, 1, 2]);
  const labels = [
    { icon: <Phone size={16} />, text: 'Incoming call from Sarah M.' },
    { icon: <Clock size={16} />, text: 'Job booked: Tue 2pm - Hot water' },
    { icon: <MessageSquare size={16} />, text: 'Summary sent to your phone' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setOrder((prev) => {
        const next = [...prev];
        next.unshift(next.pop());
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card-feature card-voice p-6 sm:p-8 h-full flex flex-col">
      {/* Card header with integrated Amily illustration */}
      <div className="flex items-start gap-4 mb-4">
        <div className="shrink-0 w-20 h-20 relative">
          <div className="absolute inset-0 bg-terracotta/15 rounded-2xl" />
          <img src="/assets/amily-02-phone.png" alt="Amily answering calls" className="relative w-full h-full object-contain p-1" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-charcoal text-xl leading-tight">AI Voice Receptionist</h3>
          <p className="text-charcoal/60 text-sm mt-1 leading-relaxed">
            Never miss a call again. Amily answers 24/7, books jobs, and sends you a summary.
          </p>
        </div>
      </div>

      {/* Shuffler Stack */}
      <div className="relative h-40 flex-1">
        {order.map((idx, position) => (
          <div
            key={idx}
            className="shuffler-card absolute left-0 right-0 bg-white border border-cream-dark rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm"
            style={{
              top: `${position * 16}px`,
              zIndex: 3 - position,
              opacity: 1 - position * 0.2,
              transform: `scale(${1 - position * 0.04})`,
            }}
          >
            <div className="w-8 h-8 rounded-xl bg-terracotta/10 flex items-center justify-center shrink-0 text-terracotta">
              {labels[idx].icon}
            </div>
            <span className="font-data text-xs text-charcoal/80">{labels[idx].text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Card 2: Telemetry Typewriter -- Smart Review Management */
function TypewriterCard() {
  const messages = [
    '> New 5-star review from James K.',
    '> AI drafting response...',
    '> "Thanks James! We loved working on your kitchen reno."',
    '> Response posted to Google in 2m 14s.',
    '> Review score: 4.2 -> 4.6 this month.',
  ];
  const [displayedLines, setDisplayedLines] = useState([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const feedRef = useRef(null);

  useEffect(() => {
    if (currentLine >= messages.length) {
      const timeout = setTimeout(() => {
        setDisplayedLines([]);
        setCurrentLine(0);
        setCurrentChar(0);
      }, 3000);
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      if (currentChar < messages[currentLine].length) {
        setCurrentChar((c) => c + 1);
      } else {
        setDisplayedLines((prev) => [...prev, messages[currentLine]]);
        setCurrentLine((l) => l + 1);
        setCurrentChar(0);
      }
    }, currentChar < messages[currentLine]?.length ? 35 : 600);

    return () => clearTimeout(timeout);
  }, [currentLine, currentChar, messages.length]);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [displayedLines, currentChar]);

  const partialLine =
    currentLine < messages.length
      ? messages[currentLine].slice(0, currentChar)
      : '';

  return (
    <div className="card-feature card-reviews p-6 sm:p-8 h-full flex flex-col">
      {/* Card header with integrated Amily illustration */}
      <div className="flex items-start gap-4 mb-3">
        <div className="shrink-0 w-20 h-20 relative">
          <div className="absolute inset-0 bg-mustard/20 rounded-2xl" />
          <img src="/assets/amily-03-five-stars.png" alt="Amily managing reviews" className="relative w-full h-full object-contain p-1" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-charcoal text-xl leading-tight">Smart Review Management</h3>
          <p className="text-charcoal/60 text-sm mt-1 leading-relaxed">
            Turn happy customers into 5-star reviews. AI-drafted responses in minutes.
          </p>
        </div>
      </div>

      {/* Live Feed Label */}
      <div className="flex items-center gap-2 mb-3">
        <span className="pulse-dot w-2 h-2 rounded-full bg-green-500 inline-block"></span>
        <span className="font-data text-xs text-charcoal/60 uppercase tracking-wider">Live Feed</span>
      </div>

      {/* Typewriter Feed */}
      <div
        ref={feedRef}
        className="bg-navy/5 rounded-2xl p-4 flex-1 overflow-y-auto font-data text-xs leading-relaxed min-h-[140px]"
      >
        {displayedLines.map((line, i) => (
          <div key={i} className="text-charcoal/70 mb-1">{line}</div>
        ))}
        {partialLine && (
          <div className="text-charcoal">
            {partialLine}
            <span className="cursor-blink text-terracotta font-bold">|</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* Card 3: Cursor Protocol Scheduler -- AI Setup Consulting */
function SchedulerCard() {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const [activeDay, setActiveDay] = useState(-1);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [saved, setSaved] = useState(false);
  const gridRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const targetDays = [1, 3, 5]; // Mon, Wed, Fri
    let step = 0;

    const runCycle = () => {
      if (!mounted) return;

      if (step === 0) {
        setCursorVisible(true);
        setCursorPos({ x: 20, y: 20 });
        setActiveDay(-1);
        setSaved(false);
        step++;
        setTimeout(runCycle, 500);
      } else if (step <= targetDays.length) {
        const dayIdx = targetDays[step - 1];
        const col = dayIdx;
        setCursorPos({ x: 16 + col * 38, y: 50 });
        setTimeout(() => {
          if (!mounted) return;
          setPressing(true);
          setTimeout(() => {
            if (!mounted) return;
            setPressing(false);
            setActiveDay(dayIdx);
            step++;
            setTimeout(runCycle, 400);
          }, 200);
        }, 400);
      } else if (step === targetDays.length + 1) {
        setCursorPos({ x: 120, y: 100 });
        setTimeout(() => {
          if (!mounted) return;
          setPressing(true);
          setTimeout(() => {
            if (!mounted) return;
            setPressing(false);
            setSaved(true);
            step++;
            setTimeout(runCycle, 1500);
          }, 200);
        }, 400);
      } else {
        setCursorVisible(false);
        step = 0;
        setTimeout(runCycle, 2000);
      }
    };

    setTimeout(runCycle, 1000);
    return () => { mounted = false; };
  }, []);

  return (
    <div className="card-feature card-scheduler p-6 sm:p-8 h-full flex flex-col">
      {/* Card header with integrated Amily illustration */}
      <div className="flex items-start gap-4 mb-3">
        <div className="shrink-0 w-20 h-20 relative">
          <div className="absolute inset-0 bg-navy/15 rounded-2xl" />
          <img src="/assets/amily-04-toolkit.png" alt="Amily with tools" className="relative w-full h-full object-contain p-1" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-charcoal text-xl leading-tight">AI Setup Consulting</h3>
          <p className="text-charcoal/60 text-sm mt-1 leading-relaxed">
            Get your first AI win in 30 days. Hands-on setup for Melbourne SMBs.
          </p>
        </div>
      </div>

      {/* Scheduler Grid */}
      <div ref={gridRef} className="relative bg-navy/5 rounded-2xl p-4 flex-1 min-h-[140px]">
        <div className="font-data text-xs text-charcoal/50 mb-3 uppercase tracking-wider">
          Onboarding Schedule
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => (
            <div
              key={i}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300
                ${activeDay >= i && [1, 3, 5].includes(i)
                  ? 'bg-terracotta text-white shadow-md'
                  : 'bg-white/60 text-charcoal/50'
                }
                ${pressing && cursorPos.x > 10 + i * 38 && cursorPos.x < 50 + i * 38 ? 'scale-95' : ''}
              `}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Save Button */}
        <button
          className={`mt-4 px-4 py-2 rounded-xl text-xs font-bold font-data transition-all duration-300
            ${saved
              ? 'bg-green-500 text-white'
              : 'bg-navy/10 text-charcoal/60'
            }`}
        >
          {saved ? 'Scheduled!' : 'Save'}
        </button>

        {/* Animated Cursor */}
        {cursorVisible && (
          <svg
            className="absolute pointer-events-none transition-all duration-500 ease-out"
            style={{ left: cursorPos.x, top: cursorPos.y }}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M5 3l14 9-7 2-4 7-3-18z"
              fill="#1e3a5f"
              stroke="#faf5eb"
              strokeWidth="1.5"
            />
          </svg>
        )}
      </div>
    </div>
  );
}

function Features() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.feature-card', {
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          once: true,
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="features"
      ref={sectionRef}
      className="py-20 sm:py-28 px-6 sm:px-10 max-w-7xl mx-auto"
    >
      <div className="text-center mb-12 sm:mb-16">
        <p className="font-data text-xs text-terracotta uppercase tracking-widest mb-3">What We Do</p>
        <h2 className="font-heading font-extrabold text-charcoal text-3xl sm:text-4xl md:text-5xl tracking-tighter">
          AI that works for{' '}
          <span className="font-drama italic text-terracotta">your business.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="feature-card">
          <ShufflerCard />
        </div>
        <div className="feature-card">
          <TypewriterCard />
        </div>
        <div className="feature-card">
          <SchedulerCard />
        </div>
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════
   D. HOW IT WORKS -- Simple 3-step horizontal layout (NO pinning)
   Replaced the broken sticky-stacking Protocol section.
   ═══════════════════════════════════════════════════════════════ */

/* SVG animation: rotating geometric motif */
function RotatingMotif() {
  return (
    <svg className="animate-rotate-slow w-16 h-16 opacity-30" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" fill="none" stroke="#c97b5d" strokeWidth="0.8" />
      <circle cx="50" cy="50" r="28" fill="none" stroke="#c97b5d" strokeWidth="0.8" />
      <circle cx="50" cy="50" r="16" fill="none" stroke="#c97b5d" strokeWidth="0.8" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <line
          key={deg}
          x1="50" y1="10" x2="50" y2="90"
          stroke="#c97b5d" strokeWidth="0.4"
          transform={`rotate(${deg} 50 50)`}
        />
      ))}
    </svg>
  );
}

/* SVG animation: scanning laser line */
function ScanningLine() {
  return (
    <div className="relative w-16 h-16 opacity-30 overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        {Array.from({ length: 6 }).map((_, row) =>
          Array.from({ length: 6 }).map((_, col) => (
            <circle
              key={`${row}-${col}`}
              cx={12 + col * 16}
              cy={12 + row * 16}
              r="2"
              fill="#c97b5d"
              opacity="0.5"
            />
          ))
        )}
      </svg>
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="animate-scan-line absolute top-0 h-full w-1 bg-gradient-to-b from-transparent via-terracotta to-transparent"></div>
      </div>
    </div>
  );
}

/* SVG animation: pulsing waveform */
function PulsingWave() {
  return (
    <svg className="w-16 h-16 opacity-30" viewBox="0 0 200 100">
      <path
        d="M0,50 Q25,20 50,50 T100,50 T150,50 T200,50"
        fill="none" stroke="#c97b5d" strokeWidth="2"
        className="animate-pulse-wave"
        style={{ strokeDasharray: 1000, strokeDashoffset: 1000 }}
      />
      <path
        d="M0,50 Q25,80 50,50 T100,50 T150,50 T200,50"
        fill="none" stroke="#e8b04e" strokeWidth="1"
        className="animate-pulse-wave"
        style={{ strokeDasharray: 1000, strokeDashoffset: 1000, animationDelay: '0.5s' }}
      />
    </svg>
  );
}

function HowItWorks() {
  const sectionRef = useRef(null);

  const steps = [
    {
      number: '01',
      label: 'Discovery',
      title: 'We learn your business',
      description:
        'A 30-minute call where we map your workflow, spot the time sinks, and show you exactly where AI fits. No jargon, no pressure.',
      highlight: 'Free, no commitment',
      icon: <Search size={18} />,
      visual: <RotatingMotif />,
    },
    {
      number: '02',
      label: 'Build',
      title: 'We set up your AI',
      description:
        'Done-for-you setup: voice receptionist, review automation, custom workflows -- tested with your real data before going live.',
      highlight: 'Live in 7 days',
      icon: <Wrench size={18} />,
      visual: <ScanningLine />,
    },
    {
      number: '03',
      label: 'Results',
      title: 'You see the ROI',
      description:
        'Fewer missed calls. More 5-star reviews. Hours back in your week. Real metrics in your dashboard, reviewed monthly.',
      highlight: '30-day ROI guarantee',
      icon: <TrendingUp size={18} />,
      visual: <PulsingWave />,
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Cards entrance -- y + fade stagger
      gsap.fromTo(
        '.how-step',
        { y: 80, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 1,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            once: true,
          },
        }
      );

      // Giant watermark numbers: scale + rotate pop
      gsap.fromTo(
        '.how-step-number',
        { scale: 0.5, autoAlpha: 0, rotation: -10 },
        {
          scale: 1,
          autoAlpha: 1,
          rotation: 0,
          duration: 1.3,
          stagger: 0.2,
          ease: 'back.out(1.4)',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            once: true,
          },
        }
      );

      // Accent edges draw down
      gsap.fromTo(
        '.how-step-accent',
        { scaleY: 0 },
        {
          scaleY: 1,
          duration: 0.9,
          stagger: 0.2,
          delay: 0.3,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            once: true,
          },
        }
      );

      // Progress bar scrub
      gsap.fromTo(
        '.how-progress-fill',
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            end: 'bottom 50%',
            scrub: 1,
          },
        }
      );

      // 3D tilt on hover
      const cards = gsap.utils.toArray('.how-step');
      cards.forEach((card) => {
        const handleMove = (e) => {
          const rect = card.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
          const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
          gsap.to(card, {
            rotationY: x * 4,
            rotationX: -y * 4,
            transformPerspective: 1200,
            duration: 0.4,
            ease: 'power2.out',
          });
        };
        const handleLeave = () => {
          gsap.to(card, {
            rotationY: 0,
            rotationX: 0,
            duration: 0.6,
            ease: 'power2.out',
          });
        };
        card.addEventListener('mousemove', handleMove);
        card.addEventListener('mouseleave', handleLeave);
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative py-24 sm:py-32 px-6 sm:px-10 bg-cream overflow-hidden"
    >
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(#0c1b30 1px, transparent 1px),
                            linear-gradient(90deg, #0c1b30 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14 sm:mb-16">
          <p className="font-data text-xs text-terracotta uppercase tracking-widest mb-3">
            How It Works
          </p>
          <h2 className="font-heading font-extrabold text-charcoal text-3xl sm:text-4xl md:text-5xl tracking-tighter">
            Three steps to{' '}
            <span className="font-drama italic text-navy">real results.</span>
          </h2>
        </div>

        {/* Progress bar */}
        <div className="max-w-5xl mx-auto mb-12 sm:mb-14 px-2">
          <div className="relative h-[2px] bg-charcoal/10 rounded-full overflow-hidden">
            <div className="how-progress-fill absolute inset-y-0 left-0 w-full bg-gradient-to-r from-terracotta via-mustard to-terracotta origin-left"></div>
          </div>
          <div className="flex justify-between text-[10px] font-data uppercase tracking-widest text-charcoal/40 mt-3">
            <span>Day 0 -- Call</span>
            <span>Day 7 -- Live</span>
            <span>Day 30 -- ROI</span>
          </div>
        </div>

        {/* Step cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {steps.map((step) => (
            <div
              key={step.number}
              className="how-step relative group"
              style={{ perspective: '1200px' }}
            >
              <div className="relative bg-navy rounded-3xl p-8 sm:p-10 overflow-hidden min-h-[400px] sm:min-h-[440px] shadow-xl transition-shadow duration-500 group-hover:shadow-2xl">
                {/* Accent edge (left) */}
                <div className="how-step-accent absolute left-0 top-0 w-[3px] h-full bg-gradient-to-b from-terracotta via-mustard to-terracotta origin-top"></div>

                {/* Giant watermark number */}
                <span className="how-step-number absolute -top-4 sm:-top-6 -right-2 sm:-right-4 pointer-events-none font-drama italic text-[8rem] sm:text-[11rem] leading-none text-terracotta select-none">
                  {step.number}
                </span>

                {/* Subtle grid inside card */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.04]"
                  style={{
                    backgroundImage: `linear-gradient(#faf5eb 1px, transparent 1px),
                                      linear-gradient(90deg, #faf5eb 1px, transparent 1px)`,
                    backgroundSize: '24px 24px',
                  }}
                />

                {/* Content */}
                <div className="relative z-10">
                  {/* Label row */}
                  <div className="inline-flex items-center gap-2 mb-6">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-mustard/15 text-mustard">
                      {step.icon}
                    </span>
                    <span className="font-data text-[11px] text-mustard uppercase tracking-[0.2em]">
                      {step.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-heading font-extrabold text-cream text-2xl sm:text-[1.7rem] leading-tight mb-4 tracking-tight">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-cream/70 text-sm sm:text-base leading-relaxed mb-6 max-w-xs">
                    {step.description}
                  </p>

                  {/* Highlight pill */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-sm">
                    <span className="w-1 h-1 rounded-full bg-terracotta pulse-dot"></span>
                    <span className="font-data text-[10px] text-cream/80 uppercase tracking-wider">
                      {step.highlight}
                    </span>
                  </div>
                </div>

                {/* Bottom visual */}
                <div className="absolute bottom-5 right-5 z-0 opacity-70 group-hover:opacity-100 transition-opacity duration-500">
                  {step.visual}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Closer */}
        <p className="text-center text-charcoal/50 text-xs sm:text-sm font-data uppercase tracking-widest mt-12">
          No setup fees. No surprises.{' '}
          <span className="text-terracotta font-semibold">Live in 7 days.</span>
        </p>
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════
   E2. PROOF -- "The Numbers" (animated counter stats)
   ═══════════════════════════════════════════════════════════════ */

function Proof() {
  const sectionRef = useRef(null);

  const stats = [
    {
      value: 0.3,
      suffix: 's',
      label: 'Call pickup',
      caption: 'Faster than any human receptionist',
    },
    {
      value: 24,
      suffix: '/7',
      label: 'Always on',
      caption: 'After-hours, weekends, public holidays',
    },
    {
      value: 30,
      suffix: ' day',
      label: 'ROI guarantee',
      caption: 'Or we refund your setup. No fine print.',
    },
    {
      value: 60,
      suffix: '%',
      label: 'Time saved',
      caption: 'On reception and review admin busywork',
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.proof-card',
        { y: 60, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.9,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            once: true,
          },
        }
      );

      // Count-up numbers
      gsap.utils.toArray('.proof-number').forEach((el) => {
        const target = parseFloat(el.dataset.value);
        const isDecimal = target % 1 !== 0;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
          onUpdate: () => {
            el.innerText = isDecimal ? obj.val.toFixed(1) : Math.round(obj.val);
          },
        });
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-20 sm:py-28 px-6 sm:px-10 bg-[#f4ecd9] overflow-hidden"
    >
      {/* Dotted pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #0c1b30 1px, transparent 0)`,
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-14">
          <p className="font-data text-xs text-terracotta uppercase tracking-widest mb-3">
            The Numbers
          </p>
          <h2 className="font-heading font-extrabold text-charcoal text-3xl sm:text-4xl md:text-5xl tracking-tighter">
            Results you can{' '}
            <span className="font-drama italic text-navy">actually measure.</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="proof-card relative bg-cream rounded-3xl p-6 sm:p-8 border border-charcoal/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 lift-hover"
            >
              {/* Mini header */}
              <div className="flex items-center gap-2 mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-terracotta pulse-dot"></span>
                <span className="font-data text-[10px] text-terracotta uppercase tracking-widest">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>

              {/* Number */}
              <div className="flex items-baseline gap-1 mb-3">
                <span
                  className="font-drama italic text-navy text-5xl sm:text-6xl font-bold leading-none proof-number"
                  data-value={stat.value}
                >
                  0
                </span>
                <span className="font-drama italic text-terracotta text-2xl sm:text-3xl font-bold">
                  {stat.suffix}
                </span>
              </div>

              {/* Label */}
              <p className="font-heading font-extrabold text-charcoal text-base sm:text-lg mt-2">
                {stat.label}
              </p>

              {/* Caption */}
              <p className="text-charcoal/60 text-xs sm:text-sm mt-1.5 leading-relaxed">
                {stat.caption}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════
   E. PHILOSOPHY -- "The Manifesto" (from v2)
   ═══════════════════════════════════════════════════════════════ */

function Philosophy() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.phil-line', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 65%',
          once: true,
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 sm:py-32 px-6 sm:px-10 bg-navy overflow-hidden"
    >
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `radial-gradient(circle, rgba(250,245,235,0.6) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Most focus on */}
        <div className="phil-line mb-10 sm:mb-14">
          <p className="text-white/50 text-sm sm:text-base font-data uppercase tracking-widest mb-3">
            Most AI companies focus on:
          </p>
          <p className="text-white/70 text-xl sm:text-2xl md:text-3xl font-heading font-semibold leading-snug">
            Selling you complex tech you don't understand.
          </p>
        </div>

        {/* We focus on */}
        <div className="phil-line">
          <p className="text-terracotta text-sm sm:text-base font-data uppercase tracking-widest mb-3">
            We focus on:
          </p>
          <p className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight">
            <span className="font-heading font-extrabold">Getting you </span>
            <span className="font-drama italic text-mustard">measurable results</span>
            <span className="font-heading font-extrabold"> within 30 days</span>
            <span className="font-drama italic text-terracotta"> -- or you don't pay.</span>
          </p>
        </div>
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════
   F. PRICING (from v2)
   ═══════════════════════════════════════════════════════════════ */

/* Animated progress ring -- stroke-dashoffset tween on scroll */
function ProgressRing({ value, size = 68, stroke = 4, color, trackColor, children }) {
  const ringRef = useRef(null);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (!ringRef.current) return;
    const offset = circumference * (1 - value / 100);
    const tween = gsap.fromTo(
      ringRef.current,
      { strokeDashoffset: circumference },
      {
        strokeDashoffset: offset,
        duration: 1.6,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ringRef.current,
          start: 'top 90%',
          once: true,
        },
      }
    );
    return () => tween.kill();
  }, [value, circumference]);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          stroke={trackColor}
        />
        <circle
          ref={ringRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

/* Price that count-ups on first scroll-in AND smooth-tweens on value changes (billing toggle) */
function AnimatedPrice({ value, className }) {
  const ref = useRef(null);
  const displayRef = useRef(0);
  const enteredRef = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const obj = { val: displayRef.current };
    const tween = gsap.to(obj, {
      val: value,
      duration: enteredRef.current ? 0.7 : 1.5,
      ease: 'power3.out',
      onUpdate: () => {
        if (ref.current) {
          ref.current.textContent = Math.round(obj.val).toLocaleString();
          displayRef.current = obj.val;
        }
      },
      scrollTrigger: enteredRef.current
        ? undefined
        : {
            trigger: ref.current,
            start: 'top 95%',
            once: true,
            onEnter: () => {
              enteredRef.current = true;
            },
          },
    });
    return () => tween.kill();
  }, [value]);

  return <span ref={ref} className={className}>0</span>;
}

/* Monthly/Yearly segmented toggle */
function BillingToggle({ value, onChange }) {
  return (
    <div className="relative inline-block">
      <div className="toggle-wiggle inline-flex items-center bg-charcoal/[0.06] border border-charcoal/10 rounded-full p-1 relative">
        <div
          className="toggle-thumb-jelly absolute top-1 bottom-1 rounded-full bg-navy shadow-md"
          style={{
            width: 'calc(50% - 4px)',
            left: '4px',
            transform: value === 'yearly' ? 'translateX(100%)' : 'translateX(0%)',
          }}
        />
        <button
          type="button"
          onClick={() => onChange('monthly')}
          className={`relative z-10 px-6 sm:px-7 py-2 font-data text-[11px] uppercase tracking-widest transition-colors duration-300 ${
            value === 'monthly' ? 'text-white' : 'text-charcoal/60 hover:text-charcoal/80'
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => onChange('yearly')}
          className={`relative z-10 px-6 sm:px-7 py-2 font-data text-[11px] uppercase tracking-widest transition-colors duration-300 ${
            value === 'yearly' ? 'text-white' : 'text-charcoal/60 hover:text-charcoal/80'
          }`}
        >
          Yearly
        </button>
      </div>
      <span
        className="badge-bob absolute -top-3 -right-5 text-charcoal text-[9px] font-bold px-2 py-0.5 rounded-full font-data uppercase tracking-wider shadow-sm"
        style={{
          background: 'linear-gradient(90deg, #c97b5d, #e8b04e)',
        }}
      >
        Save 20%
      </span>
    </div>
  );
}

function Pricing() {
  const sectionRef = useRef(null);
  const [billing, setBilling] = useState('monthly');

  const plans = [
    {
      name: 'Essential',
      badge: 'Best for review-focused SMBs',
      priceMonthly: 99,
      priceYearly: 79,
      oneOff: false,
      description: 'AI Review Management for local businesses ready to dominate Google.',
      icon: <Star size={20} strokeWidth={2} />,
      coverage: 40,
      coverageLabel: 'Essential coverage',
      features: [
        { text: '24/7 review monitoring across Google + socials', highlight: false },
        { text: 'AI-drafted responses in your brand tone', highlight: true },
        { text: 'Google Business Profile sync', highlight: false },
        { text: 'Monthly performance report', highlight: false },
        { text: 'Email support (1 business day)', highlight: false },
      ],
      cta: 'Start with Essential',
      popular: false,
    },
    {
      name: 'Performance',
      badge: 'Best for growing trades + services',
      priceMonthly: 249,
      priceYearly: 199,
      oneOff: false,
      description: 'AI voice receptionist + reviews -- for businesses losing jobs after-hours.',
      icon: <Phone size={20} strokeWidth={2} />,
      coverage: 80,
      coverageLabel: 'High coverage',
      features: [
        { text: 'Everything in Essential', highlight: false },
        { text: '24/7 AI voice receptionist', highlight: true },
        { text: 'Automatic job booking + calendar sync', highlight: true },
        { text: 'Real-time call summaries to your phone', highlight: false },
        { text: 'SMS follow-ups to customers', highlight: false },
        { text: 'Priority support (same-day)', highlight: false },
      ],
      cta: 'Book a Free Discovery Call',
      popular: true,
    },
    {
      name: 'Enterprise',
      badge: 'Best for full transformation',
      priceMonthly: 3500,
      priceYearly: 3500,
      oneOff: true,
      description: 'White-glove AI setup, team training, and 3 months hands-on support.',
      icon: <Shield size={20} strokeWidth={2} />,
      coverage: 100,
      coverageLabel: 'Full coverage',
      features: [
        { text: 'Everything in Performance', highlight: false },
        { text: 'Custom AI workflow design', highlight: true },
        { text: 'Team training + onboarding (2 sessions)', highlight: false },
        { text: 'Dedicated Slack / email channel', highlight: false },
        { text: '3 months hands-on support', highlight: true },
        { text: '30-day ROI guarantee or refund', highlight: true },
      ],
      cta: 'Discuss Enterprise Setup',
      popular: false,
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Cards enter with slight scale + y
      gsap.fromTo(
        '.pricing-card',
        { y: 70, scale: 0.96, autoAlpha: 0 },
        {
          y: 0,
          scale: 1,
          autoAlpha: 1,
          duration: 0.9,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 90%',
            once: true,
          },
        }
      );

      // Features stagger
      gsap.fromTo(
        '.pricing-feature',
        { x: -8, autoAlpha: 0 },
        {
          x: 0,
          autoAlpha: 1,
          duration: 0.5,
          stagger: 0.04,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            once: true,
          },
        }
      );

      ScrollTrigger.refresh();
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="pricing"
      ref={sectionRef}
      className="relative py-24 sm:py-32 px-6 sm:px-10 overflow-hidden"
    >
      {/* Floating dot field (30 small bubbles) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => {
          const colors = ['#c97b5d', '#e8b04e', '#1e3a5f'];
          const color = colors[i % 3];
          return (
            <span
              key={i}
              className="pricing-dot"
              style={{
                left: `${(i * 37) % 100}%`,
                top: `${(i * 53) % 100}%`,
                background: color,
                opacity: 0.3,
                '--dx': `${(i % 5) * 4 - 8}px`,
                '--dur': `${3 + (i % 4)}s`,
                '--delay': `${(i % 7) * 0.4}s`,
              }}
            />
          );
        })}
      </div>

      {/* Floating background blobs (ambient color) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="pricing-blob pricing-blob-1"
          style={{
            top: '-120px',
            left: '8%',
            width: '420px',
            height: '420px',
            background: 'radial-gradient(circle, rgba(201,123,93,0.35), transparent 70%)',
          }}
        />
        <div
          className="pricing-blob pricing-blob-2"
          style={{
            top: '20%',
            right: '-80px',
            width: '380px',
            height: '380px',
            background: 'radial-gradient(circle, rgba(232,176,78,0.32), transparent 70%)',
          }}
        />
        <div
          className="pricing-blob pricing-blob-3"
          style={{
            bottom: '10%',
            left: '-60px',
            width: '340px',
            height: '340px',
            background: 'radial-gradient(circle, rgba(30,58,95,0.22), transparent 70%)',
          }}
        />
        <div
          className="pricing-blob pricing-blob-4"
          style={{
            bottom: '-100px',
            right: '15%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(201,123,93,0.28), transparent 70%)',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="font-data text-xs text-terracotta uppercase tracking-widest mb-3">
            Pricing
          </p>
          <h2 className="font-heading font-extrabold text-charcoal text-3xl sm:text-4xl md:text-5xl tracking-tighter">
            Simple pricing.{' '}
            <span className="font-drama italic text-navy">Real value.</span>
          </h2>
          <p className="text-charcoal/60 mt-4 max-w-lg mx-auto">
            No lock-in contracts. No hidden fees. Cancel anytime.
          </p>

          {/* Guarantee pill */}
          <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-mustard/15 border border-mustard/40">
            <Shield size={14} className="text-terracotta" />
            <span className="font-data text-[11px] text-charcoal/70 uppercase tracking-widest">
              30-day ROI guarantee on every plan
            </span>
          </div>

          {/* Billing toggle */}
          <div className="mt-8 flex justify-center">
            <BillingToggle value={billing} onChange={setBilling} />
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch pt-6">
          {plans.map((plan, tierIdx) => {
            const currentPrice =
              billing === 'yearly' ? plan.priceYearly : plan.priceMonthly;
            const periodLabel = plan.oneOff
              ? 'one-off'
              : billing === 'yearly'
              ? '/mo billed yearly'
              : '/mo';
            const ringColor = plan.popular ? '#e8b04e' : '#c97b5d';
            const ringTrack = plan.popular
              ? 'rgba(255,255,255,0.15)'
              : 'rgba(12,27,48,0.08)';
            const iconColor = plan.popular ? 'text-mustard' : 'text-navy';

            return (
              <div
                key={plan.name}
                className={`pricing-card group relative rounded-3xl p-6 sm:p-8 flex flex-col will-change-transform ${
                  plan.popular
                    ? 'bg-navy text-white shadow-2xl md:scale-105 z-10 hover:shadow-[0_30px_60px_-15px_rgba(201,123,93,0.45)]'
                    : `bg-cream border border-charcoal/10 shadow-lg hover:shadow-2xl hover:-translate-y-2 overflow-hidden ${
                        plan.name === 'Essential'
                          ? 'pricing-tier-essential'
                          : plan.name === 'Enterprise'
                          ? 'pricing-tier-enterprise'
                          : ''
                      }`
                }`}
                style={{
                  transition:
                    'transform 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 500ms ease-out',
                }}
              >
                {/* Tier watermark digit (non-popular only) */}
                {!plan.popular && (
                  <span
                    className="pricing-watermark"
                    style={{ color: plan.name === 'Enterprise' ? '#1e3a5f' : '#c97b5d' }}
                  >
                    {tierIdx + 1}
                  </span>
                )}

                {/* Popular glow + badge */}
                {plan.popular && (
                  <>
                    <div
                      className="absolute -inset-[2px] rounded-3xl -z-10 opacity-80 blur-[1px]"
                      style={{
                        background:
                          'linear-gradient(135deg, #c97b5d 0%, #e8b04e 50%, #c97b5d 100%)',
                      }}
                    />
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                      <div
                        className="text-charcoal text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest font-data shadow-lg"
                        style={{
                          background:
                            'linear-gradient(90deg, #c97b5d 0%, #e8b04e 100%)',
                        }}
                      >
                        Most Popular
                      </div>
                    </div>
                  </>
                )}

                {/* Progress ring + name */}
                <div className="flex items-center gap-4 mb-2">
                  <div
                    className="tier-icon-wiggle"
                    style={{ animationDelay: `${tierIdx * 0.6}s` }}
                  >
                    <ProgressRing
                      value={plan.coverage}
                      color={ringColor}
                      trackColor={ringTrack}
                    >
                      <span className={iconColor}>{plan.icon}</span>
                    </ProgressRing>
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`font-heading font-extrabold text-xl leading-tight ${
                        plan.popular ? 'text-white' : 'text-charcoal'
                      }`}
                    >
                      {plan.name}
                    </h3>
                    <p
                      className={`font-data text-[10px] uppercase tracking-widest mt-1 ${
                        plan.popular ? 'text-white font-bold' : 'text-terracotta'
                      }`}
                    >
                      {plan.coverage}% {plan.coverageLabel}
                    </p>
                  </div>
                </div>

                {/* Badge line */}
                <p
                  className={`text-[11px] font-data uppercase tracking-widest mb-4 mt-2 ${
                    plan.popular ? 'text-white/85' : 'text-charcoal/50'
                  }`}
                >
                  {plan.badge}
                </p>

                {/* Description */}
                <p
                  className={`text-sm leading-relaxed mb-6 ${
                    plan.popular ? 'text-white/95' : 'text-charcoal/70'
                  }`}
                >
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-6 flex items-baseline flex-wrap gap-x-1">
                  <span
                    className={`text-5xl sm:text-6xl font-extrabold font-heading tracking-tighter ${
                      plan.popular ? 'text-white' : 'text-charcoal'
                    }`}
                  >
                    $
                    <AnimatedPrice value={currentPrice} />
                  </span>
                  <span
                    className={`text-sm ml-1 ${
                      plan.popular ? 'text-white/60' : 'text-charcoal/50'
                    }`}
                  >
                    {periodLabel}
                  </span>
                </div>

                {/* Features */}
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((feature) => (
                    <li
                      key={feature.text}
                      className={`pricing-feature ${
                        plan.popular ? 'pricing-feature-popular text-white/85' : 'pricing-feature-light text-charcoal/80'
                      } flex items-start gap-3 text-sm`}
                    >
                      <span className="feature-check shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <span className={feature.highlight ? 'font-semibold' : ''}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href="#"
                  className={`btn-magnetic relative block text-center px-6 py-3.5 rounded-full font-bold text-sm overflow-hidden ${
                    plan.popular ? 'text-charcoal' : 'bg-navy text-white'
                  }`}
                  style={
                    plan.popular
                      ? {
                          background:
                            'linear-gradient(90deg, #c97b5d 0%, #e8b04e 100%)',
                        }
                      : {}
                  }
                >
                  <span
                    className={`btn-bg ${plan.popular ? 'bg-white' : 'bg-terracotta'}`}
                  ></span>
                  <span className="btn-label flex items-center justify-center gap-2">
                    {plan.cta} <ArrowRight size={14} />
                  </span>
                </a>
              </div>
            );
          })}
        </div>

        {/* Every plan includes banner */}
        <div className="mt-12 sm:mt-14 max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-navy to-charcoal p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-5 sm:gap-6">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-terracotta/20 flex items-center justify-center">
              <Sparkles className="text-mustard" size={24} />
            </div>
            <div className="flex-1">
              <p className="font-data text-[11px] text-mustard uppercase tracking-widest mb-3">
                Every Plan Includes
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-white/85 text-sm">
                <span className="flex items-center gap-2">
                  <Check size={14} className="text-mustard shrink-0" />
                  Australian data hosting
                </span>
                <span className="flex items-center gap-2">
                  <Check size={14} className="text-mustard shrink-0" />
                  No lock-in contracts
                </span>
                <span className="flex items-center gap-2">
                  <Check size={14} className="text-mustard shrink-0" />
                  Cancel anytime
                </span>
                <span className="flex items-center gap-2">
                  <Check size={14} className="text-mustard shrink-0" />
                  Live in 7 days
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════
   F2. FAQ -- "Questions, answered" (accordion)
   ═══════════════════════════════════════════════════════════════ */

function FAQ() {
  const [open, setOpen] = useState(0);
  const sectionRef = useRef(null);

  const faqs = [
    {
      q: 'Do I need tech skills to use this?',
      a: "Nope. We handle setup, configuration, and team training end-to-end. You keep running your business; we handle the wiring.",
    },
    {
      q: "What if the AI doesn't sound right for my brand?",
      a: "We test every voice and review response with you before launch. You pick the tone -- warm, straight-to-the-point, cheeky -- and we tune the AI to match. If it's not right, we rework it before going live.",
    },
    {
      q: 'Can I keep my existing phone number?',
      a: 'Yes. Your AI receptionist picks up via standard call forwarding -- your number stays yours, customers never notice the change, and you can switch it off any time from your dashboard.',
    },
    {
      q: "What happens when the AI can't answer a question?",
      a: "It hands off gracefully. Customers can leave a message, book a callback, or ask for you directly -- and you get an SMS summary within seconds. No missed jobs, no bad experiences.",
    },
    {
      q: 'Is my customer data safe?',
      a: 'Your data is hosted in Australia, encrypted in transit and at rest. We comply with the Australian Privacy Principles, never sell or share data, and you can purge call recordings or transcripts any time.',
    },
    {
      q: "What's the 30-day ROI guarantee?",
      a: "If you don't see measurable ROI -- more bookings, more reviews, or hours saved -- within 30 days of going live, we refund your setup fee. No legal fine print, no retention calls.",
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.faq-item',
        { y: 30, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 85%',
            once: true,
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-20 sm:py-28 px-6 sm:px-10 bg-cream"
    >
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="font-data text-xs text-terracotta uppercase tracking-widest mb-3">
            FAQ
          </p>
          <h2 className="font-heading font-extrabold text-charcoal text-3xl sm:text-4xl md:text-5xl tracking-tighter">
            Questions,{' '}
            <span className="font-drama italic text-navy">answered.</span>
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className="faq-item rounded-2xl border border-charcoal/10 overflow-hidden bg-white/60 backdrop-blur-sm transition-colors hover:bg-white/80"
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-heading font-bold text-charcoal text-base sm:text-lg pr-4">
                    {faq.q}
                  </span>
                  <span
                    className={`shrink-0 w-8 h-8 rounded-full bg-cream-dark/70 flex items-center justify-center transition-transform duration-300 ${
                      isOpen ? 'rotate-45 bg-terracotta text-white' : 'text-terracotta'
                    }`}
                  >
                    <Plus size={16} strokeWidth={2.5} />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-500 ease-out"
                  style={{
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                  }}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-5 text-charcoal/70 text-sm sm:text-base leading-relaxed">
                      {faq.a}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA below FAQ */}
        <div className="mt-12 text-center">
          <p className="text-charcoal/60 text-sm mb-4">Still have questions?</p>
          <a
            href="#"
            className="btn-magnetic relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-navy text-white"
          >
            <span className="btn-bg bg-terracotta"></span>
            <span className="btn-label flex items-center gap-2">
              Book a Free Call <ArrowRight size={14} />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════
   G. FOOTER (from v2)
   ═══════════════════════════════════════════════════════════════ */

function Footer() {
  return (
    <footer className="bg-charcoal rounded-t-4xl sm:rounded-t-5xl mt-10">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/assets/logo-full-transparent.png"
                alt="Amily AI"
                className="w-10 h-10 rounded-xl"
              />
              <span className="font-heading font-bold text-white text-xl">Amily AI</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              Your local AI guide for Melbourne small business. Helping tradies, cafes, and SMBs put AI
              to work without the tech headache.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-heading font-bold text-white text-sm uppercase tracking-wider mb-4">
              Services
            </h4>
            <ul className="space-y-2">
              {['AI Voice Receptionist', 'Smart Review Management', 'AI Setup Consulting'].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#features"
                      className="text-white/50 text-sm hover:text-terracotta transition-colors lift-hover inline-block"
                    >
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-heading font-bold text-white text-sm uppercase tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-2">
              {['How It Works', 'Pricing', 'Privacy Policy', 'Terms of Service'].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-white/50 text-sm hover:text-terracotta transition-colors lift-hover inline-block"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-bold text-white text-sm uppercase tracking-wider mb-4">
              Get In Touch
            </h4>
            <ul className="space-y-2">
              <li className="text-white/50 text-sm">Melbourne, Australia</li>
              <li>
                <a
                  href="mailto:hello@amily.ai"
                  className="text-white/50 text-sm hover:text-terracotta transition-colors lift-hover inline-block"
                >
                  hello@amily.ai
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs">
            &copy; {new Date().getFullYear()} Amily AI. All rights reserved. ABN registered.
          </p>

          {/* System Operational */}
          <div className="flex items-center gap-2">
            <span className="pulse-dot w-2 h-2 rounded-full bg-green-500 inline-block"></span>
            <span className="font-data text-xs text-white/40 uppercase tracking-wider">
              System Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}


/* ═══════════════════════════════════════════════════════════════
   APP
   ═══════════════════════════════════════════════════════════════ */

function App() {
  useEffect(() => {
    ScrollTrigger.refresh();
  }, []);

  return (
    <div className="bg-cream min-h-screen">
      <Navbar />
      <Hero />
      <MarqueeTicker />
      <Features />
      <HowItWorks />
      <Proof />
      <Philosophy />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}

export default App;
