// src/App.jsx
import React from 'react';
import { motion } from 'framer-motion';
import HeroHeader from './components/HeroHeader.jsx';
import BentoGrid from './components/BentoGrid.jsx';
import Temoignages from './components/Temoignages.jsx';

export default function App() {
  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 bg-cover text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <HeroHeader />
      <section className="py-16 px-4 md:px-12">
        <h2 className="text-4xl font-title text-center mb-8 tracking-tighter">
          Nos Services Exceptionnels
        </h2>
        <BentoGrid />
      </section>
      <section className="py-16 px-4 md:px-12">
        <h2 className="text-4xl font-title text-center mb-8 tracking-tighter">
          Témoignages
        </h2>
        <Temoignages />
      </section>
    </motion.div>
  );
}
