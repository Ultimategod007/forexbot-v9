export * from "./models/auth";
import { pgTable, text, serial, integer, boolean, timestamp, primaryKey, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

// === TABLE DEFINITIONS ===

export const series = pgTable("series", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  coverImage: text("cover_image").notNull(),
  author: text("author").notNull(), // Original creator name
  genres: text("genres").array().notNull(), // Array of strings for simplicity
  status: text("status").notNull().default("ongoing"), // ongoing, completed, hiatus
  userId: text("user_id").references(() => users.id), // Uploader
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  seriesId: integer("series_id").references(() => series.id).notNull(),
  title: text("title").notNull(),
  chapterNumber: integer("chapter_number").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").references(() => chapters.id).notNull(),
  pageNumber: integer("page_number").notNull(),
  imageUrl: text("image_url").notNull(),
});

export const readingProgress = pgTable("reading_progress", {
  userId: text("user_id").references(() => users.id).notNull(),
  seriesId: integer("series_id").references(() => series.id).notNull(),
  lastReadChapterId: integer("last_read_chapter_id").references(() => chapters.id).notNull(),
  lastReadPage: integer("last_read_page").default(1),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.seriesId] }),
}));

// === RELATIONS ===

export const seriesRelations = relations(series, ({ one, many }) => ({
  chapters: many(chapters),
  uploader: one(users, {
    fields: [series.userId],
    references: [users.id],
  }),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  series: one(series, {
    fields: [chapters.seriesId],
    references: [series.id],
  }),
  pages: many(pages),
}));

export const pagesRelations = relations(pages, ({ one }) => ({
  chapter: one(chapters, {
    fields: [pages.chapterId],
    references: [chapters.id],
  }),
}));

export const readingProgressRelations = relations(readingProgress, ({ one }) => ({
  user: one(users, {
    fields: [readingProgress.userId],
    references: [users.id],
  }),
  series: one(series, {
    fields: [readingProgress.seriesId],
    references: [series.id],
  }),
  chapter: one(chapters, {
    fields: [readingProgress.lastReadChapterId],
    references: [chapters.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertSeriesSchema = createInsertSchema(series).omit({ id: true, createdAt: true, updatedAt: true, userId: true });
export const insertChapterSchema = createInsertSchema(chapters).omit({ id: true, createdAt: true });
export const insertPageSchema = createInsertSchema(pages).omit({ id: true });
export const insertReadingProgressSchema = createInsertSchema(readingProgress).omit({ updatedAt: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Series = typeof series.$inferSelect;
export type InsertSeries = z.infer<typeof insertSeriesSchema>;

export type Chapter = typeof chapters.$inferSelect;
export type InsertChapter = z.infer<typeof insertChapterSchema>;

export type Page = typeof pages.$inferSelect;
export type InsertPage = z.infer<typeof insertPageSchema>;

export type ReadingProgress = typeof readingProgress.$inferSelect;

// Request types
export type CreateSeriesRequest = InsertSeries;
export type UpdateSeriesRequest = Partial<InsertSeries>;

export type CreateChapterRequest = InsertChapter & { pages: string[] }; // pages as array of URLs
export type UpdateChapterRequest = Partial<InsertChapter>;

export type UpdateProgressRequest = {
  chapterId: number;
  pageNumber: number;
};

// Response types
export type SeriesResponse = Series & { uploader?: typeof users.$inferSelect };
export type SeriesDetailResponse = Series & { chapters: Chapter[] };
export type ChapterDetailResponse = Chapter & { pages: Page[], nextChapterId?: number, prevChapterId?: number };

// Filter types
export interface SeriesQueryParams {
  search?: string;
  genre?: string;
  status?: string;
  limit?: number;
  offset?: number;
}
