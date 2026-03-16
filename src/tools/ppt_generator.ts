import pptxgen from 'pptxgenjs';
import path from 'path';
import fs from 'fs';
import os from 'os';

export interface SlideData {
  title: string;
  content: string;
  imageUrl?: string;
}

export type ThemeType = 'modern' | 'dark' | 'corporate';

interface ThemeConfig {
  bg: string;
  titleColor: string;
  textColor: string;
  accent: string;
  font: string;
}

const THEMES: Record<ThemeType, ThemeConfig> = {
  modern: { bg: 'F5F7FA', titleColor: '1A202C', textColor: '4A5568', accent: '4299E1', font: 'Segoe UI' },
  dark: { bg: '1A202C', titleColor: 'F7FAFC', textColor: 'E2E8F0', accent: '63B3ED', font: 'Segoe UI' },
  corporate: { bg: 'FFFFFF', titleColor: '2D3748', textColor: '718096', accent: '2B6CB0', font: 'Arial' }
};

export async function createPowerPoint(slides: SlideData[], filename: string, theme: ThemeType = 'modern'): Promise<string> {
  const PptxGenJS = (pptxgen as any).default || pptxgen;
  const pres = new (PptxGenJS as any)();
  const config = THEMES[theme] || THEMES.modern;
  
  pres.layout = 'LAYOUT_16x9';

  slides.forEach((slide, idx) => {
    const s = pres.addSlide();
    s.background = { fill: config.bg };

    // Accent line at the top
    s.addShape(pres.ShapeType.rect, { 
        x: 0, y: 0, w: '100%', h: 0.1, fill: { color: config.accent } 
    });

    if (idx === 0) {
        // Title Slide
        s.addText(slide.title.toUpperCase(), {
            x: 0, y: '35%', w: '100%', h: 1.5,
            fontSize: 44, bold: true, color: config.titleColor,
            align: 'center', fontFace: config.font
        });
        s.addText(slide.content, {
            x: 0, y: '55%', w: '100%', h: 1,
            fontSize: 22, color: config.textColor,
            align: 'center', fontFace: config.font
        });
    } else {
        // Content Slide
        // Accent box behind title
        s.addShape(pres.ShapeType.rect, { 
            x: 0.5, y: 0.4, w: 0.05, h: 0.6, fill: { color: config.accent } 
        });

        s.addText(slide.title, {
            x: 0.7, y: 0.3, w: '85%', h: 0.8,
            fontSize: 32, bold: true, color: config.titleColor,
            fontFace: config.font, valign: 'middle'
        });

        s.addText(slide.content, {
            x: 0.7, y: 1.5, w: '85%', h: '60%',
            fontSize: 18, color: config.textColor,
            bullet: { type: 'number', numberType: 'romanLcParenBoth' },
            fontFace: config.font, valign: 'top',
            lineSpacing: 28
        });
    }

    // Footer
    s.addText("ImperiialClaw OS AI Agent", {
        x: 0.5, y: '92%', w: '90%', h: 0.3,
        fontSize: 10, color: 'A0AEC0', align: 'right'
    });
  });

  const tempDir = os.tmpdir();
  const safeFilename = filename.endsWith('.pptx') ? filename : `${filename}.pptx`;
  const filePath = path.join(tempDir, safeFilename);

  await pres.writeFile({ fileName: filePath });
  
  return filePath;
}
