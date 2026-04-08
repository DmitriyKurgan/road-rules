import "dotenv/config";
import { PrismaClient, Difficulty, TicketStatus, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";

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

  // Create 5 sample tickets
  const sampleTickets = [
    {
      questionRu: "Что означает дорожный знак 1.1?",
      questionUk: "Що означає дорожній знак 1.1?",
      explanationRu: "Знак 1.1 «Опасный поворот направо» предупреждает о закруглении дороги малого радиуса или с ограниченной обзорностью направо.",
      explanationUk: "Знак 1.1 «Небезпечний поворот праворуч» попереджає про закруглення дороги малого радіусу або з обмеженою оглядовістю праворуч.",
      pddRef: "1.1",
      difficulty: Difficulty.EASY,
      tags: ["signs", "warning"],
      status: TicketStatus.PUBLISHED,
      scenarioHash: "seed-ticket-001",
      imageSearchQ: [],
      options: {
        create: [
          { textRu: "Опасный поворот направо", textUk: "Небезпечний поворот праворуч", isCorrect: true, order: 1 },
          { textRu: "Поворот направо запрещён", textUk: "Поворот праворуч заборонено", isCorrect: false, order: 2 },
          { textRu: "Дорога с односторонним движением", textUk: "Дорога з одностороннім рухом", isCorrect: false, order: 3 },
          { textRu: "Место для разворота", textUk: "Місце для розвороту", isCorrect: false, order: 4 },
        ],
      },
    },
    {
      questionRu: "Какова максимальная разрешённая скорость в населённом пункте?",
      questionUk: "Яка максимальна дозволена швидкість у населеному пункті?",
      explanationRu: "Согласно п. 12.4 ПДД Украины, в населённых пунктах скорость движения ограничена 50 км/ч.",
      explanationUk: "Згідно з п. 12.4 ПДР України, у населених пунктах швидкість руху обмежена 50 км/год.",
      pddRef: "12.4",
      difficulty: Difficulty.EASY,
      tags: ["speed", "settlement"],
      status: TicketStatus.PUBLISHED,
      scenarioHash: "seed-ticket-002",
      imageSearchQ: [],
      options: {
        create: [
          { textRu: "60 км/ч", textUk: "60 км/год", isCorrect: false, order: 1 },
          { textRu: "50 км/ч", textUk: "50 км/год", isCorrect: true, order: 2 },
          { textRu: "40 км/ч", textUk: "40 км/год", isCorrect: false, order: 3 },
          { textRu: "70 км/ч", textUk: "70 км/год", isCorrect: false, order: 4 },
        ],
      },
    },
    {
      questionRu: "Что должен сделать водитель при повороте налево на регулируемом перекрёстке?",
      questionUk: "Що повинен зробити водій при повороті ліворуч на регульованому перехресті?",
      explanationRu: "Согласно п. 16.6 ПДД, при повороте налево водитель должен дать дорогу встречным транспортным средствам, движущимся прямо или направо.",
      explanationUk: "Згідно з п. 16.6 ПДР, при повороті ліворуч водій повинен дати дорогу зустрічним транспортним засобам, що рухаються прямо або праворуч.",
      pddRef: "16.6",
      difficulty: Difficulty.MEDIUM,
      tags: ["intersections", "priority", "turning"],
      status: TicketStatus.PUBLISHED,
      scenarioHash: "seed-ticket-003",
      imageSearchQ: [],
      options: {
        create: [
          { textRu: "Проехать первым", textUk: "Проїхати першим", isCorrect: false, order: 1 },
          { textRu: "Дать дорогу встречным ТС, движущимся прямо или направо", textUk: "Дати дорогу зустрічним ТЗ, що рухаються прямо або праворуч", isCorrect: true, order: 2 },
          { textRu: "Остановиться и ждать зелёного сигнала", textUk: "Зупинитися і чекати зеленого сигналу", isCorrect: false, order: 3 },
          { textRu: "Включить аварийную сигнализацию", textUk: "Увімкнути аварійну сигналізацію", isCorrect: false, order: 4 },
        ],
      },
    },
    {
      questionRu: "Можно ли выезжать на перекрёсток, если за ним образовался затор?",
      questionUk: "Чи можна виїжджати на перехрестя, якщо за ним утворився затор?",
      explanationRu: "Согласно п. 16.4 ПДД, запрещается выезжать на перекрёсток, если за ним образовался затор, который вынудит водителя остановиться на перекрёстке.",
      explanationUk: "Згідно з п. 16.4 ПДР, забороняється виїжджати на перехрестя, якщо за ним утворився затор, який змусить водія зупинитися на перехресті.",
      pddRef: "16.4",
      difficulty: Difficulty.HARD,
      tags: ["intersections", "traffic_jam"],
      status: TicketStatus.PUBLISHED,
      scenarioHash: "seed-ticket-004",
      imageSearchQ: [],
      options: {
        create: [
          { textRu: "Можно, если горит зелёный сигнал", textUk: "Можна, якщо горить зелений сигнал", isCorrect: false, order: 1 },
          { textRu: "Можно, при отсутствии пешеходов", textUk: "Можна, за відсутності пішоходів", isCorrect: false, order: 2 },
          { textRu: "Запрещено", textUk: "Заборонено", isCorrect: true, order: 3 },
          { textRu: "Можно, если водитель успеет проехать", textUk: "Можна, якщо водій встигне проїхати", isCorrect: false, order: 4 },
        ],
      },
    },
    {
      questionRu: "Кто имеет преимущество на перекрёстке равнозначных дорог?",
      questionUk: "Хто має перевагу на перехресті рівнозначних доріг?",
      explanationRu: "Согласно п. 16.12 ПДД, на перекрёстке равнозначных дорог преимущество имеет транспортное средство, приближающееся справа.",
      explanationUk: "Згідно з п. 16.12 ПДР, на перехресті рівнозначних доріг перевагу має транспортний засіб, що наближається справа.",
      pddRef: "16.12",
      difficulty: Difficulty.MEDIUM,
      tags: ["intersections", "priority", "equal_roads"],
      status: TicketStatus.PUBLISHED,
      scenarioHash: "seed-ticket-005",
      imageSearchQ: [],
      options: {
        create: [
          { textRu: "Водитель, который едет быстрее", textUk: "Водій, який їде швидше", isCorrect: false, order: 1 },
          { textRu: "Транспортное средство справа", textUk: "Транспортний засіб справа", isCorrect: true, order: 2 },
          { textRu: "Грузовой автомобиль", textUk: "Вантажний автомобіль", isCorrect: false, order: 3 },
          { textRu: "Транспортное средство слева", textUk: "Транспортний засіб зліва", isCorrect: false, order: 4 },
        ],
      },
    },
  ];

  for (const ticketData of sampleTickets) {
    await prisma.ticket.upsert({
      where: { scenarioHash: ticketData.scenarioHash },
      update: {},
      create: ticketData,
    });
  }

  console.log(`Seeded: admin=${admin.id}, user=${user.id}, tickets=${sampleTickets.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
