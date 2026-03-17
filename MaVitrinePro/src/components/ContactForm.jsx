import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ContactForm = () => {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      setLoading(false);
      setDone(true);
      toast.success('Message envoyé avec succès !', {
        icon: <CheckCircle2 className="text-secondary" />
      });
      setTimeout(() => setDone(false), 3000); // reset UI after 3s
    }, 1500);
  };

  return (
    <section id="contact" className="py-20 relative z-10">
      <div className="max-w-2xl mx-auto glass p-8 md:p-12 rounded-3xl border-t-white/20">
        <h2 className="text-4xl font-title font-bold mb-2">Travaillons <span className="text-secondary">Ensemble</span></h2>
        <p className="text-white/50 mb-8 text-sm">Prêt(e) à donner vie à votre vision digitale ? Contactez-nous dès maintenant et faisons décoller votre activité.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-xs font-semibold text-white/50 uppercase tracking-wider">Nom complet</label>
              <input required id="name" type="text" className="w-full bg-[#050511]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary" placeholder="Jean Dupont" />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold text-white/50 uppercase tracking-wider">Email Pro</label>
              <input required id="email" type="email" className="w-full bg-[#050511]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary" placeholder="jean@entreprise.com" />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="text-xs font-semibold text-white/50 uppercase tracking-wider">Votre Projet</label>
            <textarea required id="message" rows="4" className="w-full bg-[#050511]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary resize-none placeholder-white/20" placeholder="Décrivez votre vision..."></textarea>
          </div>

          <button 
            type="submit" 
            disabled={loading || done}
            className="w-full bg-gradient-to-r from-primary to-blue-500 hover:from-blue-400 hover:to-secondary text-[#050511] font-bold py-4 rounded-xl transition-all duration-300 flex justify-center items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,180,216,0.2)]"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-[#050511]/30 border-t-[#050511] rounded-full animate-spin" />
            ) : done ? (
              <>Envoyé ! <CheckCircle2 className="w-5 h-5" /></>
            ) : (
              <>Envoyer la Demande <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
            )}
          </button>
        </form>
      </div>
    </section>
  );
};

export default ContactForm;
