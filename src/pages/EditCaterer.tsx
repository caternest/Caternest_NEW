import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import CatererMenuBuilder from '../components/CatererMenuBuilder';
import { toast } from '../components/Toast';

export default function EditCaterer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caterer, setCaterer] = useState<any>(null);
  const [menuPackages, setMenuPackages] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('registrations');
    if (raw) {
      const all = JSON.parse(raw);
      const found = all.find((c: any) => c.id === id);
      if (found) {
        setCaterer(found);
        setMenuPackages(found.menuPackages || []);
      }
    }
  }, [id]);

  if (!caterer) return <div className="pt-32 text-center">Loading...</div>;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCaterer({ ...caterer, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    const raw = localStorage.getItem('registrations');
    if (raw) {
      const all = JSON.parse(raw);
      // Change status to Pending Re-Approval upon edit
      const updated = all.map((c: any) => c.id === id ? { ...caterer, menuPackages, status: 'Pending Re-Approval' } : c);
      try {
        localStorage.setItem('registrations', JSON.stringify(updated));
        toast('Profile updated! Sent to Admin for Re-Approval.', 'success');
        navigate('/businesses');
      } catch (err) {
        console.error("Quota exceeded during save", err);
        alert("The profile data is too large to save (images may exceed your browser's local storage quota limit). Try reducing gallery photos or profile image sizes.");
      }
    }
  };

  return (
    <div className="pt-24 pb-12 min-h-screen bg-slate-50 font-poppins">
      <div className="max-w-4xl mx-auto px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 font-semibold">
          <ArrowLeft size={18} /> Back
        </button>
        
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
            <div>
                <h1 className="text-2xl font-bold font-display text-slate-800">Edit Business Profile</h1>
                <p className="text-sm text-slate-500 mt-1">Changes will require admin re-approval.</p>
            </div>
            <button onClick={handleSave} className="bg-brand-green-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-brand-green-800 flex items-center gap-2">
              <Save size={18} /> Save & Submit
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Business Name</label>
                <input name="businessName" value={caterer.businessName || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-gold-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Owner Name</label>
                <input name="owner" value={caterer.owner || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-gold-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Location</label>
                  <input name="location" value={caterer.location || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-gold-500" placeholder="e.g. Madhapur" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
              <textarea name="description" value={caterer.description || ''} onChange={handleChange} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-gold-500"></textarea>
            </div>

            <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 mt-8">
               <h3 className="font-bold text-lg mb-4 text-slate-800">Menu & Packages</h3>
               <CatererMenuBuilder packages={menuPackages} onChange={setMenuPackages} isParsing={isParsing} setIsParsing={setIsParsing} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
