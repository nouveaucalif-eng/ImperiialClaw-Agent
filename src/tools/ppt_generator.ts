import pptxgen from 'pptxgenjs';
import path from 'path';
import fs from 'fs';
import os from 'os';

export interface SlideData {
  title: string;
  content: string;
  imageUrl?: string;
}

export interface SlideData {
  title: string;
  content: string;
  imageUrl?: string;
}

export type ThemeType = 'zenith' | 'nova' | 'imperial';

interface ThemeConfig {
  bg: string;
  titleColor: string;
  textColor: string;
  accent: string;
  secondary: string;
  font: string;
}

const THEMES: Record<ThemeType, ThemeConfig> = {
  zenith: { bg: '1A202C', titleColor: 'F7FAFC', textColor: 'E2E8F0', accent: '63B3ED', secondary: '2D3748', font: 'Arial' }, // Dark Tech
  nova: { bg: 'F5F7FA', titleColor: '1A202C', textColor: '4A5568', accent: '4299E1', secondary: 'E2E8F0', font: 'Arial' },   // Modern Clean
  imperial: { bg: '000000', titleColor: 'D4AF37', textColor: 'FFFFFF', accent: 'D4AF37', secondary: '1A1A1A', font: 'Verdana' } // Elegant Gold
};

export async function createPowerPoint(slides: SlideData[], filename: string, theme: ThemeType = 'nova'): Promise<string> {
  const PptxGenJS = (pptxgen as any).default || pptxgen;
  const pres = new (PptxGenJS as any)();
  const config = THEMES[theme] || THEMES.nova;
  
  pres.layout = 'LAYOUT_16x9';

  slides.forEach((slide, idx) => {
    const s = pres.addSlide();
    s.background = { fill: config.bg };

    // --- Decorative Elements (Design System) ---
    
    if (theme === 'zenith') {
        // Gradient effect with shapes
        s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.15, fill: { color: config.accent } });
        s.addShape(pres.ShapeType.rect, { x: 0, y: '95%', w: '100%', h: 0.05, fill: { color: config.secondary } });
    } else if (theme === 'nova') {
        // Simple elegant sidebar
        s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 0.2, h: '100%', fill: { color: config.accent } });
    } else if (theme === 'imperial') {
        // Gold borders
        s.addShape(pres.ShapeType.rect, { x: 0.2, y: 0.2, w: '96%', h: 0.02, fill: { color: config.accent }, rectRadius: 0.5 });
        s.addShape(pres.ShapeType.rect, { x: 0.2, y: '96%', w: '96%', h: 0.02, fill: { color: config.accent }, rectRadius: 0.5 });
    }

    if (idx === 0) {
        // --- TITLE SLIDE ---
        s.addText(slide.title.toUpperCase(), {
            x: '10%', y: '35%', w: '80%', h: 1.5,
            fontSize: 54, bold: true, color: config.titleColor,
            align: 'center', fontFace: config.font,
            shadow: { type: 'outer', blur: 3, offset: 2, color: '00000055' }
        });
        
        s.addText(slide.content, {
            x: '10%', y: '55%', w: '80%', h: 1,
            fontSize: 24, color: config.textColor,
            align: 'center', fontFace: config.font,
            italic: true
        });
    } else {
        // --- CONTENT SLIDE ---
        // Title Area with background box for "Nova"
        if (theme === 'nova') {
            s.addShape(pres.ShapeType.rect, { x: 0.5, y: 0.3, w: '90%', h: 0.8, fill: { color: 'FFFFFF' } });
        }

        s.addText(slide.title, {
            x: 0.5, y: 0.3, w: '90%', h: 0.8,
            fontSize: 36, bold: true, color: config.titleColor,
            fontFace: config.font, valign: 'middle',
            margin: [0, 0, 0, 10]
        });

        // Content Area
        const lines = slide.content.split('\n').filter(l => l.trim().length > 0);
        const formattedContent = lines.map(line => ({ 
            text: line.replace(/^[-\*\+]\s*/, ''), 
            options: { bullet: true, margin: [0, 0, 0, 10] } 
        }));

        s.addText(formattedContent, {
            x: 0.8, y: 1.5, w: '85%', h: '65%',
            fontSize: 20, color: config.textColor,
            fontFace: config.font, valign: 'top',
            lineSpacing: 32
        });
    }

    // Branding Footer
    s.addText("Propulsé par ImperiialClaw OS | Agent Intelligence", {
        x: '5%', y: '92%', w: '90%', h: 0.3,
        fontSize: 9, color: 'A0AEC0', align: 'right', fontFace: config.font
    });
  });

  const tempDir = os.tmpdir();
  const safeFilename = filename.endsWith('.pptx') ? filename : `${filename}.pptx`;
  const filePath = path.join(tempDir, safeFilename);

  console.log(`Writing PowerPoint to: ${filePath}`);
  await pres.writeFile({ fileName: filePath });
  
  return filePath;
}
