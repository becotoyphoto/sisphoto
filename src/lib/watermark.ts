export interface WatermarkOptions {
  text?: string;
  opacity?: number;
  fontSize?: number;
  color?: string;
  diagonal?: boolean;
}

export async function applyWatermarkToCanvas(
  file: File,
  options: WatermarkOptions = {}
): Promise<Blob> {
  const {
    text = 'FOTOEVENTO BRASIL',
    opacity = 0.3,
    fontSize = 60,
    color = '255, 255, 255',
    diagonal = true,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        ctx.globalAlpha = opacity;
        ctx.fillStyle = `rgb(${color})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const fontPx = Math.max(fontSize, Math.floor(img.width / 20));
        ctx.font = `bold ${fontPx}px sans-serif`;

        if (diagonal) {
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((-35 * Math.PI) / 180);
          ctx.fillText(text, 0, 0);
          ctx.rotate((35 * Math.PI) / 180);
          ctx.translate(-canvas.width / 2, -canvas.height / 2);
          
          ctx.fillText(text, canvas.width / 2, canvas.height / 4);
          ctx.fillText(text, canvas.width / 2, (canvas.height * 3) / 4);
        } else {
          const stepX = canvas.width / 2;
          const stepY = canvas.height / 2;
          
          for (let y = -canvas.height; y < canvas.height * 2; y += stepY) {
            for (let x = -canvas.width; x < canvas.width * 2; x += stepX) {
              ctx.fillText(text, x, y);
            }
          }
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Could not generate blob'));
            }
          },
          'image/jpeg',
          0.92
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}
