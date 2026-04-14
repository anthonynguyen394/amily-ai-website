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
            <div className="hero-character-wrap relative w-[300px] sm:w-[400px] lg:w-[480px] xl:w-[560px] aspect-square animate-float">

              {/* Decorative micro-shapes (inline SVG, brand colors) */}
              <svg aria-hidden className="hero-deco absolute top-[8%] -left-4 w-7 h-7 text-mustard animate-drift-slow" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 4 A 10 10 0 1 0 16 20 A 8 8 0 1 1 16 4 Z" />
              </svg>
              <svg aria-hidden className="hero-deco absolute -top-2 right-[14%] w-8 h-8 text-terracotta animate-drift" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="6" y1="18" x2="18" y2="6" />
              </svg>
              <svg aria-hidden className="hero-deco absolute top-[40%] -right-2 w-4 h-4 text-navy/60 animate-drift-slow" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="3" fill="currentColor" />
              </svg>
              <svg aria-hidden className="hero-deco absolute bottom-[16%] left-[-1%] w-5 h-5 text-mustard animate-drift" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 4 A 10 10 0 1 0 16 20 A 8 8 0 1 1 16 4 Z" />
              </svg>
              <svg aria-hidden className="hero-deco absolute bottom-[10%] right-[20%] w-3 h-3 text-terracotta animate-drift-slow" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="3" fill="currentColor" />
              </svg>

              {/* The character -- gentle sway pivots from feet, parent does the bob */}
              <img
                src="/assets/amily-01-waving-transparent.png"
                alt="Amily — your friendly AI guide for Melbourne small business"
                className="relative z-10 w-full h-full object-contain drop-shadow-[0_18px_50px_rgba(30,58,95,0.20)] animate-wave-tilt"
              />

              {/* 4 orbiting BUBBLE badges (hidden lg:flex per CLAUDE.md rule) */}
              <div className="hero-float-badge absolute top-[10%] -left-8 lg:-left-12 hidden lg:flex bg-white/75 backdrop-blur-md border border-white/80 rounded-2xl px-3 py-2 animate-float-delayed shadow-lg z-20">
                <div className="flex items-center gap-2">
                  <MessageSquare size={13} className="text-navy" />
                  <span className="text-charcoal text-xs font-semibold whitespace-nowrap">Call answered in 0.3s</span>
                </div>
              </div>

              <div className="hero-float-badge absolute top-[2%] -right-4 lg:-right-8 hidden lg:flex bg-white/75 backdrop-blur-md border border-white/80 rounded-2xl px-3 py-2 animate-float-slow shadow-lg z-20">
                <div className="flex items-center gap-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={11} className="text-mustard fill-mustard" />
                  ))}
                  <span className="text-charcoal text-xs font-semibold ml-1">4.9</span>
                </div>
              </div>

              <div className="hero-float-badge absolute top-[55%] -left-10 lg:-left-16 hidden lg:flex bg-white/75 backdrop-blur-md border border-white/80 rounded-2xl px-3 py-2 animate-float-reverse shadow-lg z-20">
                <div className="flex items-center gap-2">
                  <Zap size={13} className="text-terracotta" />
                  <span className="text-charcoal text-xs font-semibold whitespace-nowrap">12 jobs booked today</span>
                </div>
              </div>

              <div className="hero-float-badge absolute bottom-[8%] -right-6 lg:-right-12 hidden lg:flex bg-white/75 backdrop-blur-md border border-white/80 rounded-2xl px-3 py-2 animate-float-delayed shadow-lg z-20">
                <div className="flex items-center gap-2">
                  <Shield size={13} className="text-green-600" />
                  <span className="text-charcoal text-xs font-semibold whitespace-nowrap">$4,200 saved this month</span>
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
    <div className="card-base p-6 sm:p-8 h-full flex flex-col">
      {/* Card header with integrated Amily illustration */}
      <div className="flex items-start gap-4 mb-4">
        <div className="shrink-0 w-20 h-20 relative">
          <div className="absolute inset-0 bg-terracotta/10 rounded-2xl" />
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
    <div className="card-base p-6 sm:p-8 h-full flex flex-col">
      {/* Card header with integrated Amily illustration */}
      <div className="flex items-start gap-4 mb-3">
        <div className="shrink-0 w-20 h-20 relative">
          <div className="absolute inset-0 bg-mustard/10 rounded-2xl" />
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
    <div className="card-base p-6 sm:p-8 h-full flex flex-col">
      {/* Card header with integrated Amily illustration */}
      <div className="flex items-start gap-4 mb-3">
        <div className="shrink-0 w-20 h-20 relative">
          <div className="absolute inset-0 bg-navy/10 rounded-2xl" />
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
      title: 'Discovery',
      description: 'We learn your business, your pain points, your goals. 30-minute call, no jargon.',
      visual: <RotatingMotif />,
    },
    {
      number: '02',
      title: 'Build',
      description: 'We set up your AI tools, test them, and train your team. Hands-on, not hands-off.',
      visual: <ScanningLine />,
    },
    {
      number: '03',
      title: 'Results',
      description: 'You see fewer missed calls, more reviews, more time. Real ROI within 30 days.',
      visual: <PulsingWave />,
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.how-step', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          once: true,
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="how-it-works" ref={sectionRef} className="py-20 sm:py-28 px-6 sm:px-10 bg-cream">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <p className="font-data text-xs text-terracotta uppercase tracking-widest mb-3">How It Works</p>
          <h2 className="font-heading font-extrabold text-charcoal text-3xl sm:text-4xl md:text-5xl tracking-tighter">
            Three steps to{' '}
            <span className="font-drama italic text-navy">real results.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {steps.map((step) => (
            <div
              key={step.number}
              className="how-step bg-navy rounded-3xl p-8 sm:p-10 relative overflow-hidden"
            >
              {/* Decorative SVG visual */}
              <div className="absolute top-6 right-6">
                {step.visual}
              </div>

              {/* Step number in large monospace */}
              <span className="font-data text-6xl sm:text-7xl font-bold text-terracotta/20 leading-none block">
                {step.number}
              </span>

              {/* Title */}
              <h3 className="font-heading font-extrabold text-white text-2xl sm:text-3xl mt-3 tracking-tight">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-white/60 text-sm sm:text-base mt-4 leading-relaxed">
                {step.description}
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

function Pricing() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.pricing-card', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          once: true,
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const plans = [
    {
      name: 'Essential',
      price: '$99',
      period: '/mo',
      description: 'AI Review Management',
      features: [
        'Automated review monitoring',
        'AI-drafted review responses',
        'Google Business Profile integration',
        'Monthly performance report',
        'Email support',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Performance',
      price: '$249',
      period: '/mo',
      description: 'AI Voice Receptionist + Reviews Bundle',
      features: [
        'Everything in Essential',
        '24/7 AI voice receptionist',
        'Job booking and scheduling',
        'Call summaries to your phone',
        'SMS follow-ups to customers',
        'Priority support',
      ],
      cta: 'Book a Free Discovery Call',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: '$3,500',
      period: ' one-off',
      description: 'Full AI Setup + Consulting + 3 Months Support',
      features: [
        'Everything in Performance',
        'Custom AI workflow design',
        'Team training and onboarding',
        'Dedicated 1-on-1 support',
        '3 months hands-on support',
        'ROI guarantee within 30 days',
      ],
      cta: 'Book a Free Discovery Call',
      popular: false,
    },
  ];

  return (
    <section
      id="pricing"
      ref={sectionRef}
      className="py-20 sm:py-28 px-6 sm:px-10"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <p className="font-data text-xs text-terracotta uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="font-heading font-extrabold text-charcoal text-3xl sm:text-4xl md:text-5xl tracking-tighter">
            Simple pricing.{' '}
            <span className="font-drama italic text-navy">Real value.</span>
          </h2>
          <p className="text-charcoal/60 mt-4 max-w-lg mx-auto">
            No lock-in contracts. No hidden fees. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`pricing-card rounded-3xl p-6 sm:p-8 flex flex-col transition-all duration-300
                ${plan.popular
                  ? 'bg-navy text-white ring-4 ring-terracotta/30 shadow-2xl scale-[1.02] md:scale-105'
                  : 'bg-cream border border-cream-dark shadow-lg'
                }`}
            >
              {plan.popular && (
                <div className="inline-flex self-start bg-terracotta text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <h3
                className={`font-heading font-bold text-xl ${plan.popular ? 'text-white' : 'text-charcoal'}`}
              >
                {plan.name}
              </h3>
              <p className={`text-sm mt-1 ${plan.popular ? 'text-white/60' : 'text-charcoal/60'}`}>
                {plan.description}
              </p>

              <div className="mt-6 mb-6">
                <span
                  className={`text-4xl sm:text-5xl font-extrabold font-heading tracking-tighter ${plan.popular ? 'text-white' : 'text-charcoal'}`}
                >
                  {plan.price}
                </span>
                <span className={`text-sm ${plan.popular ? 'text-white/60' : 'text-charcoal/50'}`}>
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className={`flex items-start gap-2 text-sm ${plan.popular ? 'text-white/80' : 'text-charcoal/70'}`}
                  >
                    <Check
                      size={16}
                      className={`shrink-0 mt-0.5 ${plan.popular ? 'text-terracotta' : 'text-green-600'}`}
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href="#"
                className={`btn-magnetic block text-center px-6 py-3 rounded-full font-bold text-sm
                  ${plan.popular
                    ? 'bg-terracotta text-white'
                    : 'bg-navy text-white'
                  }`}
              >
                <span className={`btn-bg ${plan.popular ? 'bg-mustard' : 'bg-terracotta'}`}></span>
                <span className="btn-label flex items-center justify-center gap-2">
                  {plan.cta} <ArrowRight size={14} />
                </span>
              </a>
            </div>
          ))}
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
      <Philosophy />
      <Pricing />
      <Footer />
    </div>
  );
}

export default App;
