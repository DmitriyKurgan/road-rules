import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('App E2E', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.sessionAnswer.deleteMany({});
    await prisma.sessionTicket.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'e2e-' } },
    });
    await app.close();
  });

  describe('Health', () => {
    it('GET /api/health returns ok', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
        });
    });
  });

  describe('Auth flow', () => {
    const email = 'e2e-test@test.com';
    const password = 'test123456';
    let accessToken: string;
    let refreshToken: string;

    it('registers a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password })
        .expect(201);

      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
      expect(accessToken).toBeDefined();
    });

    it('logs in with valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);

      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it('gets profile with token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.email).toBe(email);
      expect(res.body.role).toBe('USER');
    });

    it('rejects /me without token', () => {
      return request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('refreshes token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
    });
  });

  describe('Tickets', () => {
    it('lists published tickets', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tickets')
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Session flow (guest)', () => {
    let sessionId: string;
    let ticketId: string;
    let optionId: string;

    it('creates a guest session', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/sessions')
        .send({ mode: 'PRACTICE', lang: 'ru' })
        .expect(201);

      sessionId = res.body.id;
      expect(res.body.ticketCount).toBeGreaterThan(0);
    });

    it('gets session state', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/sessions/${sessionId}`)
        .expect(200);

      expect(res.body.totalAnswered).toBe(0);
      expect(res.body.currentTicketOrder).toBe(1);
      ticketId = res.body.tickets[0].ticketId;
      optionId = res.body.tickets[0].options[0].id;
    });

    it('submits an answer', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/sessions/${sessionId}/answer`)
        .send({ ticketId, selectedOptionId: optionId, timeMs: 5000 })
        .expect(200);

      expect(res.body.isCorrect).toBeDefined();
      expect(res.body.explanation).toBeDefined();
    });

    it('rejects double answer', () => {
      return request(app.getHttpServer())
        .post(`/api/sessions/${sessionId}/answer`)
        .send({ ticketId, selectedOptionId: optionId, timeMs: 1000 })
        .expect(400);
    });

    it('finishes session', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/sessions/${sessionId}/finish`)
        .expect(200);

      expect(res.body.score).toBeDefined();
      expect(res.body.totalQuestions).toBeGreaterThan(0);
    });

    it('rejects double finish', () => {
      return request(app.getHttpServer())
        .post(`/api/sessions/${sessionId}/finish`)
        .expect(400);
    });
  });

  describe('Admin', () => {
    let adminToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@road-rules.local', password: 'admin123' });
      adminToken = res.body.accessToken;
    });

    it('lists all tickets as admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/tickets')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.total).toBeGreaterThan(0);
    });

    it('imports a ticket', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/tickets/import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tickets: [
            {
              questionRu: 'E2E Test',
              questionUk: 'E2E Тест',
              explanationRu: 'E',
              explanationUk: 'E',
              pddRef: '99.99',
              difficulty: 'EASY',
              tags: ['e2e'],
              scenarioHash: `e2e-${Date.now()}`,
              options: [
                { textRu: 'A', textUk: 'A', isCorrect: true, order: 1 },
                { textRu: 'B', textUk: 'B', isCorrect: false, order: 2 },
                { textRu: 'C', textUk: 'C', isCorrect: false, order: 3 },
                { textRu: 'D', textUk: 'D', isCorrect: false, order: 4 },
              ],
            },
          ],
        })
        .expect(201);

      expect(res.body.created).toBe(1);
    });

    it('rejects non-admin user', async () => {
      const userRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'e2e-test@test.com', password: 'test123456' });

      await request(app.getHttpServer())
        .get('/api/admin/tickets')
        .set('Authorization', `Bearer ${userRes.body.accessToken}`)
        .expect(403);
    });
  });
});
