import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Globe, Smartphone, Shield, Eye, BarChart } from 'lucide-react';

const Box = ({ title, desc, icon, colSpan, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -5, scale: 1.02 }}
    className={`glass p-8 relative overflow-hidden group flex flex-col justify-end min-h-[250px] ${colSpan}`}
  >
    {/* Background Glow */}
    <div className="absolute -top-[50%] -right-[50%] w-full h-full bg-primary/20 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    
    <div className="relative z-10">
      <div className="mb-4 text-primary bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-2xl font-bold font-title mb-2 tracking-wide">{title}</h3>
      <p className="text-white/60 text-sm">{desc}</p>
    </div>
  </motion.div>
);

const BentoGrid = () => {
  return (
    <section id="services" className="py-20">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-title font-bold tracking-tighter mb-4"><span className="text-primary">Ecosystème</span> Digital</h2>
        <p className="text-white/50 max-w-xl mx-auto">Une gamme complète d'outils calibrés pour dominer votre secteur d'activité.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 max-w-5xl mx-auto">
        {/* Large Main Box */}
        <Box 
          title="Développement Web Ultra-Rapide"
          desc="Sites vitrines, E-commerce et plateformes sur-mesure utilisant les stacks les plus récentes (React, Next.js, Vite)."
          icon={<Globe size={24} />}
          colSpan="md:col-span-2 md:row-span-1"
          delay={0}
        />
        
        {/* Tall Side Box */}
        <Box 
          title="Optimisation SEO Extrême"
          desc="Positionnement en tête de liste sur Google grâce à des audits profonds et une stratégie sémantique implacable."
          icon={<BarChart size={24} />}
          colSpan="md:col-span-1 md:row-span-2"
          delay={0.1}
        />

        {/* Small Box 1 */}
        <Box 
          title="Performance Absolue"
          desc="Temps de chargement millisecondes, architectures Serverless et CDN mondiaux."
          icon={<Zap size={24} />}
          colSpan="md:col-span-1"
          delay={0.2}
        />

        {/* Small Box 2 */}
        <Box 
          title="Dark UI & Animations"
          desc="Interfaces immersives, animations fluides (60fps) et mode sombre natif pour l'élégance."
          icon={<Eye size={24} />}
          colSpan="md:col-span-1"
          delay={0.3}
        />
      </div>
    </section>
  );
};

export default BentoGrid;