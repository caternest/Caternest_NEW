import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, ArrowRight } from 'lucide-react';

export default function RegistrationSuccess() {
  return (
    <div className="min-h-screen pt-32 pb-20 bg-brand-green-50 flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-10 text-center border border-brand-green-100"
      >
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={48} />
          </div>
          
          <h1 className="text-3xl font-display font-bold text-brand-green-900 mb-4">Registration Submitted</h1>
          
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-6 flex flex-col items-center">
             <div className="flex items-center gap-2 font-bold mb-1">
                <Clock size={18} /> Status: Pending Admin Approval
             </div>
             <p className="text-sm opacity-80">Estimated review time: 24-48 hours</p>
          </div>
          
          <p className="text-slate-600 mb-8 font-poppins">
             Thank you for joining CaterNest! Our team will review your application and documents carefully. 
             You will receive an email and notification once your business is approved.
          </p>

          <Link to="/businesses" className="inline-flex flex-1 w-full justify-center items-center gap-2 bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md">
              View My Businesses <ArrowRight size={18} />
          </Link>
          
      </motion.div>
    </div>
  );
}
