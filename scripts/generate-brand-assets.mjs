/**
 * 產生「App 內 UI 專用」的縮小版品牌圖檔。
 *
 * 為什麼需要：原始檔是給 App 圖示與 favicon 用的大圖（標誌 1024×1024、橫式標誌
 * 1380×752），但畫面上最大只顯示到 64pt（標誌）與 272pt（橫式標誌）。直接用大圖，
 * 每次第一次顯示都要下載並解碼一張百萬像素的位圖 —— 這就是「其他內容都出現了，
 * 標誌晚一步才跳出來」剩下的那一段成本。
 *
 * 尺寸怎麼決定：以「最大顯示尺寸 × 3」為準（3x 是 iPhone Pro/Plus 與多數高階
 * Android 的像素密度），再小就會在這些裝置上變模糊。
 *   標誌     64pt × 3 = 192px
 *   橫式標誌 272pt × 3 = 816px
 *
 * 純 JS 實作（pngjs），刻意不引入 sharp／ImageMagick：這個步驟掛在 npm install 的
 * prepare 上，不能因為原生二進位檔在某個平台裝不起來就讓安裝失敗。
 *
 * 手動重跑：npm run assets:brand
 * 換新的原始圖檔後也只要重跑這個指令（會依檔案時間自動判斷，沒變就跳過）。
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = resolve(dirname(scriptPath), '..');

const log = (message) => {
  console.log(`[brand-assets] ${message}`);
};

/** 之後要產生的檔案。改這裡就等於改 lib/brandAssets.ts 要 require 的路徑。 */
const TARGETS = [
  {
    from: 'public/icons/talentmatch-icon.png',
    to: 'public/icons/talentmatch-mark-192.png',
    width: 192,
    note: 'BrandLogo（最大 64pt @3x）',
  },
  {
    from: 'assets/talentmatch-wordmark.png',
    to: 'assets/talentmatch-wordmark-816.png',
    width: 816,
    note: 'BrandLockup（最大 272pt @3x）',
  },
];

/** sRGB → 線性光。縮圖必須在線性光下平均，否則邊緣會偏暗（尤其白底上的深色線條）。 */
const SRGB_TO_LINEAR = new Float32Array(256);
for (let i = 0; i < 256; i += 1) {
  const c = i / 255;
  SRGB_TO_LINEAR[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(value) {
  const v = value <= 0 ? 0 : value >= 1 ? 1 : value;
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.round(c * 255);
}

/**
 * 面積平均（box filter）縮圖：輸出每個像素取它在原圖覆蓋範圍的加權平均，邊緣像素
 * 按覆蓋比例給權重。非整數倍縮放也不會產生鋸齒或漏掉細節。
 */
function resizeRgba(src, dstWidth, dstHeight) {
  const { width: sw, height: sh, data } = src;
  const out = new Uint8Array(dstWidth * dstHeight * 4);
  const scaleX = sw / dstWidth;
  const scaleY = sh / dstHeight;

  for (let y = 0; y < dstHeight; y += 1) {
    const top = y * scaleY;
    const bottom = (y + 1) * scaleY;
    const sy0 = Math.floor(top);
    const sy1 = Math.min(sh, Math.ceil(bottom));

    for (let x = 0; x < dstWidth; x += 1) {
      const left = x * scaleX;
      const right = (x + 1) * scaleX;
      const sx0 = Math.floor(left);
      const sx1 = Math.min(sw, Math.ceil(right));

      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let total = 0;

      for (let sy = sy0; sy < sy1; sy += 1) {
        const wy = Math.min(sy + 1, bottom) - Math.max(sy, top);
        if (wy <= 0) continue;

        for (let sx = sx0; sx < sx1; sx += 1) {
          const wx = Math.min(sx + 1, right) - Math.max(sx, left);
          if (wx <= 0) continue;

          const weight = wx * wy;
          const i = (sy * sw + sx) * 4;
          // 先乘上 alpha（premultiply），透明區的顏色才不會渲染到邊緣。
          const alpha = data[i + 3] / 255;
          r += SRGB_TO_LINEAR[data[i]] * alpha * weight;
          g += SRGB_TO_LINEAR[data[i + 1]] * alpha * weight;
          b += SRGB_TO_LINEAR[data[i + 2]] * alpha * weight;
          a += alpha * weight;
          total += weight;
        }
      }

      const o = (y * dstWidth + x) * 4;
      const alpha = total > 0 ? a / total : 0;
      if (alpha <= 0) {
        out[o] = 0;
        out[o + 1] = 0;
        out[o + 2] = 0;
        out[o + 3] = 0;
        continue;
      }
      out[o] = linearToSrgb(r / total / alpha);
      out[o + 1] = linearToSrgb(g / total / alpha);
      out[o + 2] = linearToSrgb(b / total / alpha);
      out[o + 3] = Math.round(alpha * 255);
    }
  }

  return out;
}

function isOpaque(rgba) {
  for (let i = 3; i < rgba.length; i += 4) {
    if (rgba[i] !== 255) return false;
  }
  return true;
}

function encodePng(PNG, rgba, width, height) {
  const png = new PNG({ width, height });
  png.data = Buffer.from(rgba.buffer, rgba.byteOffset, rgba.byteLength);

  // 全不透明時輸出 RGB（colorType 2），省掉整條 alpha 通道的位元組。
  if (isOpaque(rgba)) {
    try {
      return PNG.sync.write(png, {
        colorType: 2,
        inputColorType: 6,
        inputHasAlpha: true,
        deflateLevel: 9,
      });
    } catch {
      // pngjs 版本不支援這個轉換時，退回 RGBA。
    }
  }

  return PNG.sync.write(png, { deflateLevel: 9 });
}

function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function main() {
  // pngjs 是 devDependency。用 --omit=dev 安裝時取不到，這時什麼都不做：
  // 產出的圖檔已經進版控，缺的只是「重新產生」的能力。
  let PNG;
  try {
    ({ PNG } = await import('pngjs'));
  } catch {
    log('找不到 pngjs（可能是 --omit=dev 安裝），跳過。已存在的圖檔不受影響。');
    return;
  }

  const scriptMtime = statSync(scriptPath).mtimeMs;

  for (const target of TARGETS) {
    const fromPath = resolve(projectRoot, target.from);
    const toPath = resolve(projectRoot, target.to);
    const label = relative(projectRoot, toPath);

    if (!existsSync(fromPath)) {
      log(`跳過 ${label}：找不到原始圖檔 ${target.from}`);
      continue;
    }

    const sourceMtime = statSync(fromPath).mtimeMs;
    if (existsSync(toPath)) {
      const outMtime = statSync(toPath).mtimeMs;
      if (outMtime >= sourceMtime && outMtime >= scriptMtime) {
        log(`已是最新，跳過 ${label}`);
        continue;
      }
    }

    const source = PNG.sync.read(readFileSync(fromPath));
    const width = Math.min(target.width, source.width);
    const height = Math.max(1, Math.round((width * source.height) / source.width));
    const rgba = resizeRgba(source, width, height);
    const buffer = encodePng(PNG, rgba, width, height);

    mkdirSync(dirname(toPath), { recursive: true });
    writeFileSync(toPath, buffer);

    const before = statSync(fromPath).size;
    log(
      `${label} ← ${target.from}：${source.width}×${source.height} (${kb(before)}) → ` +
        `${width}×${height} (${kb(buffer.length)})，用於 ${target.note}`,
    );
  }
}

try {
  await main();
} catch (error) {
  // 這個腳本掛在 npm install 的 prepare 上：絕對不能讓它讓安裝或雲端建置失敗。
  // 產出的圖檔已進版控，失敗只代表這次沒有重新產生。
  log(`失敗（已忽略）：${error?.stack ?? error}`);
}
