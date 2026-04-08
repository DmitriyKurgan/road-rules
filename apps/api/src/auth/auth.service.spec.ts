import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";

describe("AuthService", () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let jwt: { sign: jest.Mock; verify: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    jwt = {
      sign: jest.fn().mockReturnValue("mock-token"),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              const map: Record<string, string> = {
                JWT_SECRET: "test-secret",
                JWT_REFRESH_SECRET: "test-refresh-secret",
                JWT_ACCESS_EXPIRY: "15m",
                JWT_REFRESH_EXPIRY: "7d",
              };
              return map[key];
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe("register", () => {
    it("should create user and return tokens", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: "user-1",
        email: "test@test.com",
        role: "USER",
      });
      prisma.user.update.mockResolvedValue({});

      const result = await service.register("test@test.com", "password123");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@test.com" },
      });
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
    });

    it("should throw ConflictException if email exists", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "existing" });

      await expect(
        service.register("existing@test.com", "password"),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("login", () => {
    it("should return tokens for valid credentials", async () => {
      const hash = await bcrypt.hash("password123", 10);
      prisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@test.com",
        passwordHash: hash,
        role: "USER",
      });
      prisma.user.update.mockResolvedValue({});

      const result = await service.login("test@test.com", "password123");

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
    });

    it("should throw UnauthorizedException for wrong email", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login("wrong@test.com", "password"),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException for wrong password", async () => {
      const hash = await bcrypt.hash("correct", 10);
      prisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@test.com",
        passwordHash: hash,
        role: "USER",
      });

      await expect(
        service.login("test@test.com", "wrong"),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("logout", () => {
    it("should clear refresh token", async () => {
      prisma.user.update.mockResolvedValue({});

      await service.logout("user-1");

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { refreshToken: null },
      });
    });
  });

  describe("getProfile", () => {
    it("should return user without password", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@test.com",
        role: "USER",
        createdAt: new Date(),
      });

      const result = await service.getProfile("user-1");

      expect(result).toHaveProperty("email");
      expect(result).not.toHaveProperty("passwordHash");
    });

    it("should throw if user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile("missing")).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
