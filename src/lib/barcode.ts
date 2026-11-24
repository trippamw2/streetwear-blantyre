/**
 * Barcode generation utilities for SB
 * Generates unique barcodes for products and supports QR code generation
 */

/**
 * Generate a unique barcode for a product
 * Format: STB-{year}-{random8chars}
 */
export function generateProductBarcode(_productId: string): string {
  const year = new Date().getFullYear();
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `STB-${year}-${rand}`;
}

/**
 * Get the verification URL for a barcode
 */
export function getVerificationUrl(barcode: string): string {
  return `https://wearsb.com/scan/${barcode}`;
}

/**
 * Generate a QR code SVG string for a given value
 * Uses the qrserver.com API for reliable QR generation
 */
export function generateQRCodeSVG(value: string, size: number = 200): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <image width="${size}" height="${size}" href="https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&format=svg"/>
  </svg>`;
}

/**
 * Download a QR code label as PNG
 * Includes branding, product details, and QR code
 */
export async function downloadBarcodeLabel(options: {
  productName: string;
  barcode: string;
  price?: number;
  category?: string;
  brand?: string;
}): Promise<void> {
  const { productName, barcode, price, category, brand } = options;
  const canvas = document.createElement("canvas");
  const W = 600;
  const H = 800;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // Top black bar
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, W, 100);

  // Brand text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 42px 'Cormorant Garamond', Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("STREETWEAR BLANTYRE", W / 2, 42);

  ctx.font = "600 13px 'DM Sans', Helvetica, sans-serif";
  ctx.fillText("A U T H E N T I C   P R O D U C T", W / 2, 72);

  // Shield icon area
  ctx.fillStyle = "#f0fdf4";
  ctx.beginPath();
  ctx.arc(W / 2, 160, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#22c55e";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText("\u2713", W / 2, 170);

  // "AUTHENTIC" label
  ctx.fillStyle = "#22c55e";
  ctx.font = "bold 14px 'DM Sans', Helvetica, sans-serif";
  ctx.fillText("VERIFIED AUTHENTIC", W / 2, 220);

  // Product name
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 22px 'Cormorant Garamond', Georgia, serif";
  const nameLines = wrapText(productName, W - 80);
  nameLines.forEach((line, i) => {
    ctx.fillText(line, W / 2, 270 + i * 30);
  });

  // Brand/Category badge
  const badgeY = 270 + nameLines.length * 30 + 15;
  if (brand || category) {
    ctx.fillStyle = "#0f172a";
    ctx.font = "600 12px 'DM Sans', Helvetica, sans-serif";
    ctx.fillText((brand || category || "").toUpperCase(), W / 2, badgeY);
  }

  // Divider
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 330);
  ctx.lineTo(W - 60, 330);
  ctx.stroke();

  // Details section
  const detailsY = 370;
  ctx.textAlign = "left";
  ctx.fillStyle = "#6b7280";
  ctx.font = "11px 'DM Sans', Helvetica, sans-serif";

  const details: [string, string][] = [
    ["BARCODE", barcode],
  ];
  if (price) details.push(["PRICE", `MK ${price.toLocaleString()}`]);
  if (category) details.push(["CATEGORY", category]);
  if (brand) details.push(["BRAND", brand]);

  details.forEach(([label, value], i) => {
    const y = detailsY + i * 28;
    ctx.fillStyle = "#9ca3af";
    ctx.fillText(label, 60, y);
    ctx.fillStyle = "#1f2937";
    ctx.font = "bold 12px 'DM Sans', Helvetica, sans-serif";
    ctx.fillText(value, 200, y);
    ctx.font = "11px 'DM Sans', Helvetica, sans-serif";
  });

  // QR code section
  const qrY = detailsY + details.length * 28 + 30;
  ctx.textAlign = "center";

  // QR background
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(W / 2 - 130, qrY - 10, 260, 260, 16);
  ctx.fill();
  ctx.stroke();

  // Render QR code onto canvas
  const qrUrl = getVerificationUrl(barcode);
  const qrSize = 220;
  const svgStr = generateQRCodeSVG(qrUrl, qrSize);
  const img = new Image();
  const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  await new Promise<void>((resolve) => {
    img.onload = () => {
      ctx.drawImage(img, W / 2 - qrSize / 2, qrY, qrSize, qrSize);
      URL.revokeObjectURL(svgUrl);
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      resolve();
    };
    img.src = svgUrl;
  });

  // Scan instruction
  ctx.textAlign = "center";
  ctx.fillStyle = "#6b7280";
  ctx.font = "600 11px 'DM Sans', Helvetica, sans-serif";
  ctx.fillText("SCAN TO VERIFY AUTHENTICITY", W / 2, qrY + qrSize + 25);

  // Verification URL
  ctx.fillStyle = "#9ca3af";
  ctx.font = "10px monospace";
  ctx.fillText(qrUrl, W / 2, qrY + qrSize + 45);

  // Bottom bar
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, H - 50, W, 50);
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 11px 'DM Sans', Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("www.wearsb.com  \u2022  SB  \u2022  Authentic Streetwear", W / 2, H - 20);

  // Download
  return new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `Barcode-${productName.replace(/\s+/g, "-")}-${barcode}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      }
      resolve();
    }, "image/png");
  });
}

/**
 * Print barcode label (opens print dialog with label content)
 */
export function printBarcodeLabel(options: {
  productName: string;
  barcode: string;
  price?: number;
  category?: string;
  brand?: string;
}): void {
  const { productName, barcode, price, category, brand } = options;
  const verificationUrl = getVerificationUrl(barcode);
  
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Product barcode: ${productName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DM Sans', Helvetica, sans-serif; background: #fff; }
        .label { width: 600px; padding: 20px; border: 1px solid #e5e7eb; }
        .header { background: #0f172a; color: #fff; padding: 15px; text-align: center; margin-bottom: 15px; }
        .header h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 24px; font-weight: bold; }
        .header p { font-size: 11px; letter-spacing: 2px; margin-top: 5px; opacity: 0.7; }
        .auth-badge { text-align: center; margin: 15px 0; }
        .auth-badge .check { display: inline-block; width: 40px; height: 40px; border-radius: 50%; background: #f0fdf4; border: 2px solid #22c55e; color: #22c55e; font-size: 20px; line-height: 40px; }
        .auth-badge p { color: #22c55e; font-weight: bold; font-size: 12px; margin-top: 8px; }
        .product-name { text-align: center; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 18px; font-weight: bold; margin: 15px 0; }
        .details { padding: 15px 0; border-top: 1px solid #e5e7eb; }
        .detail-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; }
        .detail-label { color: #9ca3af; }
        .detail-value { color: #1f2937; font-weight: bold; }
        .qr-section { text-align: center; margin: 20px 0; }
        .qr-section img { width: 150px; height: 150px; }
        .qr-section p { font-size: 10px; color: #6b7280; margin-top: 8px; }
        .footer { background: #0f172a; color: #fff; text-align: center; padding: 10px; font-size: 10px; margin-top: 15px; }
        @media print { .label { border: none; } }
      </style>
    </head>
    <body>
      <div class="label">
        <div class="header">
          <h1>STREETWEAR BLANTYRE</h1>
          <p>AUTHENTIC PRODUCT</p>
        </div>
        <div class="auth-badge">
          <div class="check">✓</div>
          <p>VERIFIED AUTHENTIC</p>
        </div>
        <div class="product-name">${productName}</div>
        ${brand ? `<p style="text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:1px;">${brand}</p>` : ""}
        <div class="details">
          <div class="detail-row">
            <span class="detail-label">BARCODE</span>
            <span class="detail-value">${barcode}</span>
          </div>
          ${price ? `<div class="detail-row"><span class="detail-label">PRICE</span><span class="detail-value">MK ${price.toLocaleString()}</span></div>` : ""}
          ${category ? `<div class="detail-row"><span class="detail-label">CATEGORY</span><span class="detail-value">${category}</span></div>` : ""}
          ${brand ? `<div class="detail-row"><span class="detail-label">BRAND</span><span class="detail-value">${brand}</span></div>` : ""}
        </div>
        <div class="qr-section">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}" alt="QR Code" />
          <p>SCAN TO VERIFY AUTHENTICITY</p>
          <p style="font-family:monospace;font-size:9px;color:#9ca3af;">${verificationUrl}</p>
        </div>
        <div class="footer">
          www.wearsb.com • SB • Authentic Streetwear
        </div>
      </div>
      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Wrap text to fit within maxWidth (approximate)
 */
function wrapText(text: string, _maxWidth: number): string[] {
  if (text.length <= 30) return [text];
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).length > 30) {
      lines.push(current.trim());
      current = word;
    } else {
      current += " " + word;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines.slice(0, 2);
}
