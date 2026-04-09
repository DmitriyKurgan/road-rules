import "dotenv/config";
import { PrismaClient, Difficulty, TicketStatus, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

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

  // Import all batch files
  const dataDir = path.resolve(__dirname, "../../../agents/data");
  let totalCreated = 0;
  let totalSkipped = 0;

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
    for (const t of tickets) {
      if (!t.questionRu || !t.questionUk || !t.scenarioHash || !t.pddRef) continue;
      if (!Array.isArray(t.options) || t.options.length < 2) continue;
      const correctCount = t.options.filter((o: any) => o.isCorrect).length;
      if (correctCount !== 1) continue;

      // Check if already exists
      const existing = await prisma.ticket.findUnique({
        where: { scenarioHash: t.scenarioHash },
      });
      if (existing) {
        totalSkipped++;
        continue;
      }

      const difficulty = ["EASY", "MEDIUM", "HARD"].includes(t.difficulty)
        ? (t.difficulty as Difficulty)
        : Difficulty.MEDIUM;
      const tags = Array.isArray(t.tags) ? t.tags : ["general"];

      try {
        await prisma.ticket.create({
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
      } catch (e: any) {
        // Skip duplicates silently
      }
    }

    totalCreated += batchCreated;
    console.log(`batch-${batchNum}: ${tickets.length} tickets → ${batchCreated} created`);
  }

  console.log(`\nTotal: ${totalCreated} created, ${totalSkipped} skipped (already exist)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
