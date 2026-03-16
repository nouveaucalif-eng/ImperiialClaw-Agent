import pptxgen from 'pptxgenjs';
import os from 'os';
import path from 'path';

async function test() {
  try {
    console.log("Starting PPT test...");
    const PptxGenJS = (pptxgen as any).default || pptxgen;
    console.log("PptxGenJS resolved:", typeof PptxGenJS);
    const pres = new (PptxGenJS as any)();
    console.log("Instance created");
    
    let slide = pres.addSlide();
    slide.addText("Hello World", { x: 1, y: 1 });
    
    const filePath = path.join(os.tmpdir(), "test.pptx");
    await pres.writeFile({ fileName: filePath });
    console.log("File written to:", filePath);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

test();
