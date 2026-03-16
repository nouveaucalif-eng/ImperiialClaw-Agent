import pptxgen from 'pptxgenjs';
import path from 'path';
import fs from 'fs';
import os from 'os';

export interface SlideData {
  title: string;
  content: string;
  imageUrl?: string;
}

export async function createPowerPoint(slides: SlideData[], filename: string): Promise<string> {
  const PptxGenJS = (pptxgen as any).default || pptxgen;
  const pres = new (PptxGenJS as any)();
  
  pres.layout = 'LAYOUT_16x9';

  slides.forEach(slide => {
    const s = pres.addSlide();
    
    // Add title
    s.addText(slide.title, {
      x: 0.5,
      y: 0.3,
      w: '90%',
      h: 1,
      fontSize: 32,
      bold: true,
      color: '363636',
      align: 'center'
    });

    // Add content
    s.addText(slide.content, {
      x: 0.5,
      y: 1.5,
      w: '90%',
      h: 3,
      fontSize: 18,
      color: '595959',
      bullet: true,
      valign: 'top'
    });

    // If imageUrl is provided (future placeholder for DALL-E/Stable Diffusion)
    if (slide.imageUrl) {
        // pres can take URLs, but for now we focus on text
    }
  });

  const tempDir = os.tmpdir();
  const safeFilename = filename.endsWith('.pptx') ? filename : `${filename}.pptx`;
  const filePath = path.join(tempDir, safeFilename);

  // Buffer writing for consistency in server environments
  await pres.writeFile({ fileName: filePath });
  
  return filePath;
}
