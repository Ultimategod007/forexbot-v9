import { db } from "./db";
import {
  series, chapters, pages, readingProgress,
  type InsertSeries, type InsertChapter, type InsertPage, type Series, type Chapter, type Page,
  type ReadingProgress, type SeriesDetailResponse, type ChapterDetailResponse, type SeriesQueryParams, type UpdateProgressRequest
} from "@shared/schema";
import { eq, like, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  // Series
  createSeries(series: InsertSeries): Promise<Series>;
  updateSeries(id: number, series: Partial<InsertSeries>): Promise<Series>;
  getSeries(id: number): Promise<SeriesDetailResponse | undefined>;
  listSeries(params: SeriesQueryParams): Promise<Series[]>;

  // Chapters
  createChapter(chapter: InsertChapter): Promise<Chapter>;
  updateChapter(id: number, chapter: Partial<InsertChapter>): Promise<Chapter>;
  getChapter(id: number): Promise<ChapterDetailResponse | undefined>;
  listChapters(seriesId: number): Promise<Chapter[]>;

  // Pages
  createPage(page: InsertPage): Promise<Page>;
  getPages(chapterId: number): Promise<Page[]>;

  // Progress
  updateProgress(userId: string, progress: UpdateProgressRequest & { seriesId: number }): Promise<ReadingProgress>;
  getProgress(userId: string, seriesId: number): Promise<ReadingProgress | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Series
  async createSeries(insertSeries: InsertSeries): Promise<Series> {
    const [result] = await db.insert(series).values(insertSeries).returning();
    return result;
  }

  async updateSeries(id: number, updateSeries: Partial<InsertSeries>): Promise<Series> {
    const [result] = await db.update(series).set(updateSeries).where(eq(series.id, id)).returning();
    return result;
  }

  async getSeries(id: number): Promise<SeriesDetailResponse | undefined> {
    const result = await db.query.series.findFirst({
      where: eq(series.id, id),
      with: {
        chapters: {
          orderBy: [desc(chapters.chapterNumber)],
        },
      },
    });
    return result;
  }

  async listSeries(params: SeriesQueryParams): Promise<Series[]> {
    const filters = [];
    if (params.search) {
      filters.push(like(series.title, `%${params.search}%`));
    }
    if (params.status) {
      filters.push(eq(series.status, params.status));
    }
    // Handle genre filtering separately or by checking if array contains (Postgres specific)
    // For now, simple text search on genres array if possible, or just skip genre filter for MVP simplicity
    if (params.genre) {
       // Check if genre is in the genres array
       filters.push(sql`${params.genre} = ANY(${series.genres})`);
    }

    return await db.select().from(series)
      .where(and(...filters))
      .limit(params.limit || 20)
      .offset(params.offset || 0)
      .orderBy(desc(series.updatedAt));
  }

  // Chapters
  async createChapter(insertChapter: InsertChapter): Promise<Chapter> {
    const [result] = await db.insert(chapters).values(insertChapter).returning();
    // Update series updatedAt
    await db.update(series).set({ updatedAt: new Date() }).where(eq(series.id, insertChapter.seriesId));
    return result;
  }

  async updateChapter(id: number, updateChapter: Partial<InsertChapter>): Promise<Chapter> {
    const [result] = await db.update(chapters).set(updateChapter).where(eq(chapters.id, id)).returning();
    return result;
  }

  async getChapter(id: number): Promise<ChapterDetailResponse | undefined> {
    const chapter = await db.query.chapters.findFirst({
      where: eq(chapters.id, id),
      with: {
        pages: {
          orderBy: [desc(pages.pageNumber)],
        },
      },
    });

    if (!chapter) return undefined;

    // Get next and prev chapters
    const nextChapter = await db.query.chapters.findFirst({
      where: and(
        eq(chapters.seriesId, chapter.seriesId),
        sql`${chapters.chapterNumber} > ${chapter.chapterNumber}`
      ),
      orderBy: [desc(chapters.chapterNumber)], // wait, next chapter is higher number? or lower? Usually chapters go 1, 2, 3. Next is +1.
      // If reading chapter 1, next is 2. So chapterNumber > current. Order by ASC for nearest higher number.
    });

    // Actually, let's fix the ordering logic.
    // Next chapter: minimal chapterNumber > current.chapterNumber
    const [next] = await db.select({ id: chapters.id }).from(chapters)
      .where(and(eq(chapters.seriesId, chapter.seriesId), sql`${chapters.chapterNumber} > ${chapter.chapterNumber}`))
      .orderBy(chapters.chapterNumber)
      .limit(1);

    // Prev chapter: maximal chapterNumber < current.chapterNumber
    const [prev] = await db.select({ id: chapters.id }).from(chapters)
      .where(and(eq(chapters.seriesId, chapter.seriesId), sql`${chapters.chapterNumber} < ${chapter.chapterNumber}`))
      .orderBy(desc(chapters.chapterNumber))
      .limit(1);

    return { ...chapter, nextChapterId: next?.id, prevChapterId: prev?.id };
  }

  async listChapters(seriesId: number): Promise<Chapter[]> {
    return await db.select().from(chapters)
      .where(eq(chapters.seriesId, seriesId))
      .orderBy(desc(chapters.chapterNumber));
  }

  // Pages
  async createPage(insertPage: InsertPage): Promise<Page> {
    const [result] = await db.insert(pages).values(insertPage).returning();
    return result;
  }

  async getPages(chapterId: number): Promise<Page[]> {
    return await db.select().from(pages)
      .where(eq(pages.chapterId, chapterId))
      .orderBy(pages.pageNumber);
  }

  // Progress
  async updateProgress(userId: string, progress: UpdateProgressRequest & { seriesId: number }): Promise<ReadingProgress> {
    const [result] = await db.insert(readingProgress)
      .values({
        userId,
        seriesId: progress.seriesId,
        lastReadChapterId: progress.chapterId,
        lastReadPage: progress.pageNumber,
      })
      .onConflictDoUpdate({
        target: [readingProgress.userId, readingProgress.seriesId],
        set: {
          lastReadChapterId: progress.chapterId,
          lastReadPage: progress.pageNumber,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getProgress(userId: string, seriesId: number): Promise<ReadingProgress | undefined> {
    const [result] = await db.select().from(readingProgress)
      .where(and(eq(readingProgress.userId, userId), eq(readingProgress.seriesId, seriesId)));
    return result;
  }
}

export const storage = new DatabaseStorage();
