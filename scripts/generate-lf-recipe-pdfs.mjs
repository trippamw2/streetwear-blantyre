/**
 * Builds a branded PDF for every Lake Fresh recipe, uploads it to the public
 * product images bucket, and stores the public URL on the recipe row.
 *
 * Usage: node scripts/generate-lf-recipe-pdfs.mjs
 *
 * Reads VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env. The bucket
 * path is lf/recipes/<slug>.pdf, which the admin media screen also uses.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), ".env"), "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.trim().startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    }),
);

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const BRAND = "22222222-2222-2222-2222-222222222222";
const BUCKET = "product-images";
const FOLDER = "lf/recipes";

/** Replace characters outside WinAnsi with safe ASCII. */
const ascii = (value) =>
  String(value ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00b7/g, "-")
    .replace(/\u00b0/g, " degrees ")
    .replace(/\u2026/g, "...")
    .replace(/[^\x20-\x7E]/g, "");

const escapePdf = (value) => ascii(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

class PdfDoc {
  constructor() {
    this.pages = [];
    this.current = null;
    this.y = 0;
    this.newPage();
  }

  newPage() {
    this.current = [];
    this.pages.push(this.current);
    this.y = 780;
    this.rect(0, 782, 595, 60, [7 / 255, 59 / 255, 120 / 255]);
    this.text("LAKE FRESH FISH MART", 40, 806, { size: 16, bold: true, color: [1, 1, 1] });
    this.text("Fresh from the Lake. Ready for Your Table.", 40, 790, {
      size: 9,
      color: [0.85, 0.95, 1],
    });
    this.y = 750;
  }

  ensure(height) {
    if (this.y - height < 60) this.newPage();
  }

  rect(x, y, w, h, [r, g, b]) {
    this.current.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg ${x} ${y} ${w} ${h} re f`);
  }

  text(value, x, y, { size = 11, bold = false, color = [0.15, 0.15, 0.15] } = {}) {
    const [r, g, b] = color;
    this.current.push(
      `BT /${bold ? "F2" : "F1"} ${size} Tf ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg 1 0 0 1 ${x} ${y} Tm (${escapePdf(value)}) Tj ET`,
    );
  }

  heading(value) {
    this.ensure(40);
    this.y -= 10;
    this.text(value.toUpperCase(), 40, this.y, {
      size: 11,
      bold: true,
      color: [0.22, 0.71, 0.29],
    });
    this.y -= 6;
    this.current.push(
      `0.85 0.93 0.88 RG 0.8 w 40 ${this.y} m 555 ${this.y} l S`,
    );
    this.y -= 16;
  }

  paragraph(value, { size = 11, bold = false, color, indent = 0, gap = 5 } = {}) {
    const max = 92 - indent;
    const words = ascii(value).split(/\s+/);
    let line = "";
    const lines = [];
    for (const word of words) {
      if ((line + " " + word).trim().length > max && line) {
        lines.push(line);
        line = word;
      } else {
        line = (line + " " + word).trim();
      }
    }
    if (line) lines.push(line);
    for (const item of lines) {
      this.ensure(size + gap + 4);
      this.text(item, 40 + indent, this.y, { size, bold, color });
      this.y -= size + gap;
    }
  }

  bullet(value) {
    this.ensure(20);
    this.text("-", 40, this.y, { size: 11, bold: true, color: [0.22, 0.71, 0.29] });
    this.paragraph(value, { indent: 10 });
  }

  finish() {
    this.ensure(40);
    this.y -= 6;
    this.text("lakefresh.vercel.app  ·  Blantyre, Malawi", 40, this.y, {
      size: 9,
      color: [0.45, 0.45, 0.45],
    });
    return this.build();
  }

  build() {
    const objects = [];
    const pageIds = [];
    const contentIds = [];

    // Reserve 1 catalog, 2 pages tree, 3-4 fonts.
    let next = 5;
    for (const page of this.pages) {
      pageIds.push(next++);
      contentIds.push(next++);
    }

    objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
    objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
    objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

    this.pages.forEach((pageCommands, index) => {
      const content = pageCommands.join("\n");
      objects[contentIds[index]] =
        `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`;
      objects[pageIds[index]] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentIds[index]} 0 R >>`;
    });

    let pdf = "%PDF-1.4\n";
    const offsets = [];
    for (let id = 1; id < objects.length; id += 1) {
      offsets[id] = Buffer.byteLength(pdf, "latin1");
      pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
    }
    const xrefOffset = Buffer.byteLength(pdf, "latin1");
    pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let id = 1; id < objects.length; id += 1) {
      pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
    return Buffer.from(pdf, "latin1");
  }
}

const buildRecipePdf = (recipe) => {
  const doc = new PdfDoc();
  doc.text(recipe.title, 40, 700, { size: 22, bold: true, color: [0.03, 0.23, 0.47] });

  const meta = [
    recipe.fish_species?.name,
    recipe.servings ? `Serves ${recipe.servings}` : null,
    recipe.prep_time_min ? `Prep ${recipe.prep_time_min} min` : null,
    recipe.cook_time_min ? `Cook ${recipe.cook_time_min} min` : null,
  ]
    .filter(Boolean)
    .join("   |   ");
  doc.text(meta, 40, 682, { size: 10, color: [0.4, 0.4, 0.4] });

  if (recipe.recommended_spice) {
    doc.rect(40, 650, 515, 22, [0.94, 0.99, 0.97]);
    doc.text(`Pairs with ${recipe.recommended_spice}`, 48, 656, {
      size: 10,
      bold: true,
      color: [0.16, 0.45, 0.18],
    });
  }

  doc.y = 620;
  doc.heading("Ingredients");
  for (const item of recipe.ingredients || []) doc.bullet(item);

  doc.heading("Method");
  const steps = recipe.steps || [];
  steps.forEach((step, index) => {
    doc.ensure(20);
    doc.text(`${index + 1}.`, 40, doc.y, { size: 11, bold: true, color: [0.03, 0.23, 0.47] });
    doc.paragraph(step, { indent: 12 });
    doc.y -= 3;
  });

  if (recipe.safety_notes) {
    doc.heading("Safety");
    doc.paragraph(recipe.safety_notes, { size: 10, color: [0.4, 0.4, 0.4] });
  }

  doc.heading("Order again");
  doc.paragraph(
    "Fresh chambo, ncheni and usipa with signature spices and a free recipe with every fish order. Next day delivery across Blantyre.",
    { size: 10, color: [0.4, 0.4, 0.4] },
  );

  return doc.finish();
};

const supabaseFetch = async (path, init = {}) => {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!response.ok) {
    throw new Error(`${init.method || "GET"} ${path} failed: ${response.status} ${await response.text()}`);
  }
  return response;
};

const main = async () => {
  const response = await supabaseFetch(
    `/rest/v1/lf_recipes?select=id,slug,title,ingredients,steps,recommended_spice,safety_notes,prep_time_min,cook_time_min,servings,fish_species(name)&brand_id=eq.${BRAND}&order=sort_order`,
  );
  const recipes = await response.json();
  console.log(`Found ${recipes.length} recipes`);

  for (const recipe of recipes) {
    const pdf = buildRecipePdf(recipe);
    const objectPath = `${FOLDER}/${recipe.slug}.pdf`;

    await supabaseFetch(`/storage/v1/object/${BUCKET}/${objectPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/pdf", "x-upsert": "true" },
      body: pdf,
    });

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;
    await supabaseFetch(`/rest/v1/lf_recipes?id=eq.${recipe.id}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ pdf_url: publicUrl }),
    });

    console.log(`Uploaded ${recipe.slug}.pdf (${pdf.length} bytes)`);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
