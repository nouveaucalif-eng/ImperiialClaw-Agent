import pptxgen from 'pptxgenjs';
import path from 'path';
import fs from 'fs';
import os from 'os';

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
  console.log(`🎬 Starting PowerPoint generation for: ${filename} (Theme: ${theme})`);
  const PptxGenJS = (pptxgen as any).default || pptxgen;
  const pres = new (PptxGenJS as any)();
  const config = THEMES[theme] || THEMES.nova;
  
  pres.layout = 'LAYOUT_16x9';

  slides.forEach((slide, idx) => {
    const s = pres.addSlide();
    s.background = { fill: config.bg };

    // --- GEOMETRIC BACKGROUND PATTERNS ---
    if (theme === 'zenith') {
        // Futuristic Tech Grid / Shapes
        for(let i=0; i<5; i++) {
            s.addShape(pres.ShapeType.ellipse, { 
                x: Math.random()*10, y: Math.random()*5, w: 2, h: 2, 
                fill: { color: config.accent, transparency: 80 } 
            });
        }
    } else if (theme === 'nova') {
        // Modern Minimalist Geometry
        s.addShape(pres.ShapeType.rect, { x: 7, y: -1, w: 4, h: 4, fill: { color: config.accent, transparency: 90 }, rotate: 45 });
        s.addShape(pres.ShapeType.rect, { x: 8, y: 3, w: 3, h: 3, fill: { color: config.secondary, transparency: 85 }, rotate: 20 });
    } else if (theme === 'imperial') {
        // Classic Luxury Accents
        s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: config.accent } });
        s.addShape(pres.ShapeType.rect, { x: 0, y: '98%', w: '100%', h: 0.2, fill: { color: config.accent } });
    }

    if (idx === 0) {
        // --- TITLE SLIDE (Full Screen Impact) ---
        s.addShape(pres.ShapeType.rect, { x: 1, y: 2, w: 8, h: 2.5, fill: { color: config.bg }, line: { color: config.accent, width: 2 } });
        
        s.addText(slide.title.toUpperCase(), {
            x: 1, y: 2.2, w: 8, h: 1,
            fontSize: 54, bold: true, color: config.titleColor,
            align: 'center', fontFace: config.font
        });
        
        s.addText(slide.content, {
            x: 1, y: 3.5, w: 8, h: 1,
            fontSize: 24, color: config.textColor,
            align: 'center', fontFace: config.font, italic: true
        });
    } else {
        // --- CONTENT SLIDE (Complex Layout) ---
        
        // 1. Title with Underline/Accent (Fixed size & Shrink)
        s.addText(slide.title, {
            x: 0.5, y: 0.4, w: '90%', h: 0.7,
            fontSize: 28, bold: true, color: config.titleColor,
            fontFace: config.font, shrinkText: true
        });
        s.addShape(pres.ShapeType.rect, { x: 0.5, y: 1.1, w: 2, h: 0.04, fill: { color: config.accent } });

        // 2. Image Integration (Switching to a more PPT-friendly source)
        const keyword = slide.title.split(' ').pop()?.toLowerCase() || 'abstract';
        const imgUrl = slide.imageUrl || `https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800&q=80`; // Reliable fallback
        
        // Alternating Layout: Image Left or Right
        const isImageRight = idx % 2 === 0;
        
        try {
            if (isImageRight) {
                // Text Left, Image Right
                s.addText(formatContent(slide.content), {
                    x: 0.5, y: 1.4, w: '42%', h: '65%',
                    fontSize: 14, color: config.textColor,
                    fontFace: config.font, valign: 'top', lineSpacing: 22,
                    shrinkText: true
                });
                s.addImage({ path: imgUrl, x: 5.2, y: 1.4, w: 4.3, h: 3.2, rounded: true });
                s.addShape(pres.ShapeType.rect, { x: 5.4, y: 1.6, w: 4.3, h: 3.2, fill: { color: config.accent, transparency: 80 }, z: -1 });
            } else {
                // Image Left, Text Right
                s.addImage({ path: imgUrl, x: 0.5, y: 1.4, w: 4.3, h: 3.2, rounded: true });
                s.addShape(pres.ShapeType.rect, { x: 0.3, y: 1.6, w: 4.3, h: 3.2, fill: { color: config.accent, transparency: 80 }, z: -1 });
                
                s.addText(formatContent(slide.content), {
                    x: 5.3, y: 1.4, w: '42%', h: '65%',
                    fontSize: 14, color: config.textColor,
                    fontFace: config.font, valign: 'top', lineSpacing: 22,
                    shrinkText: true
                });
            }
        } catch (imgErr) {
            console.error(`⚠️ Image failed for slide ${idx}:`, imgErr);
            s.addText(formatContent(slide.content), {
                x: 0.5, y: 1.4, w: '90%', h: '65%',
                fontSize: 16, color: config.textColor,
                fontFace: config.font, valign: 'top', lineSpacing: 24,
                shrinkText: true
            });
        }
    }

    // Branding Footer
    s.addText("ImperiialClaw OS | Intelligence Augmentée", {
        x: '5%', y: '94%', w: '90%', h: 0.2,
        fontSize: 8, color: 'A0AEC0', align: 'right', fontFace: config.font
    });
  });

  const tempDir = os.tmpdir();
  const safeFilename = filename.endsWith('.pptx') ? filename : `${filename}.pptx`;
  const filePath = path.join(tempDir, safeFilename);

  console.log(`Generating visual PPT at: ${filePath}`);
  await pres.writeFile({ fileName: filePath });
  
  return filePath;
}

function formatContent(content: string) {
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    return lines.map(line => ({ 
        text: line.replace(/^[-\*\+]\s*/, ''), 
        options: { bullet: true, margin: [0, 0, 0, 5] } 
    }));
}
