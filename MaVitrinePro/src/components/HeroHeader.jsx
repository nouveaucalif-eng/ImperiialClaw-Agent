import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Code, Zap, Globe, Smartphone, Shield } from 'lucide-react';

const HeroHeader = () => {
  return (
    <section className="min-h-[85vh] flex flex-col justify-center items-center text-center relative mt-16">
      
      {/* Badge Animé */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8, type: 'spring' }}
        className="glass rounded-full px-6 py-2 mb-8 inline-flex items-center gap-2 text-sm text-primary border-primary/30"
      >
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        Nouvelle Génération Web
      </motion.div>

      {/* Titre Principal avec Dégradé */}
      <motion.h1
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="text-6xl md:text-8xl font-title font-extrabold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/40 leading-tight drop-shadow-2xl"
      >
        L'Interface Ultime<br/>
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Pour Votre Business
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="text-xl md:text-2xl text-white/60 max-w-2xl mb-12 font-light"
      >
        Des expériences immersives, ultra-rapides et pensées pour convertir. Propulsez votre marque dans le futur.
      </motion.p>

      {/* Boutons d'Action */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto px-6"
      >
        <button className="group relative px-8 py-4 bg-primary text-[#050511] font-bold rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(0,180,216,0.6)]">
          <span className="relative z-10 flex items-center gap-2 justify-center">
            Démarrer le Projet <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </span>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>
        
        <button className="px-8 py-4 glass text-white font-medium rounded-xl hover:bg-white/10 transition-colors border-white/20">
          Voir les Réalisations
        </button>
      </motion.div>
    </section>
  );
};

export default HeroHeader;