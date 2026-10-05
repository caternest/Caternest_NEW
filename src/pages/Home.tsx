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
    <div className="min-h-screen bg-[#FFFDFB] font-sans overflow-x-hidden">
      
      {/* 1. DESKTOP HERO BANNER SECTION (Clean & Premium without overlapping card) */}
      <div 
        className="relative min-h-[480px] md:min-h-[520px] w-full flex flex-col justify-center py-20 md:py-28 overflow-hidden"
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

        <div 
          className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-start text-left"
          style={{ marginBottom: '1px', paddingBottom: '0px' }}
        >
          
          {/* Text block aligned beautifully with premium typography */}
          <div 
            className="max-w-xl pt-2 md:pt-4 pl-4 sm:pl-8 md:pl-12 lg:pl-16"
            style={{ marginTop: '20px', paddingLeft: '66px' }}
          >
            <h1 
              className="text-[2.2rem] md:text-[3.2rem] font-display text-white tracking-tight leading-[1.12] mb-5 font-bold"
              style={{ 
                fontFamily: 'Playfair Display, Georgia, serif', 
                fontSize: '47.2px',
                paddingBottom: '0px',
                lineHeight: '55.864px'
              }}
            >
              Everything You Need <br />
              for Your Event in <br />
              <span 
                className="text-[#DEAA38]"
                style={{
                  marginBottom: '0px',
                  paddingBottom: '0px',
                  marginTop: '1px',
                  paddingTop: '-2px'
                }}
              >
                One Trusted Platform
              </span>
            </h1>
            
            <p className="text-white/80 text-sm sm:text-[14px] max-w-xl mb-4 font-sans font-normal leading-relaxed">
              From catering to decor, music to memories, we make every celebration unforgettable.
            </p>
 
            <div className="flex items-center gap-2 mb-6 text-xs sm:text-[13px] font-medium text-[#DEAA38]/90">
              <span className="w-[1.5px] h-3.5 bg-[#DEAA38] inline-block"></span>
              <span>One Platform. Many Services. Countless Memories.</span>
            </div>

            {/* Premium CTA Button */}
            <div className="pt-1">
              <Link 
                to="/explore" 
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#DEAA38] hover:bg-[#c28824] text-[#051410] rounded-xl font-bold text-xs tracking-wider transition-all shadow-md cursor-pointer border border-[#DEAA38]/20"
              >
                <span>Explore Caterers</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* 2. SERVICES SECTION (Premium showcase of active catering and placeholder coming soon services) */}
      <section className="py-16 md:py-20 border-b border-slate-100" style={{ backgroundColor: '#f2faf4' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="max-w-3xl mx-auto mb-12">
            <span className="text-[#DEAA38] font-bold text-xs uppercase tracking-widest bg-[#DEAA38]/10 px-3 py-1 rounded-full">
              Comprehensive Event Platform
            </span>
            <h2 
              className="text-3xl md:text-4xl font-display font-bold text-slate-900 mt-3 mb-4 tracking-tight"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              Explore Our <span className="text-[#DEAA38]">Premium Services</span>
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              We connect you with highly trusted event specialists. Currently Catering is fully active; more curated services are launching soon.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            
            {/* Catering Services (ACTIVE) */}
            <div 
              onClick={() => navigate('/explore')}
              className="bg-white rounded-[2rem] border-2 border-brand-gold-500/40 hover:border-brand-gold-500 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group text-left flex flex-col justify-between h-[360px]"
            >
              <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                <img 
                  src="https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=600"
                  alt="Catering Services"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 bg-emerald-500 text-white font-extrabold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full shadow-xs">
                  ✓ FULLY ACTIVE
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#DEAA38] transition-colors flex items-center gap-1.5">
                    <ChefHat size={18} className="text-[#DEAA38]" /> Catering Services
                  </h3>
                  <p className="text-slate-400 text-xs font-semibold mt-1.5 line-clamp-2">
                    Discover verified caterers for weddings, birthdays, corporate events, housewarmings, engagements, and every special occasion.
                  </p>
                </div>
                <div className="flex items-center text-xs font-bold text-[#DEAA38] group-hover:underline mt-4">
                  <span>Explore Caterers</span>
                  <ArrowRight size={14} className="ml-1" />
                </div>
              </div>
            </div>

            {/* Decoration Services (COMING SOON) */}
            <div className="bg-slate-50/70 rounded-[2rem] border border-slate-200/60 shadow-xs hover:shadow-sm transition-all duration-300 overflow-hidden text-left flex flex-col justify-between h-[360px] opacity-90 select-none">
              <div className="relative h-44 w-full overflow-hidden bg-slate-200">
                <img 
                  src="https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=600"
                  alt="Floral Decoration"
                  className="w-full h-full object-cover grayscale opacity-45"
                />
                <span className="absolute top-4 left-4 bg-[#DEAA38]/80 text-[#03130e] font-bold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full">
                  COMING SOON
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-500 flex items-center gap-1.5">
                    <Paintbrush size={18} className="text-slate-400" /> Event Decoration
                  </h3>
                  <p className="text-slate-400 text-xs font-semibold mt-1.5 line-clamp-2">
                    Stunning theme stages, luxurious floral arrangements, and premium lighting.
                  </p>
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">
                  Stay Tuned
                </div>
              </div>
            </div>

            {/* Photography Services (COMING SOON) */}
            <div className="bg-slate-50/70 rounded-[2rem] border border-slate-200/60 shadow-xs hover:shadow-sm transition-all duration-300 overflow-hidden text-left flex flex-col justify-between h-[360px] opacity-90 select-none">
              <div className="relative h-44 w-full overflow-hidden bg-slate-200">
                <img 
                  src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600"
                  alt="Photography"
                  className="w-full h-full object-cover grayscale opacity-45"
                />
                <span className="absolute top-4 left-4 bg-[#DEAA38]/80 text-[#03130e] font-bold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full">
                  COMING SOON
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-500 flex items-center gap-1.5">
                    <Camera size={18} className="text-slate-400" /> Photography
                  </h3>
                  <p className="text-slate-400 text-xs font-semibold mt-1.5 line-clamp-2">
                    Candid photoshoots, pre-wedding films, traditional shoots and drone capture.
                  </p>
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">
                  Stay Tuned
                </div>
              </div>
            </div>

            {/* Music & DJ Services (COMING SOON) */}
            <div className="bg-slate-50/70 rounded-[2rem] border border-slate-200/60 shadow-xs hover:shadow-sm transition-all duration-300 overflow-hidden text-left flex flex-col justify-between h-[360px] opacity-90 select-none">
              <div className="relative h-44 w-full overflow-hidden bg-slate-200">
                <img 
                  src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=600"
                  alt="Music & DJ"
                  className="w-full h-full object-cover grayscale opacity-45"
                />
                <span className="absolute top-4 left-4 bg-[#DEAA38]/80 text-[#03130e] font-bold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full">
                  COMING SOON
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-500 flex items-center gap-1.5">
                    <Music size={18} className="text-slate-400" /> Music & DJ
                  </h3>
                  <p className="text-slate-400 text-xs font-semibold mt-1.5 line-clamp-2">
                    Professional event sound systems, certified DJs, and acoustic live setups.
                  </p>
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">
                  Stay Tuned
                </div>
              </div>
            </div>

            {/* Event Host / MC (COMING SOON) */}
            <div className="bg-slate-50/70 rounded-[2rem] border border-slate-200/60 shadow-xs hover:shadow-sm transition-all duration-300 overflow-hidden text-left flex flex-col justify-between h-[360px] opacity-90 select-none">
              <div className="relative h-44 w-full overflow-hidden bg-slate-200">
                <img 
                  src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=600"
                  alt="Event Host"
                  className="w-full h-full object-cover grayscale opacity-45"
                />
                <span className="absolute top-4 left-4 bg-[#DEAA38]/80 text-[#03130e] font-bold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full">
                  COMING SOON
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-500 flex items-center gap-1.5">
                    <Mic size={18} className="text-slate-400" /> Event Host / MC
                  </h3>
                  <p className="text-slate-400 text-xs font-semibold mt-1.5 line-clamp-2">
                    Charming emcees, live stage coordinators, and crowd engagement hosts.
                  </p>
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">
                  Stay Tuned
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. WHY CHOOSE PLANMYCHOICE SECTION (Premium feature cards with luxurious aesthetic layout) */}
      <section className="py-16" style={{ backgroundColor: '#e9f6e3' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center" style={{ marginTop: '-50px' }}>
          
          <div className="max-w-3xl mx-auto mb-14">
            <span className="text-[#DEAA38] font-bold text-xs uppercase tracking-widest">
              Uncompromising Quality
            </span>
            <h2 
              className="text-3xl md:text-4xl font-display font-bold text-slate-900 mt-2.5 mb-4 tracking-tight"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              Why Choose <span className="text-[#DEAA38]">PlanMyChoice</span>
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              We eliminate booking uncertainty to let you focus on what truly matters—celebrating with your loved ones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Card 1: Verified Professionals */}
            <div className="bg-white p-7 rounded-[2rem] border border-slate-200/50 shadow-xs hover:shadow-md transition-shadow text-left flex flex-col items-start">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 border border-emerald-100/50">
                <ShieldCheck size={24} className="stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Verified Professionals</h3>
              <p className="text-slate-400 text-xs sm:text-[13px] leading-relaxed font-medium">
                Every vendor listed goes through a detailed background, legal, and quality audit including food hygiene standards.
              </p>
            </div>

            {/* Card 2: Transparent Pricing */}
            <div className="bg-white p-7 rounded-[2rem] border border-slate-200/50 shadow-xs hover:shadow-md transition-shadow text-left flex flex-col items-start">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#DEAA38] flex items-center justify-center mb-5 border border-amber-100/50">
                <Tag size={24} className="stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Transparent Pricing</h3>
              <p className="text-slate-400 text-xs sm:text-[13px] leading-relaxed font-medium">
                Enjoy transparent rates with no hidden commissions, broker markups, or unexpected add-on costs.
              </p>
            </div>

            {/* Card 3: Easy Booking */}
            <div className="bg-white p-7 rounded-[2rem] border border-slate-200/50 shadow-xs hover:shadow-md transition-shadow text-left flex flex-col items-start">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-5 border border-sky-100/50">
                <Calendar size={24} className="stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Easy Booking</h3>
              <p className="text-slate-400 text-xs sm:text-[13px] leading-relaxed font-medium">
                Browse detailed food packages, select customizable add-ons, and book verified slots in under five minutes.
              </p>
            </div>

            {/* Card 4: One Platform */}
            <div className="bg-white p-7 rounded-[2rem] border border-slate-200/50 shadow-xs hover:shadow-md transition-shadow text-left flex flex-col items-start">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5 border border-purple-100/50">
                <Sparkles size={24} className="stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">One Platform</h3>
              <p className="text-slate-400 text-xs sm:text-[13px] leading-relaxed font-medium">
                Keep your event planning highly organized. Track catering checklists, stage decor status, and photography notes in one place.
              </p>
            </div>

            {/* Card 5: Trusted Reviews */}
            <div className="bg-white p-7 rounded-[2rem] border border-slate-200/50 shadow-xs hover:shadow-md transition-shadow text-left flex flex-col items-start">
              <div className="w-12 h-12 rounded-2xl bg-[#DEAA38]/10 text-[#DEAA38] flex items-center justify-center mb-5 border border-[#DEAA38]/20">
                <Star size={24} className="stroke-[1.5] fill-[#DEAA38]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Trusted Reviews</h3>
              <p className="text-slate-400 text-xs sm:text-[13px] leading-relaxed font-medium">
                Access absolute authentic customer testimonials, star ratings, and real photos shared by hosts of previous events.
              </p>
            </div>

            {/* Card 6: Dedicated Support */}
            <div className="bg-white p-7 rounded-[2rem] border border-slate-200/50 shadow-xs hover:shadow-md transition-shadow text-left flex flex-col items-start">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-5 border border-rose-100/50">
                <Smartphone size={24} className="stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Dedicated Support</h3>
              <p className="text-slate-400 text-xs sm:text-[13px] leading-relaxed font-medium">
                Our support team and event managers assist you at every step—from selecting menus to ensuring timely service execution on-stage.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION (Elegant 4-step premium pipeline with visual connections) */}
      <section className="py-16" style={{ backgroundColor: '#bdd4bd' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center" style={{ marginTop: '-49px' }}>
          
          <div className="max-w-3xl mx-auto mb-16">
            <span className="text-[#DEAA38] font-bold text-xs uppercase tracking-widest bg-[#DEAA38]/10 px-3 py-1 rounded-full">
              Simplified Process
            </span>
            <h2 
              className="text-3xl md:text-4xl font-display font-bold text-slate-900 mt-3 mb-4 tracking-tight"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              How It <span className="text-[#DEAA38]">Works</span>
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              We have condensed complicated vendor contracts and food trials into four seamless steps.
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8 px-4 sm:px-0">
            {/* Visual dashed connector line between steps (Desktop only) */}
            <div className="hidden md:block absolute top-[44px] left-[12%] right-[12%] h-0.5 border-t border-dashed border-slate-200 z-0" />

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center group">
              <div className="w-16 h-16 rounded-full bg-[#051410] text-white flex items-center justify-center text-xl font-bold font-display shadow-lg border border-[#DEAA38]/30 group-hover:scale-105 transition-transform">
                1
              </div>
              <h3 className="text-base font-bold text-slate-950 mt-4 mb-1.5 uppercase tracking-wide">Choose Service</h3>
              <p className="text-slate-400 text-xs font-semibold leading-relaxed max-w-[180px]">
                Select gourmet catering and input your event's venue, date, guest count, and starting budget.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center group">
              <div className="w-16 h-16 rounded-full bg-[#051410] text-white flex items-center justify-center text-xl font-bold font-display shadow-lg border border-[#DEAA38]/30 group-hover:scale-105 transition-transform">
                2
              </div>
              <h3 className="text-base font-bold text-slate-950 mt-4 mb-1.5 uppercase tracking-wide">Select Vendor</h3>
              <p className="text-slate-400 text-xs font-semibold leading-relaxed max-w-[180px]">
                Compare packages, customize dishes from digital menu cards, and view verified customer reviews.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center group">
              <div className="w-16 h-16 rounded-full bg-[#051410] text-white flex items-center justify-center text-xl font-bold font-display shadow-lg border border-[#DEAA38]/30 group-hover:scale-105 transition-transform">
                3
              </div>
              <h3 className="text-base font-bold text-slate-950 mt-4 mb-1.5 uppercase tracking-wide">Book Easily</h3>
              <p className="text-slate-400 text-xs font-semibold leading-relaxed max-w-[180px]">
                Finalize customization items, lock-in transparent plate costs, and secure your event date.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative z-10 flex flex-col items-center group">
              <div className="w-16 h-16 rounded-full bg-[#DEAA38] text-[#03130e] flex items-center justify-center text-xl font-bold font-display shadow-lg border border-[#DEAA38]/20 group-hover:scale-105 transition-transform">
                4
              </div>
              <h3 className="text-base font-bold text-slate-950 mt-4 mb-1.5 uppercase tracking-wide text-[#DEAA38]">Celebrate</h3>
              <p className="text-slate-400 text-xs font-semibold leading-relaxed max-w-[180px]">
                Relax as our verified experts execute your customized menu and services with immaculate hygiene.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 5. COMING SOON SERVICES SECTION (Polished placeholder cards displaying Coming Soon only) */}
      <section className="py-16 border-t border-b border-slate-200/50" style={{ backgroundColor: '#d1e1d2' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center" style={{ marginTop: '-53px' }}>
          
          <div className="max-w-3xl mx-auto mb-12">
            <span className="text-[#DEAA38] font-bold text-xs uppercase tracking-widest bg-[#DEAA38]/10 px-3 py-1 rounded-full">
              Future Extensions
            </span>
            <h2 
              className="text-3xl md:text-4xl font-display font-bold text-slate-900 mt-3 mb-4 tracking-tight"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              Launching <span className="text-[#DEAA38]">Soon</span>
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              We are expanding to bring a comprehensive fleet of verified service artists to your celebrations.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            
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
                className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-xs relative overflow-hidden flex flex-col items-center justify-center text-center h-44 group hover:shadow-md transition-shadow select-none"
              >
                {/* Visual glow background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${srv.bg} opacity-100 z-0`} />
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-slate-100 shadow-2xs">
                    <srv.icon size={20} className="stroke-[1.5]" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-700">{srv.title}</h4>
                  <span className="mt-2 inline-block px-2.5 py-0.5 text-[8px] font-black tracking-widest uppercase bg-slate-100 text-slate-400 rounded-full border border-slate-200">
                    COMING SOON
                  </span>
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* 6. PARTNER PROMOTION SECTION (Premium promotional callouts for business signups) */}
      <section className="py-16" style={{ backgroundColor: '#d6f4e6' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Promo Card 1: Become Catering Partner */}
            <div className="bg-gradient-to-br from-[#051410] to-[#0f2922] text-white rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between min-h-[300px] relative overflow-hidden group border border-slate-800 shadow-xl">
              <div className="absolute right-[-20px] bottom-[-20px] w-48 h-48 opacity-15 group-hover:opacity-25 transition-opacity pointer-events-none">
                <img 
                  src="https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=400" 
                  alt="Premium Chef Kitchen" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="relative z-10 max-w-sm">
                <span className="bg-[#DEAA38]/20 text-[#DEAA38] border border-[#DEAA38]/20 px-3.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block mb-3">
                  Catering Network
                </span>
                <h3 className="text-2xl font-display font-extrabold tracking-tight mb-2.5 text-white">
                  Become a Catering Partner
                </h3>
                <p className="text-slate-300 text-xs sm:text-[13px] font-medium leading-relaxed mb-6">
                  List your kitchens, showcase your menus and start receiving high-volume bookings for premium events across Hyderabad.
                </p>
              </div>
              <Link 
                to="/partner-selection" 
                className="relative z-10 self-start py-3 px-6 bg-[#DEAA38] hover:bg-[#c28824] text-[#051410] rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>Register Your Kitchen</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Promo Card 2: Become Service Partner */}
            <div className="bg-gradient-to-br from-[#0f2922] to-[#051410] text-white rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between min-h-[300px] relative overflow-hidden group border border-slate-800 shadow-xl">
              <div className="absolute right-[-20px] bottom-[-20px] w-48 h-48 opacity-15 group-hover:opacity-25 transition-opacity pointer-events-none">
                <img 
                  src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=400" 
                  alt="Event decoration showcase" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="relative z-10 max-w-sm">
                <span className="bg-[#DEAA38]/20 text-[#DEAA38] border border-[#DEAA38]/20 px-3.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block mb-3">
                  Service Fleet
                </span>
                <h3 className="text-2xl font-display font-extrabold tracking-tight mb-2.5 text-white">
                  Become an Event Partner
                </h3>
                <p className="text-slate-300 text-xs sm:text-[13px] font-medium leading-relaxed mb-6">
                  Are you a professional decorator, photographer, planner, or stage emcee? Secure certified bookings through PlanMyChoice.
                </p>
              </div>
              <Link 
                to="/partner-selection" 
                className="relative z-10 self-start py-3 px-6 bg-white hover:bg-slate-50 text-[#051410] rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>Register Your Service</span>
                <ArrowRight size={14} />
              </Link>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
