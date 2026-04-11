import "dotenv/config";
import {
  PrismaClient,
  Difficulty,
  TicketStatus,
  TicketImageRole,
  UserRole,
} from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// Situational image → scenarioHash prefix patterns (from situational-images.md)
const SITUATIONAL_IMAGES: Array<{ file: string; patterns: string[] }> = [
  { file: "01-equal-intersection-2cars.png", patterns: ["b14-equal-", "intersection-equal-right-", "b20-equal-road-"] },
  { file: "02-equal-intersection-3cars.png", patterns: ["b14-equal-three-", "b20-3car-equal-", "b20-intersection-3car-"] },
  { file: "03-equal-left-turn.png", patterns: ["b20-equal-road-left-turn-", "b14-equal-left-right-"] },
  { file: "04-main-secondary.png", patterns: ["b14-giveway-", "b14-main-", "intersection-main-vs-secondary-"] },
  { file: "05-t-junction.png", patterns: ["b14-t-junction-", "b14-main-right-turn-secondary-"] },
  { file: "06-main-road-turns.png", patterns: ["b14-main-road-turns-right-", "b20-main-road-direction-change-"] },
  { file: "10-filter-arrow.png", patterns: ["b07-tl-filter-arrow-", "b13-arrow-red-", "b20-filter-arrow-"] },
  { file: "11-left-turn-green.png", patterns: ["b13-left-turn-yield-", "intersection-left-turn-green-oncoming-"] },
  { file: "12-overtaking-oncoming.png", patterns: ["b11-overtaking-oncoming-", "b11-overtaking-chain-"] },
  { file: "13-chain-overtaking.png", patterns: ["b11-overtaking-double-", "b14-6-double-"] },
  { file: "14-overtaking-crosswalk.png", patterns: ["b11-overtaking-pedestrian-crossing-"] },
  { file: "15-simultaneous-lane-change.png", patterns: ["b10-maneuver-simultaneous-", "lane-change-simultaneous-"] },
  { file: "16-roundabout.png", patterns: ["b14-roundabout-", "b05-mandatory-4.10-"] },
  { file: "17-pedestrian-crossing.png", patterns: ["b15-pedestrian-", "b02-warning-sign-1.17-"] },
  { file: "18-pedestrian-jaywalking.png", patterns: ["b15-pedestrian-runs-out-", "b15-pedestrian-jaywalking-"] },
  { file: "19-stalled-on-tracks.png", patterns: ["b02-warning-sign-1.20-003", "b16-railway-stalled-"] },
  { file: "20-barrier-closed.png", patterns: ["b16-railway-barrier-closed-"] },
  { file: "21-towing.png", patterns: ["b17-towing-rigid-", "b17-towing-flexible-"] },
  { file: "22-night-headlights.png", patterns: ["b20-night-blinded-", "b02-warning-sign-1.1-002"] },
  { file: "23-cpr.png", patterns: ["b19-firstaid-cpr-"] },
  { file: "24-tourniquet.png", patterns: ["b19-firstaid-arterial-", "b19-firstaid-tourniquet-"] },
  { file: "25-fracture-splint.png", patterns: ["b19-firstaid-fracture-"] },
  { file: "26-recovery-position.png", patterns: ["b19-firstaid-recovery-"] },
];

interface ImageMap {
  signs: Record<string, string>;
  topics: Record<string, string>;
  pddRef_to_image: Record<string, string | null>;
}

function findSituationalImage(scenarioHash: string): string | null {
  for (const entry of SITUATIONAL_IMAGES) {
    for (const pattern of entry.patterns) {
      if (scenarioHash.startsWith(pattern)) return entry.file;
    }
  }
  return null;
}

async function main() {
  // Create admin user
  const adminHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@road-rules.local" },
    update: {},
    create: {
      email: "admin@road-rules.local",
      passwordHash: adminHash,
      role: UserRole.ADMIN,
    },
  });

  // Create regular user
  const userHash = await bcrypt.hash("user123", 10);
  const user = await prisma.user.upsert({
    where: { email: "user@road-rules.local" },
    update: {},
    create: {
      email: "user@road-rules.local",
      passwordHash: userHash,
      role: UserRole.USER,
    },
  });

  console.log(`Users: admin=${admin.id}, user=${user.id}`);

  // Load image map for Wikimedia signs
  const dataDir = path.resolve(__dirname, "../../../agents/data");
  const imageMapPath = path.join(dataDir, "image-map.json");
  let imageMap: ImageMap = { signs: {}, topics: {}, pddRef_to_image: {} };
  if (fs.existsSync(imageMapPath)) {
    imageMap = JSON.parse(fs.readFileSync(imageMapPath, "utf-8"));
  }

  // Cache for created ImageAsset records (avoid duplicates)
  const signAssetCache = new Map<string, string>(); // signNum → imageAssetId
  const localAssetCache = new Map<string, string>(); // filename → imageAssetId

  const getOrCreateSignAsset = async (signNum: string): Promise<string | null> => {
    if (signAssetCache.has(signNum)) return signAssetCache.get(signNum)!;
    const url = imageMap.signs[signNum];
    if (!url) return null;
    const sha256 = crypto.createHash("sha256").update(url).digest("hex");
    const existing = await prisma.imageAsset.findUnique({ where: { sha256 } });
    if (existing) {
      signAssetCache.set(signNum, existing.id);
      return existing.id;
    }
    const asset = await prisma.imageAsset.create({
      data: {
        sourceUrl: url,
        storedKey: `sign-${signNum}-${sha256.slice(0, 8)}`,
        externalUrl: url,
        license: "CC-BY-SA",
        author: "Wikimedia Commons",
        title: `UA road sign ${signNum}`,
        attributionHtml: `UA road sign ${signNum}, via Wikimedia Commons`,
        sha256,
      },
    });
    signAssetCache.set(signNum, asset.id);
    return asset.id;
  };

  const getOrCreateLocalAsset = async (filename: string): Promise<string | null> => {
    if (localAssetCache.has(filename)) return localAssetCache.get(filename)!;
    const sha256 = crypto.createHash("sha256").update(filename).digest("hex");
    const existing = await prisma.imageAsset.findUnique({ where: { sha256 } });
    if (existing) {
      localAssetCache.set(filename, existing.id);
      return existing.id;
    }
    const asset = await prisma.imageAsset.create({
      data: {
        sourceUrl: `local:${filename}`,
        storedKey: filename,
        license: "CC0",
        author: "Road Rules Trainer",
        title: filename.replace(/\.[^.]+$/, "").replace(/-/g, " "),
        attributionHtml: "Situational diagram",
        sha256,
      },
    });
    localAssetCache.set(filename, asset.id);
    return asset.id;
  };

  // Import all batch files
  let totalCreated = 0;
  let totalSkipped = 0;
  let totalImagesLinked = 0;

  for (let i = 1; i <= 20; i++) {
    const batchNum = String(i).padStart(3, "0");
    const filePath = path.join(dataDir, `batch-${batchNum}.json`);

    if (!fs.existsSync(filePath)) {
      console.log(`batch-${batchNum}: FILE MISSING — skip`);
      continue;
    }

    let data: any;
    try {
      data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch {
      console.log(`batch-${batchNum}: INVALID JSON — skip`);
      continue;
    }

    const tickets = data.tickets;
    if (!Array.isArray(tickets) || tickets.length === 0) {
      console.log(`batch-${batchNum}: NO TICKETS — skip`);
      continue;
    }

    let batchCreated = 0;
    let batchImages = 0;
    for (const t of tickets) {
      if (!t.questionRu || !t.questionUk || !t.scenarioHash || !t.pddRef) continue;
      if (!Array.isArray(t.options) || t.options.length < 2) continue;
      const correctCount = t.options.filter((o: any) => o.isCorrect).length;
      if (correctCount !== 1) continue;

      // Check if already exists
      const existing = await prisma.ticket.findUnique({
        where: { scenarioHash: t.scenarioHash },
        include: { images: true },
      });
      if (existing) {
        totalSkipped++;
        // Still try to attach missing images
        if (existing.images.length === 0) {
          // Resolve image for this ticket
          const situ = findSituationalImage(t.scenarioHash);
          let imageId: string | null = null;
          if (situ) {
            imageId = await getOrCreateLocalAsset(situ);
          } else {
            const signNum = imageMap.pddRef_to_image[t.pddRef];
            if (signNum) {
              imageId = await getOrCreateSignAsset(signNum);
            }
          }
          if (imageId) {
            try {
              await prisma.ticketImage.create({
                data: {
                  ticketId: existing.id,
                  imageId,
                  role: TicketImageRole.PRIMARY,
                },
              });
              batchImages++;
            } catch {
              // Ignore unique constraint conflicts
            }
          }
        }
        continue;
      }

      const difficulty = ["EASY", "MEDIUM", "HARD"].includes(t.difficulty)
        ? (t.difficulty as Difficulty)
        : Difficulty.MEDIUM;
      const tags = Array.isArray(t.tags) ? t.tags : ["general"];

      try {
        const created = await prisma.ticket.create({
          data: {
            questionRu: t.questionRu,
            questionUk: t.questionUk,
            explanationRu: t.explanationRu || "",
            explanationUk: t.explanationUk || "",
            pddRef: t.pddRef,
            difficulty,
            tags,
            status: TicketStatus.PUBLISHED,
            scenarioHash: t.scenarioHash,
            imageBrief: t.imageBrief || null,
            imageSearchQ: t.imageSearchQueries || [],
            options: {
              create: t.options.map((o: any, idx: number) => ({
                textRu: o.textRu,
                textUk: o.textUk,
                isCorrect: o.isCorrect,
                order: o.order ?? idx + 1,
              })),
            },
          },
        });
        batchCreated++;

        // Resolve image for this ticket:
        // 1. Try situational image by scenarioHash prefix
        // 2. Fall back to Wikimedia sign by pddRef
        const situ = findSituationalImage(t.scenarioHash);
        let imageId: string | null = null;
        if (situ) {
          imageId = await getOrCreateLocalAsset(situ);
        } else {
          const signNum = imageMap.pddRef_to_image[t.pddRef];
          if (signNum) {
            imageId = await getOrCreateSignAsset(signNum);
          }
        }

        if (imageId) {
          await prisma.ticketImage.create({
            data: {
              ticketId: created.id,
              imageId,
              role: TicketImageRole.PRIMARY,
            },
          });
          batchImages++;
        }
      } catch (e: any) {
        // Skip duplicates silently
      }
    }

    totalCreated += batchCreated;
    totalImagesLinked += batchImages;
    console.log(
      `batch-${batchNum}: ${tickets.length} tickets → ${batchCreated} created, ${batchImages} images linked`,
    );
  }

  console.log(
    `\nTotal: ${totalCreated} created, ${totalSkipped} skipped, ${totalImagesLinked} images linked`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
