import fs from "node:fs";
import path from "node:path";
import { getDb, closeDb, type AppDatabase } from "../src/db";
import {
  CATEGORY_DEFINITIONS,
  PRODUCT_NAME_TG,
  cleanAndEnrichItems,
  ensureJctopCatalog,
  type JctopItem,
} from "../src/modules/catalog/jctop-sync";

export { CATEGORY_DEFINITIONS, PRODUCT_NAME_TG };

function loadJctopAssets(): { items: JctopItem[]; photos: Buffer[] } {
  const assetsItemsPath = path.resolve("./assets/jctop-2026-items.json");
  const publicPhotosDir = path.resolve("./public/images/jctop");

  if (fs.existsSync(assetsItemsPath) && fs.existsSync(publicPhotosDir)) {
    const items: JctopItem[] = JSON.parse(fs.readFileSync(assetsItemsPath, "utf-8"));
    const maxPhoto = Math.max(...items.map((item) => item.photo));
    const photos: Buffer[] = [];
    let allPresent = true;
    for (let i = 0; i <= maxPhoto; i++) {
      const filePath = path.join(publicPhotosDir, `jctop-photo-${i}.webp`);
      if (!fs.existsSync(filePath)) {
        allPresent = false;
        break;
      }
      photos.push(fs.readFileSync(filePath));
    }
    if (allPresent) {
      console.log(`Loaded ${items.length} items and ${photos.length} photos from repo assets.`);
      return { items: cleanAndEnrichItems(items), photos };
    }
  }

  const dir = "C:/Users/alijo/Downloads/Telegram Desktop";
  const htmlFiles = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.includes("JCTOP"))
    : [];
  if (!htmlFiles.length) {
    throw new Error("JCTOP catalog assets or source HTML not found");
  }
  const fullPath = path.join(dir, htmlFiles[0]);
  console.log("Reading catalog HTML from:", fullPath);
  const htmlContent = fs.readFileSync(fullPath, "utf-8");

  const itemsMatch = htmlContent.match(/const ITEMS\s*=\s*(\[[\s\S]*?\]);/);
  const photosMatch = htmlContent.match(/const PHOTOS\s*=\s*(\[[\s\S]*?\]);/);
  if (!itemsMatch || !photosMatch) {
    throw new Error("Could not find ITEMS or PHOTOS in catalog HTML");
  }

  const items = cleanAndEnrichItems(JSON.parse(itemsMatch[1]) as JctopItem[]);
  const rawPhotos: string[] = JSON.parse(photosMatch[1]);
  const photos = rawPhotos.map((entry) =>
    Buffer.from(entry.replace(/^data:image\/[a-z]+;base64,/, ""), "base64"),
  );

  fs.mkdirSync(path.dirname(assetsItemsPath), { recursive: true });
  fs.writeFileSync(assetsItemsPath, JSON.stringify(items, null, 2), "utf-8");
  fs.mkdirSync(publicPhotosDir, { recursive: true });
  photos.forEach((buffer, i) => {
    fs.writeFileSync(path.join(publicPhotosDir, `jctop-photo-${i}.webp`), buffer);
  });
  console.log(`Parsed and exported ${items.length} items and ${photos.length} photos to assets.`);
  return { items, photos };
}

export async function importJctopCatalog(existingDb?: AppDatabase) {
  const { items, photos } = loadJctopAssets();
  const catalogPublicImagesDir = path.resolve("./public/images/catalog");
  fs.mkdirSync(catalogPublicImagesDir, { recursive: true });
  for (const cat of CATEGORY_DEFINITIONS) {
    const photo = photos[cat.representativePhoto];
    if (photo) {
      fs.writeFileSync(path.join(catalogPublicImagesDir, `${cat.slug}.webp`), photo);
    }
  }

  const db = existingDb ?? (await getDb());
  const result = await ensureJctopCatalog(db, { force: true, items, photos });
  console.log("Catalog import finished:", result);
  if (!existingDb) {
    await closeDb();
  }
}

if (process.argv[1]?.includes("import-jctop-catalog")) {
  importJctopCatalog().catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
  });
}
