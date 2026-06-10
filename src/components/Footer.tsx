import React from 'react';
import { ChefHat, Facebook, Twitter, Instagram, Mail, Phone, MapPin, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-brand-green-900 text-brand-green-100/70 pt-20 pb-10 border-t-4 border-brand-gold-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-1 lg:col-span-3">
            <Link to="/" className="flex items-center gap-3 group mb-4">
              <div className="bg-brand-gold-500 p-2 rounded-xl text-white">
                <ChefHat size={32} />
              </div>
              <div className="flex flex-col border-l-2 border-brand-green-800 pl-3">
                <span className="text-3xl font-bold font-display text-white tracking-tight">
                  CaterNest
                </span>
              </div>
            </Link>
            <span className="text-[10px] uppercase font-poppins tracking-widest text-brand-gold-500 font-semibold mb-6 block">
              Making Every Event Special
            </span>
            <p className="text-brand-green-100/60 mb-6 leading-relaxed text-sm">
              Your one-stop platform to discover and book premium caterers for every occasion.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-brand-green-800 flex items-center justify-center hover:bg-brand-gold-500 hover:text-white transition-colors text-brand-gold-100">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-brand-green-800 flex items-center justify-center hover:bg-brand-gold-500 hover:text-white transition-colors text-brand-gold-100">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-brand-green-800 flex items-center justify-center hover:bg-brand-gold-500 hover:text-white transition-colors text-brand-gold-100">
                <Twitter size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1 lg:col-span-2">
            <h4 className="text-white font-semibold mb-6 font-display text-lg">Quick Links</h4>
            <ul className="space-y-4 text-sm font-poppins">
              <li><Link to="/" className="hover:text-brand-gold-400 transition-colors">Home</Link></li>
              <li><Link to="/explore" className="hover:text-brand-gold-400 transition-colors">Explore Caterers</Link></li>
              <li><Link to="/about" className="hover:text-brand-gold-400 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-brand-gold-400 transition-colors">Contact Us</Link></li>
              <li><Link to="/partner-selection" className="hover:text-brand-gold-400 transition-colors">Become a Partner</Link></li>
            </ul>
          </div>

          {/* For Customers */}
          <div className="col-span-1 lg:col-span-3">
            <h4 className="text-white font-semibold mb-6 font-display text-lg">For Customers</h4>
            <ul className="space-y-4 text-sm font-poppins">
              <li><Link to="#" className="hover:text-brand-gold-400 transition-colors">How It Works</Link></li>
              <li><Link to="/orders" className="hover:text-brand-gold-400 transition-colors">My Orders</Link></li>
              <li><Link to="#" className="hover:text-brand-gold-400 transition-colors">FAQs</Link></li>
              <li><Link to="#" className="hover:text-brand-gold-400 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="#" className="hover:text-brand-gold-400 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-1 lg:col-span-4">
            <h4 className="text-white font-semibold mb-6 font-display text-lg">Newsletter</h4>
            <p className="text-sm mb-4 text-brand-green-100/60 font-poppins">Subscribe to get updates on new caterers and exciting offers.</p>
            <div className="flex bg-white/5 rounded-xl border border-white/10 p-1 mb-8">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full bg-transparent px-4 py-2 text-white placeholder-brand-green-100/40 focus:outline-none text-sm font-poppins"
              />
              <button className="bg-brand-gold-500 hover:bg-brand-gold-600 text-white p-3 rounded-lg transition-colors">
                <Send size={18} />
              </button>
            </div>

            {/* Payment Icons */}
            <div className="flex items-center gap-4 border-t border-brand-green-800 pt-6">
              <span className="bg-white px-3 py-1.5 rounded-md font-bold text-blue-900 text-xs tracking-wider">VISA</span>
              <span className="bg-white px-3 py-1.5 rounded-md font-bold text-red-600 text-xs tracking-wider flex items-center">
                <span className="w-3 h-3 rounded-full bg-red-600 mr-[-4px]"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500 mix-blend-multiply"></span>
                <span className="ml-1 text-[10px]">MasterCard</span>
              </span>
              <span className="bg-white px-3 py-1.5 rounded-md font-bold text-slate-800 text-xs tracking-wider italic font-serif">UPI</span>
            </div>
          </div>
        </div>

        <div className="border-t border-brand-green-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-brand-green-100/50 text-sm font-poppins">
            © {new Date().getFullYear()} CaterNest. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
