import { getSharpFactory } from '@/lib/imageAssetPipeline';
import { escapeXml } from '@/lib/imageSvgText';

/**
 * Ink width of a text run, measured by actually rendering it with the same font stack the
 * badges use. The badge width estimators assume Latin glyph advances, which is badly wrong for
 * Arabic, Hebrew, CJK, Thai or Indic labels (they come out far too wide, so the text ends up
 * off-centre inside its plate).
 */
export const measureSvgTextWidth = async (
  text: string,
  fontSize: number,
  fontWeight: number | string,
  fontFamily: string
): Promise<number | null> => {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const canvasWidth = Math.max(64, Math.round(fontSize * trimmed.length * 2));
  const canvasHeight = Math.round(fontSize * 2);
  try {
    const sharp = await getSharpFactory();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}">
<text x="10" y="${Math.round(fontSize * 1.4)}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" fill="#ffffff">${escapeXml(trimmed)}</text>
</svg>`;
    const { info } = await sharp(Buffer.from(svg)).trim({ threshold: 10 }).png().toBuffer({ resolveWithObject: true });
    return info.width > 0 ? info.width : null;
  } catch {
    return null;
  }
};
