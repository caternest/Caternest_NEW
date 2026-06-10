import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, PartyPopper, Music, Wand2, Camera, GraduationCap, Mic, Plus, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function PartnerSelection() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const partners = [
    { name: 'Caterer', icon: ChefHat, path: '/join', desc: 'Join the food marketplace', active: true },
    { name: 'Decoration Services', icon: PartyPopper, path: '#', desc: 'Event decors & setups', active: false },
    { name: 'Music Services', icon: Music, path: '#', desc: 'DJs & Live bands', active: false },
    { name: 'Photography', icon: Camera, path: '#', desc: 'Capture memories', active: false },
    { name: 'Classes', icon: GraduationCap, path: '#', desc: 'Cooking & baking', active: false },
    { name: 'Magician', icon: Wand2, path: '#', desc: 'Event entertainment', active: false },
    { name: 'Event Host', icon: Mic, path: '#', desc: 'MCs and hosts', active: false },
  ];

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
        <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-brand-green-900 mb-4">Partner with CaterNest</h1>
            <p className="text-brand-green-800/70 mb-12 max-w-2xl mx-auto text-lg font-poppins">
            Join our premium marketplace and grow your business. Select your service category to get started.
            </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
           {partners.map((p, idx) => (
            <div 
              key={idx} 
              onClick={(e) => handlePartnerClick(e, p.path, p.active)}
              className={cn(
                  "rounded-3xl p-8 border flex flex-col items-center hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group relative overflow-hidden text-center",
                  p.active ? "bg-white border-brand-gold-200 shadow-md shadow-brand-gold-900/5 cursor-pointer" : "bg-slate-50 border-slate-200 opacity-80 cursor-default grayscale-[0.6]"
              )}
            >
              {!p.active && (
                  <div className="absolute top-4 right-4 bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">
                      Coming Soon
                  </div>
              )}
              {p.active && (
                  <div className="absolute top-4 right-4 bg-brand-green-100 text-brand-green-800 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">
                      Active
                  </div>
              )}
              
              <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-all",
                  p.active ? "bg-brand-gold-50 text-brand-gold-600 group-hover:scale-110 group-hover:bg-brand-gold-500 group-hover:text-white" : "bg-slate-200 text-slate-500"
              )}>
                <p.icon size={32} />
              </div>
              <h3 className={cn("text-xl font-bold font-display mb-2", p.active ? "text-brand-green-900" : "text-slate-700")}>{p.name}</h3>
              <p className={cn("text-sm text-center font-poppins", p.active ? "text-brand-green-800/60" : "text-slate-500")}>{p.desc}</p>
              
              {p.active && (
                  <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-brand-gold-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Register Now <ArrowRight size={16} />
                  </div>
              )}
            </div>
          ))}

          {/* Coming Soon */}
          <div className="bg-brand-green-100/30 rounded-3xl p-8 border border-brand-green-200 border-dashed flex flex-col items-center justify-center opacity-70">
            <div className="w-16 h-16 bg-brand-green-100 text-brand-green-600 rounded-full flex items-center justify-center mb-6">
              <Plus size={32} />
            </div>
            <h3 className="text-xl font-bold font-display text-brand-green-900 mb-2">More coming soon</h3>
            <p className="text-sm text-brand-green-800/60 text-center font-poppins">New services</p>
          </div>
        </div>
      </div>
    </div>
  );
}
