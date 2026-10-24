import React from 'react';
import heroBg from '../assets/images/Hero-bg.png';
import { 
  Star, 
  ChefHat, 
  Tag, 
  Calendar, 
  Sparkles,
  Smartphone,
  ArrowRight,
  ShieldCheck,
  Award,
  Clock,
  Camera,
  Music,
  Paintbrush,
  Mic,
  Sparkle,
  Gift,
  Mail,
  Car,
  CheckCircle,
  Clock4,
  Heart
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FFFDFB] font-sans overflow-x-hidden pt-14 sm:pt-[58px]">
      
      {/* 1. DESKTOP HERO BANNER SECTION (Clean & Premium without overlapping card) */}
      <div 
        className="relative min-h-[190px] md:min-h-[215px] w-full flex flex-col justify-center py-5 md:py-6 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(2, 27, 20, 0.92) 0%, rgba(2, 27, 20, 0.82) 28%, rgba(2, 27, 20, 0.55) 55%, rgba(2, 27, 20, 0.20) 75%, rgba(2, 27, 20, 0.00) 100%), url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Real image layer positioned absolutely to bypass sandbox background-image CSS loading issues */}
        <img 
          src={heroBg} 
          alt="Luxury banquet dinner table setting"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0"
        />
        {/* Explicit gradient overlay layer above the image and under the text */}
        <div 
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(2, 27, 20, 0.92) 0%, rgba(2, 27, 20, 0.82) 28%, rgba(2, 27, 20, 0.55) 55%, rgba(2, 27, 20, 0.20) 75%, rgba(2, 27, 20, 0.00) 100%)'
          }}
        />

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-start text-left">
          {/* Text block aligned beautifully with premium typography */}
          <div className="max-w-xl pl-2 sm:pl-4 md:pl-6">
            <h1 
              className="text-[24px] sm:text-[27px] md:text-[30px] font-display text-white tracking-tight leading-[1.12] mb-1 font-bold"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              Everything You Need <br />
              for Your Event in <br />
              <span className="text-[#DEAA38]">
                One Trusted Platform
              </span>
            </h1>
            
            <p className="text-white/80 text-[11.5px] sm:text-xs max-w-lg mb-1 font-sans font-normal leading-relaxed">
              From catering to decor, music to memories, we make every celebration unforgettable.
            </p>
 
            <div className="flex items-center gap-1.5 mb-2.5 text-[10.5px] font-medium text-[#DEAA38]/90">
              <span className="w-[1.5px] h-2.5 bg-[#DEAA38] inline-block"></span>
              <span>One Platform. Many Services. Countless Memories.</span>
            </div>

            {/* Premium CTA Button */}
            <div>
              <Link 
                to="/explore" 
                className="inline-flex items-center gap-1.5 px-4.5 py-1.5 bg-[#DEAA38] hover:bg-[#c28824] text-[#051410] rounded-lg font-bold text-xs tracking-wider transition-all shadow-xs cursor-pointer border border-[#DEAA38]/20"
              >
                <span>Explore Caterers</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* AI Menu Builder Primary Discovery Highlight */}
      <section className="bg-gradient-to-b from-[#FFFDFB] to-slate-50/60 pt-2.5 pb-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#021B1A] via-[#052922] to-[#0A3A34] text-white rounded-xl p-3 sm:p-4 border border-[#DEAA38]/30 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-3 group">
            
            {/* Background luxury glow and decorative motif */}
            <div className="absolute right-[-40px] bottom-[-40px] w-40 h-40 bg-[#DEAA38]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute left-1/4 top-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

            {/* Left Content */}
            <div className="relative z-10 max-w-xl text-left">
              <div className="inline-flex items-center gap-1 bg-[#DEAA38]/20 text-[#DEAA38] border border-[#DEAA38]/35 px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider mb-1">
                <Sparkles size={10} className="text-[#DEAA38]" />
                <span>Featured Smart Tool</span>
              </div>
              <h2 className="text-lg sm:text-xl font-display font-bold text-white tracking-tight mb-1">
                AI Menu <span className="text-[#DEAA38]">Builder</span>
              </h2>
              <p className="text-white/85 text-[11.5px] font-sans font-normal leading-relaxed mb-2 max-w-lg">
                Create the perfect custom menu for your event with intelligent AI recommendations tailored to your guest count and occasion.
              </p>
              
              <div className="flex flex-wrap items-center gap-1.5 text-[9.5px] text-[#E0D4BA] font-medium">
                <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-xs">
                  <CheckCircle size={10} className="text-[#DEAA38]" />
                  <span>Smart Dish Pairings</span>
                </span>
                <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-xs">
                  <CheckCircle size={10} className="text-[#DEAA38]" />
                  <span>Pricing Optimization</span>
                </span>
                <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-xs">
                  <CheckCircle size={10} className="text-[#DEAA38]" />
                  <span>100% Customizable</span>
                </span>
              </div>
            </div>

            {/* Right Action Button */}
            <div className="relative z-10 shrink-0 self-stretch md:self-center flex flex-col sm:flex-row md:flex-col gap-1 justify-center items-center md:items-end">
              <Link
                to="/explore"
                className="w-full sm:w-auto px-4 py-2 bg-[#DEAA38] hover:bg-[#c28824] text-[#051410] rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer group/btn"
              >
                <span>Try Now</span>
                <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
              </Link>
              <span className="text-[9px] text-white/70 tracking-wide text-center">
                Explore caterers & customize packages
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* 2. SERVICES SECTION (Premium showcase of active catering and placeholder coming soon services) */}
      <section className="py-8 md:py-10 border-b border-slate-100" style={{ backgroundColor: '#f2faf4' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="max-w-3xl mx-auto mb-6">
            <span className="text-[#DEAA38] font-bold text-[10px] uppercase tracking-widest bg-[#DEAA38]/10 px-2.5 py-0.5 rounded-full">
              Comprehensive Event Platform
            </span>
            <h2 
              className="text-xl md:text-[22px] font-display font-bold text-slate-900 mt-2 mb-1.5 tracking-tight"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              Explore Our <span className="text-[#DEAA38]">Premium Services</span>
            </h2>
            <p className="text-slate-500 text-xs font-medium">
              We connect you with highly trusted event specialists. Currently Catering is fully active; more curated services are launching soon.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
            
            {/* Catering Services (ACTIVE) */}
            <div 
              onClick={() => navigate('/explore')}
              className="bg-white rounded-xl border-2 border-brand-gold-500/40 hover:border-brand-gold-500 shadow-xs hover:shadow-sm transition-all duration-300 overflow-hidden cursor-pointer group text-left flex flex-col justify-between h-[260px] md:h-[270px]"
            >
              <div className="relative h-28 md:h-30 w-full overflow-hidden bg-slate-100 shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=600"
                  alt="Catering Services"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-2.5 left-2.5 bg-emerald-500 text-white font-extrabold text-[8.5px] uppercase tracking-widest px-2 py-0.5 rounded-full shadow-2xs">
                  ✓ FULLY ACTIVE
                </span>
              </div>
              <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#DEAA38] transition-colors flex items-center gap-1.5">
                    <ChefHat size={16} className="text-[#DEAA38] shrink-0" /> Catering Services
                  </h3>
                  <p className="text-slate-500 text-xs font-medium mt-1 line-clamp-2">
                    Discover verified caterers for weddings, birthdays, corporate events, and every special occasion.
                  </p>
                </div>
                <div className="flex items-center text-xs font-bold text-[#DEAA38] group-hover:underline mt-2">
                  <span>Explore Caterers</span>
                  <ArrowRight size={13} className="ml-1" />
                </div>
              </div>
            </div>

            {/* Decoration Services (COMING SOON) */}
            <div className="bg-slate-50/70 rounded-xl border border-slate-200/60 shadow-2xs transition-all duration-300 overflow-hidden text-left flex flex-col justify-between h-[260px] md:h-[270px] opacity-90 select-none">
              <div className="relative h-28 md:h-30 w-full overflow-hidden bg-slate-200 shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=600"
                  alt="Floral Decoration"
                  className="w-full h-full object-cover grayscale opacity-45"
                />
                <span className="absolute top-2.5 left-2.5 bg-[#DEAA38]/80 text-[#03130e] font-bold text-[8.5px] uppercase tracking-widest px-2 py-0.5 rounded-full">
                  COMING SOON
                </span>
              </div>
              <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-500 flex items-center gap-1.5">
                    <Paintbrush size={16} className="text-slate-400 shrink-0" /> Event Decoration
                  </h3>
                  <p className="text-slate-500 text-xs font-medium mt-1 line-clamp-2">
                    Stunning theme stages, luxurious floral arrangements, and premium lighting.
                  </p>
                </div>
                <div className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest mt-2">
                  Stay Tuned
                </div>
              </div>
            </div>

            {/* Photography Services (COMING SOON) */}
            <div className="bg-slate-50/70 rounded-xl border border-slate-200/60 shadow-2xs transition-all duration-300 overflow-hidden text-left flex flex-col justify-between h-[260px] md:h-[270px] opacity-90 select-none">
              <div className="relative h-28 md:h-30 w-full overflow-hidden bg-slate-200 shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600"
                  alt="Photography"
                  className="w-full h-full object-cover grayscale opacity-45"
                />
                <span className="absolute top-2.5 left-2.5 bg-[#DEAA38]/80 text-[#03130e] font-bold text-[8.5px] uppercase tracking-widest px-2 py-0.5 rounded-full">
                  COMING SOON
                </span>
              </div>
              <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-500 flex items-center gap-1.5">
                    <Camera size={16} className="text-slate-400 shrink-0" /> Photography
                  </h3>
                  <p className="text-slate-500 text-xs font-medium mt-1 line-clamp-2">
                    Candid photoshoots, pre-wedding films, traditional shoots and drone capture.
                  </p>
                </div>
                <div className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest mt-2">
                  Stay Tuned
                </div>
              </div>
            </div>

            {/* Music & DJ Services (COMING SOON) */}
            <div className="bg-slate-50/70 rounded-xl border border-slate-200/60 shadow-2xs transition-all duration-300 overflow-hidden text-left flex flex-col justify-between h-[260px] md:h-[270px] opacity-90 select-none">
              <div className="relative h-28 md:h-30 w-full overflow-hidden bg-slate-200 shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=600"
                  alt="Music & DJ"
                  className="w-full h-full object-cover grayscale opacity-45"
                />
                <span className="absolute top-2.5 left-2.5 bg-[#DEAA38]/80 text-[#03130e] font-bold text-[8.5px] uppercase tracking-widest px-2 py-0.5 rounded-full">
                  COMING SOON
                </span>
              </div>
              <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-500 flex items-center gap-1.5">
                    <Music size={16} className="text-slate-400 shrink-0" /> Music & DJ
                  </h3>
                  <p className="text-slate-500 text-xs font-medium mt-1 line-clamp-2">
                    Professional event sound systems, certified DJs, and acoustic live setups.
                  </p>
                </div>
                <div className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest mt-2">
                  Stay Tuned
                </div>
              </div>
            </div>

            {/* Event Host / MC (COMING SOON) */}
            <div className="bg-slate-50/70 rounded-xl border border-slate-200/60 shadow-2xs transition-all duration-300 overflow-hidden text-left flex flex-col justify-between h-[260px] md:h-[270px] opacity-90 select-none">
              <div className="relative h-28 md:h-30 w-full overflow-hidden bg-slate-200 shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=600"
                  alt="Event Host"
                  className="w-full h-full object-cover grayscale opacity-45"
                />
                <span className="absolute top-2.5 left-2.5 bg-[#DEAA38]/80 text-[#03130e] font-bold text-[8.5px] uppercase tracking-widest px-2 py-0.5 rounded-full">
                  COMING SOON
                </span>
              </div>
              <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-500 flex items-center gap-1.5">
                    <Mic size={16} className="text-slate-400 shrink-0" /> Event Host / MC
                  </h3>
                  <p className="text-slate-500 text-xs font-medium mt-1 line-clamp-2">
                    Charming emcees, live stage coordinators, and crowd engagement hosts.
                  </p>
                </div>
                <div className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest mt-2">
                  Stay Tuned
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. WHY CHOOSE PLANMYCHOICE SECTION (Premium feature cards with luxurious aesthetic layout) */}
      <section className="py-8 md:py-10" style={{ backgroundColor: '#e9f6e3' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="max-w-3xl mx-auto mb-6 sm:mb-8">
            <span className="text-[#DEAA38] font-bold text-[10px] uppercase tracking-widest bg-[#DEAA38]/10 px-2.5 py-0.5 rounded-full">
              Uncompromising Quality
            </span>
            <h2 
              className="text-xl md:text-[22px] font-display font-bold text-slate-900 mt-2 mb-1.5 tracking-tight"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              Why Choose <span className="text-[#DEAA38]">PlanMyChoice</span>
            </h2>
            <p className="text-slate-500 text-xs font-medium">
              We eliminate booking uncertainty to let you focus on what truly matters—celebrating with your loved ones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            
            {/* Card 1: Verified Professionals */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/60 shadow-2xs hover:shadow-xs transition-shadow text-left flex flex-col items-start">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-100/50">
                <ShieldCheck size={20} className="stroke-[1.5]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">Verified Professionals</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                Every vendor listed goes through a detailed background, legal, and quality audit.
              </p>
            </div>

            {/* Card 2: Transparent Pricing */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/60 shadow-2xs hover:shadow-xs transition-shadow text-left flex flex-col items-start">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#DEAA38] flex items-center justify-center mb-3 border border-amber-100/50">
                <Tag size={20} className="stroke-[1.5]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">Transparent Pricing</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                Enjoy transparent rates with no hidden commissions, broker markups, or unexpected add-on costs.
              </p>
            </div>

            {/* Card 3: Easy Booking */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/60 shadow-2xs hover:shadow-xs transition-shadow text-left flex flex-col items-start">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3 border border-sky-100/50">
                <Calendar size={20} className="stroke-[1.5]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">Easy Booking</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                Browse detailed food packages, select customizable add-ons, and book verified slots in under five minutes.
              </p>
            </div>

            {/* Card 4: One Platform */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/60 shadow-2xs hover:shadow-xs transition-shadow text-left flex flex-col items-start">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 border border-purple-100/50">
                <Sparkles size={20} className="stroke-[1.5]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">One Platform</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                Keep your event planning highly organized. Track catering checklists, stage decor status, and photography notes in one place.
              </p>
            </div>

            {/* Card 5: Trusted Reviews */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/60 shadow-2xs hover:shadow-xs transition-shadow text-left flex flex-col items-start">
              <div className="w-10 h-10 rounded-xl bg-[#DEAA38]/10 text-[#DEAA38] flex items-center justify-center mb-3 border border-[#DEAA38]/20">
                <Star size={20} className="stroke-[1.5] fill-[#DEAA38]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">Trusted Reviews</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                Access absolute authentic customer testimonials, star ratings, and real photos shared by hosts of previous events.
              </p>
            </div>

            {/* Card 6: Dedicated Support */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/60 shadow-2xs hover:shadow-xs transition-shadow text-left flex flex-col items-start">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 border border-rose-100/50">
                <Smartphone size={20} className="stroke-[1.5]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">Dedicated Support</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                Our support team and event managers assist you at every step—from selecting menus to ensuring timely service execution on-stage.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Trust Badges row */}
      <section className="py-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {[
              { title: 'Verified & Trusted', desc: 'Only verified & top-rated caterers', icon: ShieldCheck },
              { title: 'Transparent Pricing', desc: 'No hidden charges, clear & honest pricing', icon: Tag },
              { title: 'Instant Quotes', desc: 'Get quotes in just a few minutes', icon: Smartphone },
              { title: '24x7 Support', desc: "We're here to help you anytime", icon: ChefHat }
            ].map((badge, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-3 bg-white rounded-xl border border-slate-100/80 hover:shadow-2xs transition-shadow group">
                <div className="w-9 h-9 rounded-full bg-brand-gold-500/10 text-[#DEAA38] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <badge.icon size={16} className="stroke-[1.5]" />
                </div>
                <h5 className="text-[11px] font-bold text-slate-800 leading-tight mb-0.5">{badge.title}</h5>
                <p className="text-[9px] text-slate-500 font-medium leading-tight">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION (Elegant 4-step premium pipeline with visual connections) */}
      <section className="py-8 md:py-10" style={{ backgroundColor: '#bdd4bd' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="max-w-3xl mx-auto mb-6 sm:mb-8">
            <span className="text-[#DEAA38] font-bold text-[10px] uppercase tracking-widest bg-[#DEAA38]/10 px-2.5 py-0.5 rounded-full">
              Simplified Process
            </span>
            <h2 
              className="text-xl md:text-[22px] font-display font-bold text-slate-900 mt-2 mb-1.5 tracking-tight"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              How It <span className="text-[#DEAA38]">Works</span>
            </h2>
            <p className="text-slate-600 text-xs font-medium">
              We have condensed complicated vendor contracts and food trials into four seamless steps.
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-5 px-4 sm:px-0">
            {/* Visual dashed connector line between steps (Desktop only) */}
            <div className="hidden md:block absolute top-[22px] left-[12%] right-[12%] h-0.5 border-t border-dashed border-slate-400/40 z-0" />

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center group">
              <div className="w-11 h-11 rounded-full bg-[#051410] text-white flex items-center justify-center text-sm font-bold font-display shadow-md border border-[#DEAA38]/30 group-hover:scale-105 transition-transform">
                1
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-950 mt-2.5 mb-1 uppercase tracking-wide">Choose Service</h3>
              <p className="text-slate-600 text-[11px] sm:text-xs font-medium leading-relaxed max-w-[180px]">
                Select gourmet catering and input your event's venue, date, guest count, and starting budget.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center group">
              <div className="w-11 h-11 rounded-full bg-[#051410] text-white flex items-center justify-center text-sm font-bold font-display shadow-md border border-[#DEAA38]/30 group-hover:scale-105 transition-transform">
                2
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-950 mt-2.5 mb-1 uppercase tracking-wide">Select Vendor</h3>
              <p className="text-slate-600 text-[11px] sm:text-xs font-medium leading-relaxed max-w-[180px]">
                Compare packages, customize dishes from digital menu cards, and view verified customer reviews.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center group">
              <div className="w-11 h-11 rounded-full bg-[#051410] text-white flex items-center justify-center text-sm font-bold font-display shadow-md border border-[#DEAA38]/30 group-hover:scale-105 transition-transform">
                3
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-950 mt-2.5 mb-1 uppercase tracking-wide">Book Easily</h3>
              <p className="text-slate-600 text-[11px] sm:text-xs font-medium leading-relaxed max-w-[180px]">
                Finalize customization items, lock-in transparent plate costs, and secure your event date.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative z-10 flex flex-col items-center group">
              <div className="w-11 h-11 rounded-full bg-[#DEAA38] text-[#03130e] flex items-center justify-center text-sm font-bold font-display shadow-md border border-[#DEAA38]/20 group-hover:scale-105 transition-transform">
                4
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-950 mt-2.5 mb-1 uppercase tracking-wide text-[#8C6D1F]">Celebrate</h3>
              <p className="text-slate-600 text-[11px] sm:text-xs font-medium leading-relaxed max-w-[180px]">
                Relax as our verified experts execute your customized menu and services with immaculate excellence.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 5. COMING SOON SERVICES SECTION (Polished placeholder cards displaying Coming Soon only) */}
      <section className="py-8 md:py-10 border-t border-b border-slate-200/50" style={{ backgroundColor: '#d1e1d2' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="max-w-3xl mx-auto mb-6 sm:mb-8">
            <span className="text-[#DEAA38] font-bold text-[10px] uppercase tracking-widest bg-[#DEAA38]/10 px-2.5 py-0.5 rounded-full">
              Future Extensions
            </span>
            <h2 
              className="text-xl md:text-[22px] font-display font-bold text-slate-900 mt-2 mb-1.5 tracking-tight"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              Launching <span className="text-[#DEAA38]">Soon</span>
            </h2>
            <p className="text-slate-600 text-xs font-medium">
              We are expanding to bring a comprehensive fleet of verified service artists to your celebrations.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
            
            {[
              { title: 'Mehendi Artist', icon: Paintbrush, bg: 'from-emerald-500/5 to-transparent' },
              { title: 'Makeup Artist', icon: Sparkle, bg: 'from-pink-500/5 to-transparent' },
              { title: 'Wedding Planner', icon: Heart, bg: 'from-rose-500/5 to-transparent' },
              { title: 'Invitation Cards', icon: Mail, bg: 'from-indigo-500/5 to-transparent' },
              { title: 'Return Gifts', icon: Gift, bg: 'from-amber-500/5 to-transparent' },
              { title: 'Transport Services', icon: Car, bg: 'from-blue-500/5 to-transparent' },
              { title: 'Magician & Illusionist', icon: Sparkles, bg: 'from-purple-500/5 to-transparent' },
              { title: 'Live Music Bands', icon: Music, bg: 'from-red-500/5 to-transparent' }
            ].map((srv, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/60 shadow-2xs relative overflow-hidden flex flex-col items-center justify-center text-center h-32 sm:h-36 group hover:shadow-xs transition-shadow select-none"
              >
                {/* Visual glow background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${srv.bg} opacity-100 z-0`} />
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform border border-slate-100 shadow-2xs">
                    <srv.icon size={16} className="stroke-[1.5]" />
                  </div>
                  <h4 className="text-xs sm:text-[13px] font-bold text-slate-700">{srv.title}</h4>
                  <span className="mt-1.5 inline-block px-2 py-0.5 text-[7.5px] font-bold tracking-widest uppercase bg-slate-100 text-slate-500 rounded-full border border-slate-200">
                    COMING SOON
                  </span>
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* 6. PARTNER PROMOTION & APP DOWNLOAD SECTION */}
      <section className="py-8 md:py-10" style={{ backgroundColor: '#d6f4e6' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            
            {/* Promo Card 1: Become Catering Partner */}
            <div className="bg-gradient-to-br from-[#051410] to-[#0f2922] text-white rounded-2xl p-5 md:p-6 flex flex-col justify-between min-h-[220px] relative overflow-hidden group border border-slate-800 shadow-sm">
              <div className="absolute right-[-20px] bottom-[-20px] w-40 h-40 opacity-15 group-hover:opacity-25 transition-opacity pointer-events-none">
                <img 
                  src="https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=400" 
                  alt="Premium Chef Kitchen" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="relative z-10 max-w-sm">
                <span className="bg-[#DEAA38]/20 text-[#DEAA38] border border-[#DEAA38]/20 px-2.5 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-widest inline-block mb-2">
                  Catering Network
                </span>
                <h3 className="text-lg sm:text-xl font-display font-extrabold tracking-tight mb-2 text-white">
                  Become a Catering Partner
                </h3>
                <p className="text-slate-300 text-xs sm:text-[12.5px] font-medium leading-relaxed mb-4">
                  List your kitchens, showcase your menus and start receiving high-volume bookings for premium events across Hyderabad.
                </p>
              </div>
              <Link 
                to="/partner-selection" 
                className="relative z-10 self-start py-2 px-4 bg-[#DEAA38] hover:bg-[#c28824] text-[#051410] rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Register Your Kitchen</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Promo Card 2: Download App (Coming Soon) */}
            <div className="bg-slate-50 border border-slate-200/80 text-slate-900 rounded-2xl p-5 md:p-6 flex flex-col justify-between min-h-[220px] relative overflow-hidden group shadow-sm">
              <div className="absolute right-[-10px] bottom-[-10px] w-32 h-36 opacity-30 group-hover:opacity-40 transition-opacity flex items-end pointer-events-none">
                <div className="border-[3px] border-slate-950 rounded-lg w-full h-28 bg-slate-900 overflow-hidden relative shadow-2xs">
                  <div className="bg-[#DEAA38] h-1 w-8 mx-auto mt-1 rounded-full" />
                  <div className="p-1.5 text-[5px] text-white font-black">PlanMyChoice App</div>
                </div>
              </div>
              <div className="relative z-10 max-w-sm">
                <span className="bg-[#DEAA38]/15 text-[#886C1D] border border-[#DEAA38]/30 px-2.5 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-widest inline-flex items-center gap-1 mb-2">
                  <Clock size={10} className="text-[#DEAA38]" /> Coming Soon
                </span>
                <h3 className="text-lg sm:text-xl font-display font-extrabold tracking-tight mb-2 text-slate-900">
                  Download App
                </h3>
                <p className="text-slate-500 text-xs sm:text-[12.5px] font-medium leading-relaxed mb-4">
                  Book premium caterers, customize dishes, and track your events seamlessly on the go.
                </p>
              </div>
              
              {/* Coming Soon status box - No fake store buttons */}
              <div className="relative z-10 self-start flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <Smartphone size={14} className="text-[#DEAA38]" />
                <span className="text-[11px] font-bold text-slate-700">iOS & Android App Launching Soon</span>
              </div>
            </div>

            {/* Promo Card 3: Become Service Partner */}
            <div className="bg-gradient-to-br from-[#0f2922] to-[#051410] text-white rounded-2xl p-5 md:p-6 flex flex-col justify-between min-h-[220px] relative overflow-hidden group border border-slate-800 shadow-sm">
              <div className="absolute right-[-20px] bottom-[-20px] w-40 h-40 opacity-15 group-hover:opacity-25 transition-opacity pointer-events-none">
                <img 
                  src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=400" 
                  alt="Event decoration showcase" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="relative z-10 max-w-sm">
                <span className="bg-[#DEAA38]/20 text-[#DEAA38] border border-[#DEAA38]/20 px-2.5 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-widest inline-block mb-2">
                  Service Fleet
                </span>
                <h3 className="text-lg sm:text-xl font-display font-extrabold tracking-tight mb-2 text-white">
                  Become an Event Partner
                </h3>
                <p className="text-slate-300 text-xs sm:text-[12.5px] font-medium leading-relaxed mb-4">
                  Are you a professional decorator, photographer, planner, or stage emcee? Secure certified bookings through PlanMyChoice.
                </p>
              </div>
              <Link 
                to="/partner-selection" 
                className="relative z-10 self-start py-2 px-4 bg-white hover:bg-slate-50 text-[#051410] rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Register Your Service</span>
                <ArrowRight size={13} />
              </Link>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
