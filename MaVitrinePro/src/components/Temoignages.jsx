// src/components/Temoignages.jsx
import React from 'react';
import { motion } from 'framer-motion';

const temoignages = [
  { texte: 'Travail exceptionnel !', auteur: 'Jean Dupont' },
  { texte: 'Merci pour votre efficacité.', auteur: 'Marie Martin' },
  { texte: 'Je suis très satisfait.', auteur: 'Pierre Durand' },
];

export default function Temoignages() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {temoignages.map((temoignage, idx) => (
        <motion.div
          key={temoignage.texte}
          className="glass p-6 flex flex-col items-center text-center ${idx === 0 ? 'sm:col-span-2' : ''}"          whileHover={{ scale: 1.05, rotate: 0.5 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <p className="text-lg mb-4">{temoignage.texte}</p>
          <p className="text-sm font-body">{temoignage.auteur}</p>
        </motion.div>
      ))}
    </div>
  );
}
