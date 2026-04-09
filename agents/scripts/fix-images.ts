/**
 * Fix images: attach correct images from Wikimedia Commons to tickets.
 * Uses exact filename search via Commons API instead of guessing URLs.
 *
 * Usage: npx tsx agents/scripts/fix-images.ts
 */

import axios from "axios";
import * as fs from "fs";
import * as path from "path";

const API_URL = "http://localhost:3001/api";

// Map: pddRef → exact Wikimedia Commons filename to search for
const PDDREF_IMAGE: Record<string, string> = {
  "1.1":   "UA road sign 1.1",
  "6.5":   "UA road sign 6.5",
  "8.1":   "UA road sign 5.38",
  "8.3":   "UA road sign 5.38",
  "8.7.3": "UA road sign 5.38",
  "8.7.4": "UA road sign 5.38",
  "9.8":   "UA road sign 4.14",
  "10.4":  "UA road sign 4.14",
  "11.1":  "UA road sign 5.1",
  "11.2":  "UA road sign 5.36",
  "12.4":  "UA road sign 3.29-050",
  "12.6":  "UA road sign 5.31",
  "14.1":  "UA road sign 3.25",
  "14.2":  "UA road sign 3.25",
  "14.6":  "UA road sign 3.25",
  "15.3":  "UA road sign 5.38",
  "15.9":  "UA road sign 1.20",
  "15.10": "UA road sign 6.13",
  "16.1":  "UA road sign 5.38",
  "16.4":  "UA road sign 1.16",
  "16.6":  "UA road sign 1.16",
  "16.9":  "UA road sign 5.38",
  "16.11": "UA road sign 2.1",
  "16.12": "UA road sign 1.16",
  "16.13": "UA road sign 4.12",
  "17.1":  "UA road sign 5.38",
  "17.2":  "UA road sign 5.38",
  "18.1":  "UA road sign 5.42",
  "20.1":  "UA road sign 1.20",
  "20.3":  "UA road sign 1.20",
  "21.3":  "UA road sign 3.29-050",
};

// Tag-based fallbacks
const TAG_IMAGE: Record<string, string> = {
  "speed":            "UA road sign 3.29-050",
  "traffic_lights":   "UA road sign 5.38",
  "overtaking":       "UA road sign 3.25",
  "pedestrians":      "UA road sign 5.38",
  "signs":            "UA road sign 2.1",
  "intersections":    "UA road sign 1.16",
  "railway_crossing": "UA road sign 1.20",
  "cyclists":         "UA road sign 6.5",
  "parking":          "UA road sign 6.13",
  "bus_stop":         "UA road sign 5.42",
  "residential_zone": "UA road sign 5.31",
  "roundabout":       "UA road sign 4.10",
};

// Cache: search query → resolved image info
const cache = new Map<string, any>();

async function resolveImage(searchTerm: string, token: string): Promise<any | null> {
  if (cache.has(searchTerm)) return cache.get(searchTerm);

  try {
    const res = await axios.post(
      `${API_URL}/admin/images/resolve`,
      { query: `${searchTerm} svg` },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 20000 },
    );
    const candidates = res.data as any[];
    // Find exact match by searchTerm in title
    const term = searchTerm.replace("UA road sign ", "");
    const match = candidates.find((c: any) => {
      const t = c.title.toLowerCase();
      return t.includes(term.toLowerCase()) && (t.endsWith(".svg") || t.endsWith(".png"));
    }) || (candidates.length > 0 ? candidates[0] : null);

    cache.set(searchTerm, match);
    // Rate limit
    await new Promise(r => setTimeout(r, 1200));
    return match;
  } catch {
    cache.set(searchTerm, null);
    return null;
  }
}

async function main() {
  const loginRes = await axios.post(`${API_URL}/auth/login`, {
    email: "admin@road-rules.local",
    password: "admin123",
  });
  const token = loginRes.data.accessToken;
  console.log("Authenticated\n");

  // Clean existing
  console.log("Cleaning existing images...");
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  await prisma.ticketImage.deleteMany({});
  await prisma.imageAsset.deleteMany({});
  await prisma.$disconnect();

  const uploadsDir = path.resolve(__dirname, "../../apps/api/uploads/images");
  if (fs.existsSync(uploadsDir)) {
    for (const f of fs.readdirSync(uploadsDir)) {
      if (f !== ".gitkeep") fs.unlinkSync(path.join(uploadsDir, f));
    }
  }
  console.log("Cleaned.\n");

  // Get all tickets
  const allTickets: any[] = [];
  let page = 1;
  while (true) {
    const res = await axios.get(
      `${API_URL}/admin/tickets?status=PUBLISHED&pageSize=100&page=${page}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    allTickets.push(...res.data.data);
    if (allTickets.length >= res.data.total) break;
    page++;
  }
  console.log(`Found ${allTickets.length} tickets\n`);

  let attached = 0;
  let skipped = 0;

  for (let i = 0; i < allTickets.length; i++) {
    const ticket = allTickets[i];
    const label = `[${i + 1}/${allTickets.length}] ${ticket.pddRef}`;

    // Find search term
    let searchTerm = PDDREF_IMAGE[ticket.pddRef];
    if (!searchTerm) {
      for (const tag of ticket.tags) {
        if (TAG_IMAGE[tag]) { searchTerm = TAG_IMAGE[tag]; break; }
      }
    }
    if (!searchTerm) {
      skipped++;
      console.log(`${label}: no mapping → skip`);
      continue;
    }

    const image = await resolveImage(searchTerm, token);
    if (!image) {
      skipped++;
      console.log(`${label}: search "${searchTerm}" → not found`);
      continue;
    }

    try {
      await axios.post(
        `${API_URL}/admin/images/attach`,
        {
          ticketId: ticket.id,
          sourceUrl: image.fileUrl,
          license: image.license || "Public domain",
          author: image.author || "Government of Ukraine",
          title: image.title,
          attributionHtml: image.attributionHtml || `${image.title}, Public domain, via Wikimedia Commons`,
        },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 30000 },
      );
      attached++;
      console.log(`${label}: ✓ ${image.title}`);
    } catch (e: any) {
      skipped++;
      console.log(`${label}: ✗ attach failed (${e.response?.status})`);
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Attached: ${attached}, Skipped: ${skipped}`);
}

main().catch(console.error);
