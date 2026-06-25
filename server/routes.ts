import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { authStorage } from "./replit_integrations/auth/storage";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app); // registers /api/auth/user endpoint

  // === SEED DATA ===
  try {
    const existingSeries = await storage.listSeries({});
    if (existingSeries.length === 0) {
      console.log("Seeding database...");
      
      // Ensure system user exists
      const systemUserId = "system-user";
      await authStorage.upsertUser({
        id: systemUserId,
        email: "system@manga.local",
        firstName: "System",
        lastName: "Admin",
        profileImageUrl: "https://placehold.co/400",
      });

      // Series 1: Fantasy
      const s1 = await storage.createSeries({
        title: "The Beginning After The End",
        description: "King Grey has unrivaled strength, wealth, and prestige in a world governed by martial ability. However, solitude lingers closely behind those with great power. Beneath the glamorous exterior of a powerful king lurks the shell of man, devoid of purpose and will. Reincarnated into a new world filled with magic and monsters, the king has a second chance to relive his life. Correcting the mistakes of his past will not be his only challenge, however. Underneath the peace and prosperity of the new world is an undercurrent threatening to destroy everything he has worked for, questioning his role and reason for being born again.",
        coverImage: "https://placehold.co/600x900?text=TBATE",
        author: "TurtleMe",
        genres: ["Fantasy", "Action", "Adventure", "Reincarnation"],
        status: "ongoing",
        userId: systemUserId,
      });

      // Chapter 1
      const c1 = await storage.createChapter({
        seriesId: s1.id,
        title: "Episode 1",
        chapterNumber: 1,
      });

      // Pages
      await storage.createPage({ chapterId: c1.id, pageNumber: 1, imageUrl: "https://placehold.co/800x1200?text=Page+1" });
      await storage.createPage({ chapterId: c1.id, pageNumber: 2, imageUrl: "https://placehold.co/800x1200?text=Page+2" });
      await storage.createPage({ chapterId: c1.id, pageNumber: 3, imageUrl: "https://placehold.co/800x1200?text=Page+3" });

      // Series 2: Action
      const s2 = await storage.createSeries({
        title: "Solo Leveling",
        description: "In a world where hunters — humans who possess magical abilities — must battle deadly monsters to protect the human race from certain annihilation, a notoriously weak hunter named Sung Jinwoo finds himself in a seemingly endless struggle for survival. One day, after narrowly surviving an overwhelmingly powerful double dungeon that nearly wipes out his entire party, a mysterious program called the System selects him as its sole player and in turn, gives him the extremely rare ability to level up in strength, possibly beyond any known limits. Jinwoo then sets out on a journey as he fights against all kinds of enemies, both man and monster, to discover the secrets of the dungeons and the true source of his powers.",
        coverImage: "https://placehold.co/600x900?text=Solo+Leveling",
        author: "Chugong",
        genres: ["Action", "Fantasy", "Adventure"],
        status: "completed",
        userId: systemUserId,
      });

       const c2_1 = await storage.createChapter({
        seriesId: s2.id,
        title: "Chapter 1",
        chapterNumber: 1,
      });
      await storage.createPage({ chapterId: c2_1.id, pageNumber: 1, imageUrl: "https://placehold.co/800x1200?text=SL+Page+1" });
      
      console.log("Database seeded!");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }

  // === Series ===
  app.get(api.series.list.path, async (req, res) => {
    const params = api.series.list.input?.parse(req.query) || {};
    const result = await storage.listSeries(params);
    res.json(result);
  });

  app.get(api.series.get.path, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    const result = await storage.getSeries(id);
    if (!result) return res.status(404).json({ message: "Series not found" });

    res.json(result);
  });

  app.post(api.series.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    const userId = (req.user as any).claims.sub;
    const user = await authStorage.getUser(userId);
    if (!user?.isAdmin) return res.status(403).json({ message: "Forbidden: Admin only" });

    try {
      const input = api.series.create.input.parse(req.body);
      // Associate with current user
      const series = await storage.createSeries({ ...input, userId: userId });
      res.status(201).json(series);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === Chapters ===
  app.get(api.chapters.list.path, async (req, res) => {
    const seriesId = parseInt(req.params.seriesId);
    if (isNaN(seriesId)) return res.status(400).json({ message: "Invalid Series ID" });
    const result = await storage.listChapters(seriesId);
    res.json(result);
  });

  app.get(api.chapters.get.path, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    const result = await storage.getChapter(id);
    if (!result) return res.status(404).json({ message: "Chapter not found" });

    res.json(result);
  });

  app.post(api.chapters.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    const userId = (req.user as any).claims.sub;
    const user = await authStorage.getUser(userId);
    if (!user?.isAdmin) return res.status(403).json({ message: "Forbidden: Admin only" });

    try {
      const seriesId = parseInt(req.params.seriesId);
      if (isNaN(seriesId)) return res.status(400).json({ message: "Invalid Series ID" });

      const input = api.chapters.create.input.parse(req.body);
      // Verify user owns series
      const series = await storage.getSeries(seriesId);
      if (!series) return res.status(404).json({ message: "Series not found" });
      
      // In this app, only admins upload, so we don't strictly need to check ownership if they are admin, 
      // but it's good practice. For now, just allow if admin.
      // if (series.userId !== userId) return res.status(403).json({ message: "Forbidden" });

      // Create chapter
      const chapter = await storage.createChapter({
        title: input.title,
        chapterNumber: input.chapterNumber,
        seriesId: seriesId,
      });

      // Create pages
      for (let i = 0; i < input.pages.length; i++) {
        await storage.createPage({
          chapterId: chapter.id,
          pageNumber: i + 1,
          imageUrl: input.pages[i],
        });
      }

      res.status(201).json(chapter);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });


  // === Progress ===
  app.post(api.progress.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    try {
      const seriesId = parseInt(req.params.seriesId);
      const input = api.progress.update.input.parse(req.body);
      const userId = (req.user as any).claims.sub;

      const progress = await storage.updateProgress(userId, { ...input, seriesId });
      res.json(progress);
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.progress.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    const seriesId = parseInt(req.params.seriesId);
    const userId = (req.user as any).claims.sub;

    const progress = await storage.getProgress(userId, seriesId);
    res.json(progress || null);
  });

  return httpServer;
}
