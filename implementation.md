# Implementation Plan — Ukraine Traffic Rules Trainer

> **Executor**: Claude Sonnet 4.6 (code execution)
> **Runtime**: Node 20 LTS, pnpm 10+, Windows 10 (bash shell via Git Bash)
> **Root directory**: `d:\Work\AI\road-rules`

---

## Step 1: Project Scaffolding & Monorepo Setup

### 1.1 Initialize Git repository

```bash
cd d:/Work/AI/road-rules
git init
```

### 1.2 Create root configuration files

**Create file: `d:\Work\AI\road-rules\.gitignore`**
```gitignore
node_modules/
dist/
.next/
.env
.env.local
.env.production
*.log
.turbo/
coverage/
.DS_Store
Thumbs.db
prisma/*.db
prisma/migrations/**/migration_lock.toml
```

**Create file: `d:\Work\AI\road-rules\.nvmrc`**
```
20
```

**Create file: `d:\Work\AI\road-rules\.editorconfig`**
```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

### 1.3 Create root `package.json`

**Create file: `d:\Work\AI\road-rules\package.json`**
```json
{
  "name": "road-rules",
  "private": true,
  "packageManager": "pnpm@10.7.0",
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "db:migrate": "pnpm --filter @road-rules/api exec prisma migrate dev",
    "db:seed": "pnpm --filter @road-rules/api exec prisma db seed",
    "db:studio": "pnpm --filter @road-rules/api exec prisma studio"
  }
}
```

### 1.4 Create pnpm workspace config

**Create file: `d:\Work\AI\road-rules\pnpm-workspace.yaml`**
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### 1.5 Create Turborepo config

**Create file: `d:\Work\AI\road-rules\turbo.json`**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

Install turbo as a root dev dependency:
```bash
cd d:/Work/AI/road-rules
pnpm add -Dw turbo
```

### 1.6 Create directory structure

```bash
cd d:/Work/AI/road-rules
mkdir -p apps/web apps/api packages/shared/src
```

### 1.7 Scaffold Next.js frontend (`apps/web`)

```bash
cd d:/Work/AI/road-rules/apps
pnpm create next-app@latest web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack --use-pnpm
```

After scaffolding, update `apps/web/package.json` — set the `"name"` field:
```json
{
  "name": "@road-rules/web"
}
```

Delete all boilerplate content from `apps/web/src/app/page.tsx` and replace with a minimal placeholder:
```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-4xl font-bold">Road Rules — Ukraine PDD Trainer</h1>
    </main>
  );
}
```

Delete the default `globals.css` body styles (keep only the Tailwind directives):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Create file: `d:\Work\AI\road-rules\apps\web\next.config.ts`** (replace existing `.mjs` if created):
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "commons.wikimedia.org",
      },
    ],
  },
};

export default nextConfig;
```

### 1.8 Scaffold NestJS backend (`apps/api`)

```bash
cd d:/Work/AI/road-rules/apps
npx @nestjs/cli@latest new api --package-manager pnpm --strict --skip-git
```

After scaffolding, update `apps/api/package.json` — set the `"name"` field:
```json
{
  "name": "@road-rules/api"
}
```

Install additional NestJS dependencies:
```bash
cd d:/Work/AI/road-rules/apps/api
pnpm add @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer helmet
pnpm add -D @types/passport-jwt @types/bcrypt
```

Create the module directory structure:
```bash
cd d:/Work/AI/road-rules/apps/api/src
mkdir -p auth tickets sessions stats admin images common/decorators common/guards common/filters common/pipes
```

**Create file: `d:\Work\AI\road-rules\apps\api\.env.example`**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/road_rules?schema=public"
JWT_SECRET="change-me-jwt-secret-dev"
JWT_REFRESH_SECRET="change-me-jwt-refresh-secret-dev"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"
CORS_ORIGIN="http://localhost:3000"
PORT=3001
```

Copy `.env.example` to `.env`:
```bash
cp d:/Work/AI/road-rules/apps/api/.env.example d:/Work/AI/road-rules/apps/api/.env
```

Update `apps/api/src/main.ts`:
```ts
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix("api");

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}
bootstrap();
```

Update `apps/api/src/app.module.ts`:
```ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
  ],
})
export class AppModule {}
```

### 1.9 Create shared package (`packages/shared`)

**Create file: `d:\Work\AI\road-rules\packages\shared\package.json`**
```json
{
  "name": "@road-rules/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "lint": "echo 'no lint configured'"
  }
}
```

**Create file: `d:\Work\AI\road-rules\packages\shared\tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}
```

**Create file: `d:\Work\AI\road-rules\packages\shared\src\index.ts`**
```ts
export * from "./enums";
export * from "./types";
```

**Create file: `d:\Work\AI\road-rules\packages\shared\src\enums.ts`**
```ts
export enum TicketStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export enum SessionMode {
  EXAM = "EXAM",
  PRACTICE = "PRACTICE",
}

export enum Lang {
  RU = "ru",
  UK = "uk",
}

export enum Difficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
}

export enum TicketImageRole {
  PRIMARY = "PRIMARY",
  SECONDARY = "SECONDARY",
}
```

**Create file: `d:\Work\AI\road-rules\packages\shared\src\types.ts`**
```ts
import {
  TicketStatus,
  SessionMode,
  Lang,
  Difficulty,
  TicketImageRole,
} from "./enums";

export interface TicketOption {
  id: string;
  textRu: string;
  textUk: string;
  isCorrect: boolean;
  order: number;
}

export interface Ticket {
  id: string;
  questionRu: string;
  questionUk: string;
  explanationRu: string;
  explanationUk: string;
  pddRef: string;
  difficulty: Difficulty;
  tags: string[];
  status: TicketStatus;
  scenarioHash: string;
  options: TicketOption[];
}

export interface Session {
  id: string;
  userId: string | null;
  mode: SessionMode;
  lang: Lang;
  startedAt: string;
  endedAt: string | null;
  score: number | null;
}

export interface SessionResult {
  score: number;
  totalCorrect: number;
  totalQuestions: number;
  errors: Array<{
    ticketId: string;
    selectedOptionId: string;
    correctOptionId: string;
  }>;
  timeTotal: number;
  passed: boolean;
}

export interface ImageAsset {
  id: string;
  sourceUrl: string;
  storedKey: string;
  license: string;
  author: string;
  title: string;
  attributionHtml: string;
  sha256: string;
}

export interface TicketImage {
  ticketId: string;
  imageId: string;
  role: TicketImageRole;
}

// DTOs
export interface CreateSessionDto {
  mode: SessionMode;
  lang: Lang;
  topics?: string[];
  difficulty?: Difficulty;
}

export interface SubmitAnswerDto {
  ticketId: string;
  selectedOptionId: string;
  timeMs: number;
}

export interface ImportTicketDto {
  questionRu: string;
  questionUk: string;
  explanationRu: string;
  explanationUk: string;
  pddRef: string;
  difficulty: Difficulty;
  tags: string[];
  scenarioHash: string;
  imageBrief?: string;
  imageSearchQueries?: string[];
  options: Array<{
    textRu: string;
    textUk: string;
    isCorrect: boolean;
    order: number;
  }>;
}
```

### 1.10 Install root dependencies and link workspaces

```bash
cd d:/Work/AI/road-rules
pnpm install
```

### 1.11 Docker Compose for dev environment

**Create file: `d:\Work\AI\road-rules\docker-compose.yml`**
```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    container_name: road-rules-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: road_rules
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: road-rules-pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@local.dev
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

Start the database:
```bash
cd d:/Work/AI/road-rules
docker compose up -d postgres
```

### 1.12 ESLint & Prettier shared config

**Create file: `d:\Work\AI\road-rules\.prettierrc`**
```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

**Create file: `d:\Work\AI\road-rules\.prettierignore`**
```
node_modules
dist
.next
coverage
pnpm-lock.yaml
```

### 1.13 Validation

**Expected directory structure after Step 1:**
```
d:\Work\AI\road-rules\
├── .editorconfig
├── .gitignore
├── .nvmrc
├── .prettierrc
├── .prettierignore
├── docker-compose.yml
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── turbo.json
├── apps/
│   ├── web/          # Next.js app (App Router, TypeScript, Tailwind)
│   │   ├── src/app/
│   │   ├── next.config.ts
│   │   ├── package.json (name: @road-rules/web)
│   │   └── ...
│   └── api/          # NestJS app
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── auth/
│       │   ├── tickets/
│       │   ├── sessions/
│       │   ├── stats/
│       │   ├── admin/
│       │   ├── images/
│       │   └── common/
│       ├── .env
│       ├── .env.example
│       └── package.json (name: @road-rules/api)
└── packages/
    └── shared/
        ├── src/
        │   ├── index.ts
        │   ├── enums.ts
        │   └── types.ts
        ├── package.json (name: @road-rules/shared)
        └── tsconfig.json
```

**Verification commands:**
```bash
cd d:/Work/AI/road-rules
pnpm run build          # should succeed for all packages
docker compose ps       # postgres should be running
```

---

## Step 2: Database & Prisma ORM

### 2.1 Initialize Prisma in the API app

```bash
cd d:/Work/AI/road-rules/apps/api
pnpm add prisma @prisma/client
npx prisma init
```

This creates `apps/api/prisma/schema.prisma` and updates `.env`. The `.env` already has `DATABASE_URL` from step 1.8.

### 2.2 Define Prisma schema

**Replace entire content of `d:\Work\AI\road-rules\apps\api\prisma\schema.prisma`:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum TicketStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum SessionMode {
  EXAM
  PRACTICE
}

enum Lang {
  ru
  uk
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
}

enum TicketImageRole {
  PRIMARY
  SECONDARY
}

enum UserRole {
  USER
  ADMIN
}

model User {
  id             String    @id @default(uuid())
  email          String    @unique
  passwordHash   String
  role           UserRole  @default(USER)
  refreshToken   String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  sessions       Session[]

  @@map("users")
}

model Ticket {
  id              String         @id @default(uuid())
  questionRu      String
  questionUk      String
  explanationRu   String
  explanationUk   String
  pddRef          String
  difficulty      Difficulty
  tags            String[]
  status          TicketStatus   @default(DRAFT)
  scenarioHash    String         @unique
  imageBrief      String?
  imageSearchQ    String[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  options         TicketOption[]
  images          TicketImage[]
  sessionTickets  SessionTicket[]

  @@index([status])
  @@index([difficulty])
  @@index([tags], type: Gin)
  @@map("tickets")
}

model TicketOption {
  id        String  @id @default(uuid())
  ticketId  String
  textRu    String
  textUk    String
  isCorrect Boolean @default(false)
  order     Int

  ticket    Ticket  @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  answers   SessionAnswer[]

  @@unique([ticketId, order])
  @@map("ticket_options")
}

model ImageAsset {
  id              String   @id @default(uuid())
  sourceUrl       String
  storedKey       String   @unique
  license         String
  author          String
  title           String
  attributionHtml String
  sha256          String   @unique
  width           Int?
  height          Int?
  createdAt       DateTime @default(now())

  ticketImages    TicketImage[]

  @@map("image_assets")
}

model TicketImage {
  id        String          @id @default(uuid())
  ticketId  String
  imageId   String
  role      TicketImageRole @default(PRIMARY)

  ticket    Ticket     @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  image     ImageAsset @relation(fields: [imageId], references: [id], onDelete: Cascade)

  @@unique([ticketId, role])
  @@map("ticket_images")
}

model Session {
  id        String      @id @default(uuid())
  userId    String?
  mode      SessionMode
  lang      Lang        @default(ru)
  startedAt DateTime    @default(now())
  endedAt   DateTime?
  score     Int?

  user      User?       @relation(fields: [userId], references: [id], onDelete: SetNull)
  tickets   SessionTicket[]

  @@index([userId, startedAt])
  @@map("sessions")
}

model SessionTicket {
  id        String    @id @default(uuid())
  sessionId String
  ticketId  String
  order     Int

  session   Session   @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  ticket    Ticket    @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  answer    SessionAnswer?

  @@unique([sessionId, order])
  @@unique([sessionId, ticketId])
  @@map("session_tickets")
}

model SessionAnswer {
  id              String   @id @default(uuid())
  sessionTicketId String   @unique
  selectedOptionId String
  isCorrect       Boolean
  timeMs          Int
  answeredAt      DateTime @default(now())

  sessionTicket   SessionTicket @relation(fields: [sessionTicketId], references: [id], onDelete: Cascade)
  selectedOption  TicketOption  @relation(fields: [selectedOptionId], references: [id], onDelete: Cascade)

  @@map("session_answers")
}
```

### 2.3 Create Prisma service module in NestJS

**Create file: `d:\Work\AI\road-rules\apps\api\src\prisma\prisma.service.ts`**
```ts
import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

**Create file: `d:\Work\AI\road-rules\apps\api\src\prisma\prisma.module.ts`**
```ts
import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

Update `apps/api/src/app.module.ts` to import `PrismaModule`:
```ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ".env" }),
    PrismaModule,
  ],
})
export class AppModule {}
```

### 2.4 Run initial migration

Ensure PostgreSQL is running (from Step 1.11), then:
```bash
cd d:/Work/AI/road-rules/apps/api
npx prisma migrate dev --name init
```

**Verification:**
```bash
cd d:/Work/AI/road-rules/apps/api
npx prisma migrate status  # should show "init" migration applied
npx prisma generate         # should generate client successfully
```

### 2.5 Seed script

Add to `apps/api/package.json`:
```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

Install ts-node if not present:
```bash
cd d:/Work/AI/road-rules/apps/api
pnpm add -D ts-node
```

**Create file: `d:\Work\AI\road-rules\apps\api\prisma\seed.ts`**
```ts
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
      questionRu: "Что означает этот дорожный знак?",
      questionUk: "Що означає цей дорожній знак?",
      explanationRu: "Знак 1.1 предупреждает об опасном повороте направо.",
      explanationUk: "Знак 1.1 попереджає про небезпечний поворот праворуч.",
      pddRef: "1.1",
      difficulty: Difficulty.EASY,
      tags: ["signs", "warning"],
      status: TicketStatus.PUBLISHED,
      scenarioHash: "seed-ticket-001",
      options: {
        create: [
          { textRu: "Опасный поворот направо", textUk: "Небезпечний поворот праворуч", isCorrect: true, order: 1 },
          { textRu: "Поворот направо запрещён", textUk: "Поворот праворуч заборонено", isCorrect: false, order: 2 },
          { textRu: "Дорога с односторонним движением", textUk: "Дорога з одностороннім рухом", isCorrect: false, order: 3 },
          { textRu: "Место для разворота", textUk: "Місце для розвороту", isCorrect: false, order: 4 },
        ],
      },
    },
    // Add 4 more tickets with similar structure, different topics:
    // ticket 2: traffic lights topic, MEDIUM difficulty
    // ticket 3: road markings topic, EASY difficulty
    // ticket 4: intersection rules topic, HARD difficulty
    // ticket 5: pedestrian rules topic, MEDIUM difficulty
  ];

  for (const ticketData of sampleTickets) {
    await prisma.ticket.create({ data: ticketData });
  }

  console.log(`Seeded: admin=${admin.id}, user=${user.id}, tickets=${sampleTickets.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

**Note to executor**: Expand the `sampleTickets` array to contain 5 complete tickets with 4 options each. The first one is shown as a template. Use different `tags`, `difficulty`, `pddRef`, and `scenarioHash` values for each.

Run seed:
```bash
cd d:/Work/AI/road-rules/apps/api
npx prisma db seed
```

**Verification:**
```bash
cd d:/Work/AI/road-rules/apps/api
npx prisma studio  # opens browser, verify users and tickets tables have data
```

---

## Step 3: Backend — Auth Module

### 3.1 Create auth module files

```bash
cd d:/Work/AI/road-rules/apps/api/src/auth
```

Create the following files in `apps/api/src/auth/`:

**`d:\Work\AI\road-rules\apps\api\src\auth\auth.module.ts`**
```ts
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./jwt.strategy";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: config.get<string>("JWT_ACCESS_EXPIRY", "15m") },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
```

**`d:\Work\AI\road-rules\apps\api\src\auth\auth.service.ts`**
Structure:
- Inject `PrismaService`, `JwtService`, `ConfigService`
- `register(email, password)` — hash password with bcrypt (10 rounds), create user, return tokens
- `login(email, password)` — find user, verify password, return tokens
- `refreshTokens(userId, refreshToken)` — verify stored refresh token, rotate, return new pair
- `logout(userId)` — set `refreshToken` to null in DB
- `getProfile(userId)` — return user without passwordHash
- Private `generateTokens(userId, email, role)` — sign access + refresh JWT, store refresh hash in DB

**`d:\Work\AI\road-rules\apps\api\src\auth\auth.controller.ts`**
Endpoints:
- `POST /auth/register` body: `{ email: string, password: string }` -> returns `{ accessToken, refreshToken }`
- `POST /auth/login` body: `{ email: string, password: string }` -> returns `{ accessToken, refreshToken }`
- `POST /auth/refresh` body: `{ refreshToken: string }` -> returns `{ accessToken, refreshToken }`
- `POST /auth/logout` (requires auth) -> returns `{ message: "ok" }`
- `GET /auth/me` (requires auth) -> returns user profile

**`d:\Work\AI\road-rules\apps\api\src\auth\jwt.strategy.ts`**
```ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>("JWT_SECRET"),
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException();
    return { id: user.id, email: user.email, role: user.role };
  }
}
```

**`d:\Work\AI\road-rules\apps\api\src\auth\jwt-auth.guard.ts`**
```ts
import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../common/decorators/public.decorator";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

**`d:\Work\AI\road-rules\apps\api\src\auth\dto\register.dto.ts`**
```ts
import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

**`d:\Work\AI\road-rules\apps\api\src\auth\dto\login.dto.ts`** — same structure as RegisterDto.

**`d:\Work\AI\road-rules\apps\api\src\auth\dto\refresh.dto.ts`**
```ts
import { IsString } from "class-validator";

export class RefreshDto {
  @IsString()
  refreshToken: string;
}
```

### 3.2 Create common decorators and guards

**`d:\Work\AI\road-rules\apps\api\src\common\decorators\public.decorator.ts`**
```ts
import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

**`d:\Work\AI\road-rules\apps\api\src\common\decorators\current-user.decorator.ts`**
```ts
import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (data) return request.user?.[data];
    return request.user;
  },
);
```

**`d:\Work\AI\road-rules\apps\api\src\common\guards\roles.guard.ts`**
```ts
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

export const ROLES_KEY = "roles";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

Note: Add missing `import { SetMetadata } from "@nestjs/common"` in the roles guard file.

### 3.3 Register AuthModule in AppModule

Update `apps/api/src/app.module.ts`:
```ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ".env" }),
    PrismaModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
```

### 3.4 Verification

```bash
cd d:/Work/AI/road-rules/apps/api
pnpm run build  # should compile without errors
pnpm run start:dev  # should start on port 3001
```

Test with curl:
```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Me (use token from login response)
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

## Step 4: Backend — Tickets Module

### 4.1 Create tickets module files

Create files in `apps/api/src/tickets/`:

**`d:\Work\AI\road-rules\apps\api\src\tickets\tickets.module.ts`**
```ts
import { Module } from "@nestjs/common";
import { TicketsService } from "./tickets.service";
import { TicketsController } from "./tickets.controller";

@Module({
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
```

**`d:\Work\AI\road-rules\apps\api\src\tickets\tickets.service.ts`**
Structure:
- Inject `PrismaService`
- `findById(id: string)` — return ticket with options and images, throw NotFoundException if not found
- `findMany(filters: TicketFilterDto)` — query with pagination, status/difficulty/tag filters, search on questionRu/questionUk. Return `{ data: Ticket[], total: number, page: number, pageSize: number }`
- `importBulk(tickets: ImportTicketDto[])` — wrap in `prisma.$transaction()`, validate each ticket (exactly 4 options, exactly 1 correct, unique scenarioHash), create tickets+options, return `{ total, created, errors: { index, message }[] }`
- `publish(id: string)` — set status to PUBLISHED, only if current status is DRAFT
- `selectForSession(params: { count: number, excludeTicketIds?: string[], topics?: string[], difficulty?: Difficulty })` — select random published tickets using SQL `ORDER BY RANDOM()` with filters. Return ticket IDs.

**`d:\Work\AI\road-rules\apps\api\src\tickets\tickets.controller.ts`**
Endpoints:
- `GET /tickets` (public) — list published tickets, query params: `page`, `pageSize`, `difficulty`, `tags`, `search`
- `GET /tickets/:id` (public) — single ticket with options (hide `isCorrect` for non-admin)

**`d:\Work\AI\road-rules\apps\api\src\tickets\dto\ticket-filter.dto.ts`**
```ts
import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import { Difficulty, TicketStatus } from "@prisma/client";

export class TicketFilterDto {
  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  page?: number = 1;

  @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number)
  pageSize?: number = 20;

  @IsOptional() @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional() @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsString({ each: true })
  tags?: string[];
}
```

### 4.2 Create admin tickets controller

**`d:\Work\AI\road-rules\apps\api\src\admin\admin-tickets.controller.ts`**
Endpoints (all require ADMIN role):
- `POST /admin/tickets/import` body: `{ tickets: ImportTicketDto[] }` -> calls `ticketsService.importBulk()`
- `POST /admin/tickets/:id/publish` -> calls `ticketsService.publish()`
- `GET /admin/tickets` -> list all tickets (including drafts)
- `GET /admin/tickets/:id` -> full ticket with `isCorrect` visible

**`d:\Work\AI\road-rules\apps\api\src\admin\admin.module.ts`**
```ts
import { Module } from "@nestjs/common";
import { AdminTicketsController } from "./admin-tickets.controller";
import { TicketsModule } from "../tickets/tickets.module";

@Module({
  imports: [TicketsModule],
  controllers: [AdminTicketsController],
})
export class AdminModule {}
```

### 4.3 Register modules in AppModule

Update `apps/api/src/app.module.ts` imports array to include `TicketsModule` and `AdminModule`.

### 4.4 Verification

```bash
cd d:/Work/AI/road-rules/apps/api
pnpm run build
```

Test ticket listing:
```bash
curl http://localhost:3001/api/tickets  # should return seeded tickets
curl http://localhost:3001/api/tickets?difficulty=EASY
```

---

## Step 5: Backend — Sessions Module

### 5.1 Create sessions module files

Create files in `apps/api/src/sessions/`:

**`d:\Work\AI\road-rules\apps\api\src\sessions\sessions.module.ts`**
```ts
import { Module } from "@nestjs/common";
import { SessionsService } from "./sessions.service";
import { SessionsController } from "./sessions.controller";
import { TicketsModule } from "../tickets/tickets.module";

@Module({
  imports: [TicketsModule],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
```

**`d:\Work\AI\road-rules\apps\api\src\sessions\sessions.service.ts`**
Structure:
- Inject `PrismaService`, `TicketsService`
- `create(dto: CreateSessionDto, userId?: string)`:
  1. Call `ticketsService.selectForSession({ count: 20, topics: dto.topics, difficulty: dto.difficulty })`
  2. Create `Session` record with `mode`, `lang`, `userId`
  3. Create 20 `SessionTicket` records with `order: 1..20`
  4. Return session with ticket IDs
- `getSession(sessionId: string)`:
  1. Return session with all sessionTickets (include ticket with options, exclude `isCorrect`), answers, progress
  2. Calculate: `totalAnswered`, `totalCorrect`, `currentTicketOrder`
- `submitAnswer(sessionId: string, dto: SubmitAnswerDto)`:
  1. Find `SessionTicket` by `sessionId` + `ticketId`
  2. Validate: not already answered, session not finished
  3. Find correct option for the ticket
  4. Create `SessionAnswer` with `isCorrect` computed
  5. Return `{ isCorrect, correctOptionId, explanation(ru/uk), nextTicketId | null }`
- `finish(sessionId: string)`:
  1. Count correct answers from `SessionAnswer`
  2. Set `endedAt`, `score`
  3. Return `SessionResult`

**`d:\Work\AI\road-rules\apps\api\src\sessions\sessions.controller.ts`**
Endpoints:
- `POST /sessions` (public — allows guest) — body: `CreateSessionDto`. Use `@CurrentUser()` optionally
- `GET /sessions/:id` (public) — session state
- `POST /sessions/:id/answer` (public) — body: `SubmitAnswerDto`
- `POST /sessions/:id/finish` (public) — finish session

Mark all session endpoints with `@Public()` decorator since guests can use them. Validate ownership inside the service if `userId` is present.

**`d:\Work\AI\road-rules\apps\api\src\sessions\dto\create-session.dto.ts`**
```ts
import { IsEnum, IsOptional, IsString } from "class-validator";
import { SessionMode, Lang, Difficulty } from "@prisma/client";

export class CreateSessionDto {
  @IsEnum(SessionMode)
  mode: SessionMode;

  @IsEnum(Lang)
  lang: Lang;

  @IsOptional() @IsString({ each: true })
  topics?: string[];

  @IsOptional() @IsEnum(Difficulty)
  difficulty?: Difficulty;
}
```

**`d:\Work\AI\road-rules\apps\api\src\sessions\dto\submit-answer.dto.ts`**
```ts
import { IsString, IsInt, Min } from "class-validator";

export class SubmitAnswerDto {
  @IsString()
  ticketId: string;

  @IsString()
  selectedOptionId: string;

  @IsInt() @Min(0)
  timeMs: number;
}
```

### 5.2 Register SessionsModule in AppModule

Add `SessionsModule` to imports in `apps/api/src/app.module.ts`.

### 5.3 Verification

```bash
cd d:/Work/AI/road-rules/apps/api
pnpm run build
```

Test session flow:
```bash
# Create session (guest)
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"mode":"EXAM","lang":"ru"}'

# Get session state (use ID from response)
curl http://localhost:3001/api/sessions/<SESSION_ID>

# Submit answer
curl -X POST http://localhost:3001/api/sessions/<SESSION_ID>/answer \
  -H "Content-Type: application/json" \
  -d '{"ticketId":"<TICKET_ID>","selectedOptionId":"<OPTION_ID>","timeMs":5000}'
```

---

## Step 6: Backend — Stats Module

### 6.1 Create stats module files

Create files in `apps/api/src/stats/`:

**`d:\Work\AI\road-rules\apps\api\src\stats\stats.module.ts`**
```ts
import { Module } from "@nestjs/common";
import { StatsService } from "./stats.service";
import { StatsController } from "./stats.controller";

@Module({
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
```

**`d:\Work\AI\road-rules\apps\api\src\stats\stats.service.ts`**
Structure:
- Inject `PrismaService`
- `getOverview(userId: string)`:
  - Query: count sessions, average score, max score
  - Current streak: count consecutive sessions with score >= 18 (passed) from most recent backward
  - Accuracy by difficulty: join `SessionAnswer` -> `SessionTicket` -> `Ticket`, group by `difficulty`
  - Sessions over time: group by date for last 30 days
  - Return `{ totalSessions, avgScore, bestScore, currentStreak, accuracyByDifficulty, sessionsOverTime }`
- `getTopicStats(userId: string)`:
  - Join through to `Ticket.tags`, compute accuracy per tag
  - Sort by error rate descending for "weakest topics"
  - Return `{ topics: { tag, totalAnswered, correct, accuracy }[], weakest: string[] }`

**`d:\Work\AI\road-rules\apps\api\src\stats\stats.controller.ts`**
Endpoints (all require auth):
- `GET /stats/overview` -> `statsService.getOverview(userId)`
- `GET /stats/topics` -> `statsService.getTopicStats(userId)`

### 6.2 Register StatsModule in AppModule

Add `StatsModule` to imports in `apps/api/src/app.module.ts`.

### 6.3 Verification

```bash
cd d:/Work/AI/road-rules/apps/api
pnpm run build
```

---

## Step 7: Backend — Images Module

### 7.1 Create images module files

Create files in `apps/api/src/images/`:

**`d:\Work\AI\road-rules\apps\api\src\images\images.module.ts`**
```ts
import { Module } from "@nestjs/common";
import { ImagesService } from "./images.service";
import { AdminImagesController } from "./admin-images.controller";

@Module({
  controllers: [AdminImagesController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}
```

**`d:\Work\AI\road-rules\apps\api\src\images\images.service.ts`**
Structure:
- Inject `PrismaService`, `ConfigService`
- `searchWikimedia(query: string)`:
  - HTTP GET to `https://commons.wikimedia.org/w/api.php` with params: `action=query`, `generator=search`, `gsrsearch=<query>`, `gsrnamespace=6`, `prop=imageinfo`, `iiprop=url|extmetadata|size`, `format=json`
  - Parse response, extract for each result: `pageUrl`, `fileUrl`, `license`, `author`, `title`
  - Filter by allowed licenses: `CC0`, `Public domain`, `CC-BY`, `CC-BY-SA`
  - Build TASL attribution string: `"<Title> by <Author>, <License>, via Wikimedia Commons"`
  - Return candidate list
- `attachImage(ticketId: string, imageData: { sourceUrl, license, author, title, attributionHtml })`:
  - Download image from `sourceUrl`
  - Compute sha256 hash
  - Check for duplicate by hash
  - Store file locally in `uploads/images/{sha256}.webp` (or S3 in production)
  - Create `ImageAsset` and `TicketImage` records

Install HTTP client:
```bash
cd d:/Work/AI/road-rules/apps/api
pnpm add axios
```

**`d:\Work\AI\road-rules\apps\api\src\images\admin-images.controller.ts`**
Endpoints (all require ADMIN role):
- `POST /admin/images/resolve` body: `{ query: string, ticketId?: string }` -> `imagesService.searchWikimedia()`
- `POST /admin/images/attach` body: `{ ticketId, sourceUrl, license, author, title, attributionHtml, role }` -> `imagesService.attachImage()`

### 7.2 Register ImagesModule in AppModule and AdminModule

Add `ImagesModule` to imports in `apps/api/src/app.module.ts`.

### 7.3 Create uploads directory

```bash
mkdir -p d:/Work/AI/road-rules/apps/api/uploads/images
```

Add `uploads/` to `apps/api/.gitignore`.

### 7.4 Verification

```bash
cd d:/Work/AI/road-rules/apps/api
pnpm run build
```

---

## Step 8: Backend — Health Check & Final API Assembly

### 8.1 Add health endpoint

**Create file: `d:\Work\AI\road-rules\apps\api\src\health\health.controller.ts`**
```ts
import { Controller, Get } from "@nestjs/common";
import { Public } from "../common/decorators/public.decorator";

@Controller("health")
export class HealthController {
  @Get()
  @Public()
  check() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }
}
```

**Create file: `d:\Work\AI\road-rules\apps\api\src\health\health.module.ts`**
```ts
import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";

@Module({ controllers: [HealthController] })
export class HealthModule {}
```

### 8.2 Final AppModule

**`d:\Work\AI\road-rules\apps\api\src\app.module.ts`** final state:
```ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { TicketsModule } from "./tickets/tickets.module";
import { SessionsModule } from "./sessions/sessions.module";
import { StatsModule } from "./stats/stats.module";
import { ImagesModule } from "./images/images.module";
import { AdminModule } from "./admin/admin.module";
import { HealthModule } from "./health/health.module";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ".env" }),
    PrismaModule,
    AuthModule,
    TicketsModule,
    SessionsModule,
    StatsModule,
    ImagesModule,
    AdminModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
```

### 8.3 Verification

```bash
cd d:/Work/AI/road-rules/apps/api
pnpm run build
pnpm run start:dev
curl http://localhost:3001/api/health  # should return {"status":"ok","timestamp":"..."}
```

---

## Step 9: Frontend — Core Layout & i18n

### 9.1 Install frontend dependencies

```bash
cd d:/Work/AI/road-rules/apps/web
pnpm add next-intl zustand axios
pnpm add -D @types/node
```

### 9.2 Set up i18n with next-intl

**Create file: `d:\Work\AI\road-rules\apps\web\src\i18n\request.ts`**
```ts
import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "ru";

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

**Create file: `d:\Work\AI\road-rules\apps\web\messages\ru.json`**
```json
{
  "common": {
    "appName": "ПДД Украины — Тренажёр",
    "home": "Главная",
    "practice": "Практика",
    "exam": "Экзамен",
    "stats": "Статистика",
    "login": "Войти",
    "register": "Регистрация",
    "logout": "Выйти",
    "language": "Язык",
    "next": "Далее",
    "back": "Назад",
    "start": "Начать",
    "finish": "Завершить",
    "tryAgain": "Попробовать снова",
    "loading": "Загрузка..."
  },
  "quiz": {
    "question": "Вопрос",
    "of": "из",
    "timeRemaining": "Осталось времени",
    "errors": "Ошибки",
    "passed": "Сдано!",
    "failed": "Не сдано",
    "score": "Результат",
    "correctAnswer": "Правильный ответ",
    "explanation": "Пояснение",
    "pddReference": "Ссылка на ПДД"
  },
  "stats": {
    "overview": "Обзор",
    "totalSessions": "Всего сессий",
    "avgScore": "Средний балл",
    "bestScore": "Лучший результат",
    "streak": "Серия",
    "byTopic": "По темам",
    "weakTopics": "Слабые темы",
    "practiceThis": "Практиковать эту тему"
  },
  "auth": {
    "email": "Email",
    "password": "Пароль",
    "loginTitle": "Вход",
    "registerTitle": "Регистрация",
    "noAccount": "Нет аккаунта?",
    "hasAccount": "Уже есть аккаунт?"
  },
  "footer": {
    "disclaimer": "Учебный материал. Для официальных правил обращайтесь к действующей редакции ПДД Украины."
  }
}
```

**Create file: `d:\Work\AI\road-rules\apps\web\messages\uk.json`**
Same structure as `ru.json` but with Ukrainian translations. Key translations:
- `appName`: "ПДР України — Тренажер"
- `home`: "Головна"
- `practice`: "Практика"
- `exam`: "Іспит"
- `stats`: "Статистика"
- `login`: "Увійти"
- `register`: "Реєстрація"
- `logout`: "Вийти"
- etc.

### 9.3 Configure next-intl plugin

Update `d:\Work\AI\road-rules\apps\web\next.config.ts`:
```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "commons.wikimedia.org" },
    ],
  },
};

export default withNextIntl(nextConfig);
```

### 9.4 Create API client utility

**Create file: `d:\Work\AI\road-rules\apps\web\src\lib\api.ts`**
```ts
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  withCredentials: true,
});

// Request interceptor: attach token from localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor: handle 401 -> try refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt token refresh logic
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const res = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/auth/refresh`,
            { refreshToken },
          );
          localStorage.setItem("accessToken", res.data.accessToken);
          localStorage.setItem("refreshToken", res.data.refreshToken);
          error.config.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return api(error.config);
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
```

### 9.5 Create auth store (Zustand)

**Create file: `d:\Work\AI\road-rules\apps\web\src\store\auth.ts`**
```ts
import { create } from "zustand";
import api from "@/lib/api";

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,

  login: async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("accessToken", res.data.accessToken);
    localStorage.setItem("refreshToken", res.data.refreshToken);
    const profile = await api.get("/auth/me");
    set({ user: profile.data });
  },

  register: async (email, password) => {
    const res = await api.post("/auth/register", { email, password });
    localStorage.setItem("accessToken", res.data.accessToken);
    localStorage.setItem("refreshToken", res.data.refreshToken);
    const profile = await api.get("/auth/me");
    set({ user: profile.data });
  },

  logout: async () => {
    try { await api.post("/auth/logout"); } catch {}
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    set({ user: null });
  },

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get("/auth/me");
      set({ user: res.data, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));
```

### 9.6 Create app layout

**Create file: `d:\Work\AI\road-rules\apps\web\src\components\Header.tsx`**
```tsx
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const t = useTranslations("common");
  const { user, logout } = useAuthStore();

  return (
    <header className="border-b bg-white shadow-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-blue-700">
          {t("appName")}
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/practice" className="hover:text-blue-600">{t("practice")}</Link>
          <Link href="/exam" className="hover:text-blue-600">{t("exam")}</Link>
          {user && <Link href="/stats" className="hover:text-blue-600">{t("stats")}</Link>}
          <LanguageSwitcher />
          {user ? (
            <button onClick={() => logout()} className="text-sm text-gray-500 hover:text-red-600">
              {t("logout")}
            </button>
          ) : (
            <Link href="/login" className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
              {t("login")}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
```

**Create file: `d:\Work\AI\road-rules\apps\web\src\components\Footer.tsx`**
```tsx
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="border-t bg-gray-50 py-6 text-center text-sm text-gray-500">
      {t("disclaimer")}
    </footer>
  );
}
```

**Create file: `d:\Work\AI\road-rules\apps\web\src\components\LanguageSwitcher.tsx`**
```tsx
"use client";

import { useRouter } from "next/navigation";

export function LanguageSwitcher() {
  const router = useRouter();

  const switchLocale = (locale: string) => {
    document.cookie = `locale=${locale};path=/;max-age=31536000`;
    router.refresh();
  };

  return (
    <div className="flex gap-1 text-sm">
      <button onClick={() => switchLocale("ru")} className="hover:underline">RU</button>
      <span>/</span>
      <button onClick={() => switchLocale("uk")} className="hover:underline">UA</button>
    </div>
  );
}
```

Update `d:\Work\AI\road-rules\apps\web\src\app\layout.tsx`:
```tsx
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDD Ukraine — Traffic Rules Trainer",
  description: "Practice Ukrainian traffic rules (PDD) with exam simulation",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="flex min-h-screen flex-col">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### 9.7 Add environment variable for API URL

**Create file: `d:\Work\AI\road-rules\apps\web\.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 9.8 Verification

```bash
cd d:/Work/AI/road-rules/apps/web
pnpm run build  # should succeed
pnpm run dev    # should start on port 3000, show header/footer/language switcher
```

---

## Step 10: Frontend — Auth Pages

### 10.1 Login page

**Create file: `d:\Work\AI\road-rules\apps\web\src\app\login\page.tsx`**
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="mx-auto mt-20 max-w-md rounded-lg border p-8 shadow">
      <h1 className="mb-6 text-2xl font-bold">{t("loginTitle")}</h1>
      {error && <p className="mb-4 text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder={t("email")} className="w-full rounded border px-4 py-2" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder={t("password")} className="w-full rounded border px-4 py-2" required />
        <button type="submit" className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700">
          {t("loginTitle")}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        {t("noAccount")} <Link href="/register" className="text-blue-600 hover:underline">{t("registerTitle")}</Link>
      </p>
    </div>
  );
}
```

### 10.2 Register page

**Create file: `d:\Work\AI\road-rules\apps\web\src\app\register\page.tsx`**
Same structure as login page but:
- Calls `register(email, password)` instead of `login`
- Link at bottom points to `/login` with `hasAccount` text

### 10.3 Verification

```bash
cd d:/Work/AI/road-rules/apps/web
pnpm run dev
```
Navigate to `http://localhost:3000/login` and `http://localhost:3000/register` — forms should render.

---

## Step 11: Frontend — Quiz Runner (Core Feature)

### 11.1 Create quiz store (Zustand)

**Create file: `d:\Work\AI\road-rules\apps\web\src\store\quiz.ts`**
```ts
import { create } from "zustand";
import api from "@/lib/api";

interface QuizTicket {
  id: string;
  questionRu: string;
  questionUk: string;
  options: Array<{
    id: string;
    textRu: string;
    textUk: string;
    order: number;
  }>;
  images?: Array<{ url: string; attributionHtml: string }>;
}

interface AnswerResult {
  isCorrect: boolean;
  correctOptionId: string;
  explanationRu: string;
  explanationUk: string;
}

interface QuizState {
  sessionId: string | null;
  mode: "EXAM" | "PRACTICE" | null;
  lang: "ru" | "uk";
  tickets: QuizTicket[];
  currentIndex: number;
  answers: Map<string, AnswerResult & { selectedOptionId: string }>;
  score: number | null;
  isFinished: boolean;
  isLoading: boolean;
  startTime: number | null;

  startSession: (mode: "EXAM" | "PRACTICE", lang: "ru" | "uk", topics?: string[], difficulty?: string) => Promise<void>;
  submitAnswer: (ticketId: string, optionId: string, timeMs: number) => Promise<AnswerResult>;
  nextTicket: () => void;
  finishSession: () => Promise<any>;
  reset: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  sessionId: null,
  mode: null,
  lang: "ru",
  tickets: [],
  currentIndex: 0,
  answers: new Map(),
  score: null,
  isFinished: false,
  isLoading: false,
  startTime: null,

  startSession: async (mode, lang, topics, difficulty) => {
    set({ isLoading: true });
    const res = await api.post("/sessions", { mode, lang, topics, difficulty });
    set({
      sessionId: res.data.id,
      mode,
      lang,
      tickets: res.data.tickets,
      currentIndex: 0,
      answers: new Map(),
      score: null,
      isFinished: false,
      isLoading: false,
      startTime: Date.now(),
    });
  },

  submitAnswer: async (ticketId, optionId, timeMs) => {
    const { sessionId } = get();
    const res = await api.post(`/sessions/${sessionId}/answer`, {
      ticketId, selectedOptionId: optionId, timeMs,
    });
    const result = { ...res.data, selectedOptionId: optionId };
    set((state) => {
      const newAnswers = new Map(state.answers);
      newAnswers.set(ticketId, result);
      return { answers: newAnswers };
    });
    return res.data;
  },

  nextTicket: () => set((state) => ({ currentIndex: state.currentIndex + 1 })),

  finishSession: async () => {
    const { sessionId } = get();
    const res = await api.post(`/sessions/${sessionId}/finish`);
    set({ score: res.data.score, isFinished: true });
    return res.data;
  },

  reset: () => set({
    sessionId: null, mode: null, tickets: [], currentIndex: 0,
    answers: new Map(), score: null, isFinished: false, isLoading: false, startTime: null,
  }),
}));
```

### 11.2 Session start page

**Create file: `d:\Work\AI\road-rules\apps\web\src\app\practice\page.tsx`**
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuizStore } from "@/store/quiz";

export default function PracticePage() {
  const t = useTranslations("common");
  const router = useRouter();
  const { startSession, isLoading } = useQuizStore();
  const [lang, setLang] = useState<"ru" | "uk">("ru");

  const handleStart = async () => {
    await startSession("PRACTICE", lang);
    router.push("/quiz");
  };

  return (
    <div className="mx-auto mt-20 max-w-lg text-center">
      <h1 className="mb-6 text-3xl font-bold">{t("practice")}</h1>
      <div className="mb-6 flex justify-center gap-4">
        <button onClick={() => setLang("ru")}
          className={`rounded px-4 py-2 ${lang === "ru" ? "bg-blue-600 text-white" : "border"}`}>
          Русский
        </button>
        <button onClick={() => setLang("uk")}
          className={`rounded px-4 py-2 ${lang === "uk" ? "bg-blue-600 text-white" : "border"}`}>
          Українська
        </button>
      </div>
      <button onClick={handleStart} disabled={isLoading}
        className="rounded bg-green-600 px-8 py-3 text-lg text-white hover:bg-green-700 disabled:opacity-50">
        {isLoading ? t("loading") : t("start")}
      </button>
    </div>
  );
}
```

**Create file: `d:\Work\AI\road-rules\apps\web\src\app\exam\page.tsx`**
Same as practice but passes `"EXAM"` to `startSession`. Add a note about 20-minute time limit.

### 11.3 Quiz page with ticket card

**Create file: `d:\Work\AI\road-rules\apps\web\src\app\quiz\page.tsx`**
```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuizStore } from "@/store/quiz";
import { TicketCard } from "@/components/quiz/TicketCard";
import { QuizProgress } from "@/components/quiz/QuizProgress";
import { QuizTimer } from "@/components/quiz/QuizTimer";

export default function QuizPage() {
  const router = useRouter();
  const { sessionId, tickets, currentIndex, mode, isFinished, finishSession } = useQuizStore();

  useEffect(() => {
    if (!sessionId) router.push("/");
    if (isFinished) router.push("/results");
  }, [sessionId, isFinished]);

  if (!sessionId || tickets.length === 0) return null;

  const currentTicket = tickets[currentIndex];
  const isLastTicket = currentIndex >= tickets.length - 1;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <QuizProgress current={currentIndex + 1} total={tickets.length} />
        {mode === "EXAM" && <QuizTimer onTimeout={() => finishSession().then(() => router.push("/results"))} />}
      </div>
      {currentTicket && (
        <TicketCard
          ticket={currentTicket}
          isLast={isLastTicket}
        />
      )}
    </div>
  );
}
```

### 11.4 TicketCard component

**Create file: `d:\Work\AI\road-rules\apps\web\src\components\quiz\TicketCard.tsx`**
Structure:
- Props: `ticket`, `isLast`
- State: `selectedOptionId`, `answerResult`, `isSubmitting`, `ticketStartTime`
- Renders: question text (using `lang` from quiz store), image if present, 4 option buttons
- On option click: call `submitAnswer()`, show green/red highlights, show explanation
- After answer: show "Next" button (or "Finish" if last)
- "Next" calls `nextTicket()`, "Finish" calls `finishSession()`
- Option buttons: disabled after selection, green border for correct, red border for selected-wrong
- Explanation: collapsible section with PDD reference

### 11.5 QuizProgress component

**Create file: `d:\Work\AI\road-rules\apps\web\src\components\quiz\QuizProgress.tsx`**
```tsx
export function QuizProgress({ current, total }: { current: number; total: number }) {
  const percent = (current / total) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium">{current}/{total}</span>
      <div className="h-2 w-48 rounded-full bg-gray-200">
        <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
```

### 11.6 QuizTimer component

**Create file: `d:\Work\AI\road-rules\apps\web\src\components\quiz\QuizTimer.tsx`**
Structure:
- Props: `onTimeout: () => void`
- State: `remaining` in seconds, starts at 1200 (20 minutes)
- `useEffect` with `setInterval(1000)` to decrement
- When `remaining <= 0`, call `onTimeout()`
- Display: `MM:SS` format, red color when < 2 minutes

### 11.7 Results page

**Create file: `d:\Work\AI\road-rules\apps\web\src\app\results\page.tsx`**
Structure:
- Read from quiz store: `score`, `answers`, `tickets`, `mode`
- Display: large score "18/20", "Passed!" / "Not passed" (exam: pass if <= 2 errors)
- List of wrong answers with: question text, selected answer (red), correct answer (green), explanation
- Buttons: "Try again" (resets store, navigates to practice/exam), "View stats" (navigate to /stats)
- "Practice weak topics" button if authenticated

### 11.8 Verification

```bash
cd d:/Work/AI/road-rules/apps/web
pnpm run build
```

Start both API and web, navigate to `/practice`, start a session, answer questions, verify results page.

---

## Step 12: Frontend — Stats & Profile

### 12.1 Install chart library

```bash
cd d:/Work/AI/road-rules/apps/web
pnpm add recharts
```

### 12.2 Stats page

**Create file: `d:\Work\AI\road-rules\apps\web\src\app\stats\page.tsx`**
Structure:
- Fetch data from `/stats/overview` and `/stats/topics` on mount
- Display overview cards: Total sessions, Avg score, Best score, Current streak (4 cards in a grid)
- Line chart (recharts `LineChart`): sessions over last 30 days, Y-axis = score
- Bar chart (recharts `BarChart`): accuracy per topic
- Weakest topics section with "Practice this topic" buttons
- If not authenticated, redirect to `/login`

### 12.3 Session history page

**Create file: `d:\Work\AI\road-rules\apps\web\src\app\history\page.tsx`**
Structure:
- Fetch from `/sessions?userId=me` with pagination
- Table: Date, Mode (Exam/Practice), Score, Time, Actions (View details)
- Click "View details" -> expand to show all answers for that session

### 12.4 Protected route wrapper

**Create file: `d:\Work\AI\road-rules\apps\web\src\components\ProtectedRoute.tsx`**
```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, fetchProfile } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading]);

  if (isLoading) return <div className="mt-20 text-center">Loading...</div>;
  if (!user) return null;
  return <>{children}</>;
}
```

Wrap `/stats` and `/history` page content with `<ProtectedRoute>`.

### 12.5 Verification

```bash
cd d:/Work/AI/road-rules/apps/web
pnpm run build
```

---

## Step 13: Admin Panel

### 13.1 Admin layout

**Create file: `d:\Work\AI\road-rules\apps\web\src\app\admin\layout.tsx`**
```tsx
"use client";

import { useAuthStore } from "@/store/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  // Check admin role
  if (user && user.role !== "ADMIN") {
    return <div className="mt-20 text-center text-red-600">Access denied</div>;
  }

  return (
    <ProtectedRoute>
      <div className="flex">
        <aside className="w-64 border-r bg-gray-50 p-4">
          <h2 className="mb-4 text-lg font-bold">Admin</h2>
          <nav className="space-y-2">
            <Link href="/admin" className="block hover:text-blue-600">Dashboard</Link>
            <Link href="/admin/tickets" className="block hover:text-blue-600">Tickets</Link>
            <Link href="/admin/import" className="block hover:text-blue-600">Import</Link>
            <Link href="/admin/images" className="block hover:text-blue-600">Images</Link>
          </nav>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
```

### 13.2 Admin dashboard page

**Create file: `d:\Work\AI\road-rules\apps\web\src\app\admin\page.tsx`**
Structure:
- Fetch ticket counts by status from `/admin/tickets?countByStatus=true`
- Display cards: Total tickets, Draft, Published, Archived
- Recent imports list (if import history endpoint exists)

### 13.3 Ticket management page

**Create file: `d:\Work\AI\road-rules\apps\web\src\app\admin\tickets\page.tsx`**
Structure:
- Table: ID (truncated), Question (RU, truncated), Difficulty, Status, Tags, Actions
- Filters: status dropdown, difficulty dropdown, search input
- Pagination
- Actions: View, Publish (if draft), Archive

**Create file: `d:\Work\AI\road-rules\apps\web\src\app\admin\tickets\[id]\page.tsx`**
Structure:
- Full ticket view with all fields
- Edit form (question RU/UK, explanation RU/UK, options, difficulty, tags)
- Image attachments section
- Status change buttons

### 13.4 Import page

**Create file: `d:\Work\AI\road-rules\apps\web\src\app\admin\import\page.tsx`**
Structure:
- File upload (accept `.jsonl`) or textarea for JSON paste
- Preview: show count of tickets to import
- "Validate" button -> shows validation results (errors per ticket)
- "Import" button -> calls `POST /admin/tickets/import`, shows result report
- Display: `{ total, created, errors[] }` after import

### 13.5 Image management page

**Create file: `d:\Work\AI\road-rules\apps\web\src\app\admin\images\page.tsx`**
Structure:
- List tickets without images
- For each: "Search images" button -> calls `/admin/images/resolve`
- Display candidate images in a grid
- "Attach" button for each candidate -> calls `/admin/images/attach`

### 13.6 Verification

```bash
cd d:/Work/AI/road-rules/apps/web
pnpm run build
```

---

## Step 14: Content Generation Pipeline (AI Agents)

### 14.1 Create agents directory

```bash
mkdir -p d:/Work/AI/road-rules/agents/scripts
mkdir -p d:/Work/AI/road-rules/agents/data
mkdir -p d:/Work/AI/road-rules/agents/prompts
```

### 14.2 PDD Extractor agent prompt

**Create file: `d:\Work\AI\road-rules\agents\prompts\pdd-extractor.md`**
Content: A system prompt instructing Claude Opus 4.6 to extract rules from official PDD text. Input format, output JSONL format with fields: `pddRef`, `pddUrl`, `ua_excerpt_short` (max 25 words), `keywords[]`, `exceptions[]`, `applicability`. Include examples of expected output.

### 14.3 Ticket Generator agent prompt

**Create file: `d:\Work\AI\road-rules\agents\prompts\ticket-generator.md`**
Content: A system prompt for generating exam tickets. Input: rules from `rules.jsonl` + quotas. Output: JSONL with fields matching `ImportTicketDto`. Include constraints: exactly 4 options, exactly 1 correct, bilingual (RU+UK), `scenarioHash` as deterministic hash of question content. Batch size: 50 tickets per run.

### 14.4 Validator agent prompt

**Create file: `d:\Work\AI\road-rules\agents\prompts\ticket-validator.md`**
Content: System prompt for independent validation. Given a ticket + the PDD rule text, independently derive the correct answer. Output: `pass`/`fail`/`needs_review` + reason.

### 14.5 Image search script

**Create file: `d:\Work\AI\road-rules\agents\scripts\search-images.ts`**
Structure:
- Read `tickets.generated.jsonl`
- For each ticket with `imageSearchQueries`:
  - Query Wikimedia Commons API
  - Rank by license quality
  - Generate TASL attribution
  - Write to `images.resolved.jsonl`

### 14.6 Import script

**Create file: `d:\Work\AI\road-rules\agents\scripts\import-tickets.ts`**
Structure:
- Read final JSONL file
- Validate schema (4 options, 1 correct, required fields)
- POST to `http://localhost:3001/api/admin/tickets/import` with auth token
- Log results

### 14.7 Verification

Verify file structure:
```
d:\Work\AI\road-rules\agents\
├── data/          # will contain rules.jsonl, tickets.generated.jsonl, images.resolved.jsonl
├── prompts/
│   ├── pdd-extractor.md
│   ├── ticket-generator.md
│   └── ticket-validator.md
└── scripts/
    ├── search-images.ts
    └── import-tickets.ts
```

---

## Step 15: Testing

### 15.1 Backend unit tests

Install test dependencies (should already be present from NestJS scaffold):
```bash
cd d:/Work/AI/road-rules/apps/api
pnpm add -D @nestjs/testing jest @types/jest ts-jest supertest @types/supertest
```

**Create file: `d:\Work\AI\road-rules\apps\api\src\auth\auth.service.spec.ts`**
Structure:
- Mock `PrismaService`, `JwtService`, `ConfigService`
- Test `register`: creates user with hashed password, returns tokens
- Test `login`: verifies password, returns tokens
- Test `login` with wrong password: throws UnauthorizedException
- Test `refreshTokens`: rotates token
- Test `logout`: clears refreshToken

**Create file: `d:\Work\AI\road-rules\apps\api\src\tickets\tickets.service.spec.ts`**
Structure:
- Mock `PrismaService`
- Test `importBulk`: validates tickets, creates in transaction
- Test `importBulk` with invalid ticket (3 options): returns error
- Test `importBulk` with duplicate scenarioHash: returns error
- Test `findMany` with filters
- Test `selectForSession`: returns correct count

**Create file: `d:\Work\AI\road-rules\apps\api\src\sessions\sessions.service.spec.ts`**
Structure:
- Mock `PrismaService`, `TicketsService`
- Test `create`: creates session with 20 tickets
- Test `submitAnswer`: marks correct/incorrect, returns explanation
- Test `submitAnswer` duplicate: throws error
- Test `finish`: calculates score correctly

Run tests:
```bash
cd d:/Work/AI/road-rules/apps/api
pnpm run test
```

### 15.2 Backend E2E tests

**Create file: `d:\Work\AI\road-rules\apps\api\test\app.e2e-spec.ts`**
Structure:
- Before all: create test module with real Prisma (connect to test DB), run migrations
- After all: clean up test data, disconnect
- Test full flow:
  1. Register user
  2. Login -> get tokens
  3. Create session (POST /sessions)
  4. Answer 5 questions (POST /sessions/:id/answer)
  5. Finish session (POST /sessions/:id/finish)
  6. Check stats (GET /stats/overview)
- Test admin flow:
  1. Login as admin
  2. Import tickets (POST /admin/tickets/import)
  3. Publish ticket (POST /admin/tickets/:id/publish)

Add test database URL to `apps/api/.env.test`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/road_rules_test?schema=public"
```

Run E2E tests:
```bash
cd d:/Work/AI/road-rules/apps/api
pnpm run test:e2e
```

### 15.3 Frontend component tests

```bash
cd d:/Work/AI/road-rules/apps/web
pnpm add -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom @types/jest
```

**Create file: `d:\Work\AI\road-rules\apps\web\jest.config.ts`**
```ts
import type { Config } from "jest";

const config: Config = {
  testEnvironment: "jsdom",
  transform: { "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }] },
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  setupFilesAfterSetup: ["<rootDir>/jest.setup.ts"],
};

export default config;
```

**Create file: `d:\Work\AI\road-rules\apps\web\jest.setup.ts`**
```ts
import "@testing-library/jest-dom";
```

Write component tests for:
- `TicketCard` — renders question, options, handles answer submission
- `QuizProgress` — renders correct fraction and progress bar
- `LanguageSwitcher` — switches locale cookie

### 15.4 Verification

```bash
cd d:/Work/AI/road-rules/apps/api && pnpm run test
cd d:/Work/AI/road-rules/apps/web && pnpm run test
```

---

## Step 16: Containerization & Deployment

### 16.1 API Dockerfile

**Create file: `d:\Work\AI\road-rules\apps\api\Dockerfile`**
```dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
RUN pnpm --filter @road-rules/api exec prisma generate
RUN pnpm --filter @road-rules/api run build

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/node_modules ./node_modules
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3001
CMD ["node", "dist/main.js"]
```

### 16.2 Web Dockerfile

**Create file: `d:\Work\AI\road-rules\apps\web\Dockerfile`**
```dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @road-rules/web run build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

### 16.3 Production Docker Compose

**Create file: `d:\Work\AI\road-rules\docker-compose.prod.yml`**
```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME:-road_rules}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - internal

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://${DB_USER:-postgres}:${DB_PASSWORD}@postgres:5432/${DB_NAME:-road_rules}?schema=public
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost:3000}
      PORT: 3001
    depends_on:
      - postgres
    networks:
      - internal

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL:-http://localhost:3001/api}
    depends_on:
      - api
    networks:
      - internal

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - web
      - api
    networks:
      - internal

volumes:
  postgres_data:

networks:
  internal:
```

### 16.4 Nginx config

**Create file: `d:\Work\AI\road-rules\nginx.conf`**
```nginx
upstream web {
    server web:3000;
}

upstream api {
    server api:3001;
}

server {
    listen 80;
    server_name _;

    location /api/ {
        proxy_pass http://api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://web;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 16.5 Production environment template

**Create file: `d:\Work\AI\road-rules\.env.production.example`**
```env
DB_USER=postgres
DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD
DB_NAME=road_rules
JWT_SECRET=CHANGE_ME_RANDOM_64_CHARS
JWT_REFRESH_SECRET=CHANGE_ME_RANDOM_64_CHARS
CORS_ORIGIN=https://yourdomain.com
API_URL=https://yourdomain.com/api
```

### 16.6 Verification

```bash
cd d:/Work/AI/road-rules
docker compose -f docker-compose.prod.yml build  # should build both images
```

---

## Step 17: CI/CD Pipeline

### 17.1 GitHub Actions workflow

**Create directory and file:**
```bash
mkdir -p d:/Work/AI/road-rules/.github/workflows
```

**Create file: `d:\Work\AI\road-rules\.github\workflows\ci.yml`**
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm run lint
      - run: pnpm --filter @road-rules/api exec tsc --noEmit
      - run: pnpm --filter @road-rules/web exec tsc --noEmit

  test-api:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: road_rules_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @road-rules/api exec prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/road_rules_test?schema=public
      - run: pnpm --filter @road-rules/api run test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/road_rules_test?schema=public
          JWT_SECRET: test-secret
          JWT_REFRESH_SECRET: test-refresh-secret

  test-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @road-rules/web run test

  build:
    needs: [lint-and-typecheck, test-api, test-web]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm run build
```

### 17.2 Verification

Commit and push to GitHub to verify the CI pipeline runs.

---

## Execution Order Summary

| Phase | Steps | Dependencies |
|-------|-------|-------------|
| Foundation | 1 (scaffolding), 2 (database) | None |
| Backend Core | 3 (auth), 4 (tickets), 5 (sessions) | Steps 1-2 |
| Backend Support | 6 (stats), 7 (images), 8 (health) | Steps 3-5 |
| Frontend Core | 9 (layout/i18n), 10 (auth pages), 11 (quiz) | Steps 1, 3-5 |
| Frontend Support | 12 (stats/profile), 13 (admin) | Steps 6-7, 9-11 |
| Content | 14 (AI agents) | Steps 4, 7 |
| Quality | 15 (testing) | Steps 3-13 |
| Deploy | 16 (Docker), 17 (CI/CD) | Steps 1-15 |
