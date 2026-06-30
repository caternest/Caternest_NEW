import React from 'react';
import { ChefHat, Facebook, Twitter, Instagram, Send, Youtube, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-24 pb-12 border-t border-slate-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
          
          {/* Brand Column */}
          <div className="col-span-1 lg:col-span-3 text-left">
            <Link to="/" className="flex items-center gap-2 group mb-4">
              <div className="bg-brand-gold-500 p-2 rounded-xl text-slate-950 shadow-md">
                <ChefHat size={28} />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white tracking-tight font-display">
                  CaterNest
                </span>
                <span className="text-[9px] uppercase tracking-widest text-brand-gold-500 font-black">
                  Making Every Event Special
                </span>
              </div>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed mb-6 mt-4">
              India's most trusted platform to discover and book premium caterers for every occasion.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Facebook, href: '#' },
                { icon: Instagram, href: '#' },
                { icon: Twitter, href: '#' },
                { icon: Youtube, href: '#' },
                { icon: Linkedin, href: '#' }
              ].map((social, idx) => (
                <a 
                  key={idx} 
                  href={social.href} 
                  className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-brand-gold-500 hover:text-slate-950 hover:border-transparent transition-all text-slate-400"
                >
                  <social.icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="col-span-1 lg:col-span-2 text-left">
            <h4 className="text-white font-extrabold mb-6 font-display text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-3.5 text-xs font-semibold">
              <li><Link to="/" className="hover:text-brand-gold-500 transition-colors">Home</Link></li>
              <li><Link to="/explore" className="hover:text-brand-gold-500 transition-colors">Explore Caterers</Link></li>
              <li><Link to="/" className="hover:text-brand-gold-500 transition-colors">Packages</Link></li>
              <li><Link to="/" className="hover:text-brand-gold-500 transition-colors">Occasions</Link></li>
              <li><Link to="/about" className="hover:text-brand-gold-500 transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* Column 3: For Customers */}
          <div className="col-span-1 lg:col-span-3 text-left">
            <h4 className="text-white font-extrabold mb-6 font-display text-sm uppercase tracking-wider">For Customers</h4>
            <ul className="space-y-3.5 text-xs font-semibold">
              <li><Link to="#" className="hover:text-brand-gold-500 transition-colors">How It Works</Link></li>
              <li><Link to="#" className="hover:text-brand-gold-500 transition-colors">FAQ's</Link></li>
              <li><Link to="#" className="hover:text-brand-gold-500 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="#" className="hover:text-brand-gold-500 transition-colors">Refund Policy</Link></li>
              <li><Link to="/contact" className="hover:text-brand-gold-500 transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Column 4: Newsletter & Payments */}
          <div className="col-span-1 lg:col-span-4 text-left">
            <h4 className="text-white font-extrabold mb-6 font-display text-sm uppercase tracking-wider">Subscribe to our newsletter</h4>
            <p className="text-xs mb-4 text-slate-500 font-medium">Get updates on new caterers, offers & exclusive discounts.</p>
            <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 mb-6">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full bg-transparent px-3 py-2 text-white placeholder-slate-600 focus:outline-none text-xs font-semibold"
              />
              <button type="button" className="bg-brand-gold-500 hover:bg-brand-gold-600 text-slate-950 p-2.5 rounded-lg transition-colors cursor-pointer">
                <Send size={14} />
              </button>
            </div>

            {/* We Accept Payment Badges */}
            <div className="flex items-center gap-3 border-t border-slate-900 pt-6">
              <span className="text-[10px] text-slate-500 font-bold uppercase mr-2">We Accept</span>
              <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded font-black text-slate-200 text-[10px] tracking-widest">VISA</span>
              <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded font-black text-slate-200 text-[10px] tracking-widest">MASTERCARD</span>
              <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded font-black text-slate-200 text-[10px] tracking-widest">UPI</span>
              <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded font-black text-slate-200 text-[10px] tracking-widest">RUPAY</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-600">
          <p className="text-xs font-semibold">
            © {new Date().getFullYear()} CaterNest. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
