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
    text = 'BecoToy.com',
    opacity = 0.26,
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

        const fontPx = Math.max(38, Math.floor(Math.max(fontSize, img.width / 40)));
        const smallFontPx = Math.max(16, Math.floor(fontPx * 0.42));
        const tile = Math.max(
          Math.floor(fontPx * 4.8),
          Math.floor(Math.min(canvas.width, canvas.height) / 2.6)
        );

        const drawCameraIcon = (x: number, y: number, size: number) => {
          const bodyWidth = size;
          const bodyHeight = size * 0.64;
          const lensRadius = size * 0.18;
          const bodyX = x - bodyWidth / 2;
          const bodyY = y - bodyHeight / 2;
          const topWidth = size * 0.3;
          const topHeight = size * 0.12;

          ctx.beginPath();
          ctx.roundRect(bodyX, bodyY, bodyWidth, bodyHeight, size * 0.12);
          ctx.fill();

          ctx.beginPath();
          ctx.roundRect(x - topWidth / 2, bodyY - topHeight * 0.7, topWidth, topHeight, topHeight / 2);
          ctx.fill();

          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          ctx.beginPath();
          ctx.arc(x, y, lensRadius, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(x, y, lensRadius * 0.55, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          ctx.beginPath();
          ctx.arc(x + bodyWidth * 0.28, bodyY + bodyHeight * 0.18, size * 0.04, 0, Math.PI * 2);
          ctx.fill();
        };

        const drawWatermarkTile = (x: number, y: number) => {
          const cameraSize = Math.max(36, fontPx * 0.75);

          ctx.font = `700 ${fontPx}px sans-serif`;
          drawCameraIcon(x, y - fontPx * 0.78, cameraSize);
          ctx.fillText(text, x, y + fontPx * 0.05);

          ctx.font = `500 ${smallFontPx}px sans-serif`;
          ctx.fillText('#proibido reproducao', x, y + fontPx * 1.05);
        };

        if (diagonal) {
          ctx.save();
          ctx.strokeStyle = `rgb(${color})`;
          ctx.lineWidth = Math.max(1.5, Math.floor(canvas.width / 900));

          for (let x = -canvas.height; x < canvas.width + canvas.height; x += tile) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + canvas.height, canvas.height);
            ctx.stroke();
          }

          for (let x = 0; x < canvas.width + canvas.height; x += tile) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x - canvas.height, canvas.height);
            ctx.stroke();
          }

          for (let row = -1; row <= Math.ceil(canvas.height / tile) + 1; row++) {
            for (let col = -1; col <= Math.ceil(canvas.width / tile) + 1; col++) {
              const offsetX = row % 2 === 0 ? tile * 0.28 : tile * 0.64;
              const posX = col * tile + offsetX;
              const posY = row * tile + tile * 0.54;
              drawWatermarkTile(posX, posY);
            }
          }
          ctx.restore();
        } else {
          for (let y = tile * 0.45; y < canvas.height + tile; y += tile * 0.9) {
            for (let x = tile * 0.35; x < canvas.width + tile; x += tile * 0.9) {
              drawWatermarkTile(x, y);
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
