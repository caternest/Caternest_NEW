import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Building, Plus, ArrowRight, Clock, CheckCircle2, XCircle, AlertCircle, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export default function MyBusinesses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<any[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('registrations');
    if (raw) {
      const allRegs = JSON.parse(raw);
      // Filter out deleted logic if needed, but for now show user's active/pending items
      setBusinesses(allRegs.filter((r: any) => r.userId === user?.id && r.status !== 'Deleted'));
    }
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Draft': return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit"><Edit size={12}/> Draft</span>;
      case 'Pending Approval': return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit"><Clock size={12}/> Pending Approval</span>;
      case 'Approved': return <span className="px-2.5 py-1 bg-green-100 text-green-800 border border-green-200 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit"><CheckCircle2 size={12}/> Approved</span>;
      case 'Rejected': return <span className="px-2.5 py-1 bg-red-100 text-red-800 border border-red-200 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit"><XCircle size={12}/> Rejected</span>;
      case 'Needs Changes': return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 border border-blue-200 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit"><AlertCircle size={12}/> Needs Changes</span>;
      case 'Suspended': return <span className="px-2.5 py-1 bg-slate-900 text-slate-100 border border-slate-700 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit"><AlertCircle size={12}/> Suspended</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
               <h1 className="text-3xl font-display font-bold text-slate-900">My Businesses</h1>
               <p className="text-slate-500 mt-1">Manage your service registrations and approvals.</p>
            </div>
            <Link to="/partner-selection" className="flex items-center gap-2 bg-brand-green-900 hover:bg-brand-green-800 text-white px-5 py-2.5 rounded-xl font-bold transition-colors">
               <Plus size={18} /> Register New Service
            </Link>
        </div>

        {businesses.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
                <div className="w-20 h-20 bg-brand-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-green-900">
                   <Building size={32} />
                </div>
                <h3 className="text-xl font-bold font-display text-slate-900 mb-2">No Businesses Yet</h3>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">You haven't registered any services. Join our marketplace to start getting orders.</p>
                <Link to="/partner-selection" className="inline-flex items-center gap-2 bg-brand-green-900 hover:bg-brand-green-800 text-white px-6 py-3 rounded-xl font-bold transition-colors">
                   Become a Partner
                </Link>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {businesses.map(b => (
                    <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col hover:border-slate-300 transition-colors shadow-sm relative overflow-hidden">
                        
                        {/* Accent strips based on status */}
                        <div className={cn(
                            "absolute top-0 left-0 right-0 h-1",
                            b.status === 'Approved' ? "bg-green-500" :
                            b.status === 'Pending Approval' ? "bg-amber-500" :
                            b.status === 'Rejected' ? "bg-red-500" :
                            b.status === 'Needs Changes' ? "bg-blue-500" :
                            "bg-slate-300"
                        )}></div>

                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{b.businessName}</h3>
                                <p className="text-sm font-medium text-slate-500">{b.type}</p>
                            </div>
                            {getStatusBadge(b.status)}
                        </div>

                        {b.date && (
                            <p className="text-xs text-slate-500 mb-3 flex items-center gap-1"><Clock size={12}/> Submitted: {b.date}</p>
                        )}
                        
                        <div className="flex gap-4 text-xs font-medium text-slate-500 mb-3">
                            <span><span className="font-bold text-slate-700">{b.location || 'Hyderabad'}</span></span>
                            <span>•</span>
                            <span><span className="font-bold text-slate-700">{b.menuPackages?.length || 0}</span> Packages</span>
                            <span>•</span>
                            <span><span className="font-bold text-slate-700">{b.galleryPhotos?.length || 0}</span> Images</span>
                        </div>

                        {b.reason && (b.status === 'Rejected' || b.status === 'Needs Changes') && (
                            <div className="mt-2 text-sm bg-red-50 border border-red-100 text-red-800 p-3 rounded-lg mb-4">
                                <p className="font-bold flex items-center gap-1 mb-1"><AlertCircle size={14}/> Reason:</p>
                                <p className="opacity-90 leading-relaxed">{b.reason}</p>
                            </div>
                        )}

                        <div className="mt-auto pt-6 flex justify-end gap-3 border-t border-slate-100 flex-wrap">
                             {b.status === 'Approved' && (
                                <button 
                                   onClick={() => {
                                       localStorage.setItem('catererDashboardId', b.id);
                                       navigate('/caterer-dashboard');
                                   }} 
                                   className="px-4 py-2 bg-brand-green-900 text-white text-sm font-bold rounded-lg hover:bg-brand-green-800 transition-colors flex items-center gap-2"
                                >
                                    Dashboard
                                </button>
                             )}
                             <Link to={`/caterer/${b.id}`} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors">
                                View Profile
                             </Link>
                             <Link to={`/edit-business/${b.id}`} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1">
                                <Edit size={14} /> Edit
                             </Link>
                             <button onClick={() => {
                                 if (window.confirm('Delete this business?')) {
                                     const raw = JSON.parse(localStorage.getItem('registrations') || '[]');
                                     const updated = raw.filter((x:any) => x.id !== b.id);
                                     localStorage.setItem('registrations', JSON.stringify(updated));
                                     setBusinesses(updated.filter((r: any) => r.userId === user?.id && r.status !== 'Deleted'));
                                 }
                             }} className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1">
                                <XCircle size={14} />
                             </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        )}

      </div>
    </div>
  );
}
