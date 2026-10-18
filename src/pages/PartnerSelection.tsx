import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, PartyPopper, Music, Wand2, Camera, GraduationCap, Mic, Plus, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function PartnerSelection() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Full list of partner categories preserved for future activation
  const allPartners = [
    { name: 'Caterer', icon: ChefHat, path: '/join', desc: 'Join the food marketplace', active: true },
    { name: 'Decoration Services', icon: PartyPopper, path: '#', desc: 'Event decors & setups', active: false },
    { name: 'Music Services', icon: Music, path: '#', desc: 'DJs & Live bands', active: false },
    { name: 'Photography', icon: Camera, path: '#', desc: 'Capture memories', active: false },
    { name: 'Classes', icon: GraduationCap, path: '#', desc: 'Cooking & baking', active: false },
    { name: 'Magician', icon: Wand2, path: '#', desc: 'Event entertainment', active: false },
    { name: 'Event Host', icon: Mic, path: '#', desc: 'MCs and hosts', active: false },
  ];

  // Currently available service categories for customer-facing display
  const activePartners = allPartners.filter(p => p.name === 'Caterer');

  const handlePartnerClick = (e: React.MouseEvent, path: string, active: boolean) => {
      e.preventDefault();
      if (!active) return;
      
      if (!user) {
          navigate('/login', { state: { from: path } });
      } else {
          navigate(path);
      }
  };

  return (
    <div className="pt-32 pb-20 bg-brand-green-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-brand-green-900 mb-4">Partner with PlanMyChoice</h1>
            <p className="text-brand-green-800/70 max-w-2xl mx-auto text-base sm:text-lg font-poppins">
            Join our premium marketplace and grow your business. Register as an approved caterer to get started.
            </p>
        </div>

        {/* Display only Caterer as the available service category */}
        <div className="max-w-md mx-auto">
          {activePartners.map((p, idx) => (
            <div 
              key={idx} 
              onClick={(e) => handlePartnerClick(e, p.path, p.active)}
              className="rounded-3xl p-8 sm:p-10 border bg-white border-[#DEAA38]/30 shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 group relative overflow-hidden text-center cursor-pointer"
            >
              <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                Active
              </div>
              
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all mx-auto bg-amber-50 text-[#DEAA38] group-hover:scale-110 group-hover:bg-[#DEAA38] group-hover:text-[#051410] shadow-sm">
                <p.icon size={36} />
              </div>
              <h3 className="text-2xl font-bold font-display mb-2.5 text-[#051410]">{p.name}</h3>
              <p className="text-sm text-center font-sans text-slate-500 mb-6">{p.desc}</p>
              
              <div className="flex items-center justify-center gap-2 py-3.5 px-6 bg-[#DEAA38] group-hover:bg-[#c28824] text-[#051410] rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-md">
                <span>Register Now</span>
                <ArrowRight size={15} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
