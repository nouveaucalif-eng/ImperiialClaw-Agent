import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import BentoGrid from './components/BentoGrid';
import Temoignages from './components/Temoignages';

function App() {
  return (
    <div className="bg-emerald-500">
      <Header />
      <Hero />
      <BentoGrid />
      <Temoignages />
    </div>
  );
}

export default App;