import { z } from 'zod';
import { insertSeriesSchema, insertChapterSchema, series, chapters, pages, readingProgress } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  series: {
    list: {
      method: 'GET' as const,
      path: '/api/series' as const,
      input: z.object({
        search: z.string().optional(),
        genre: z.string().optional(),
        status: z.string().optional(),
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof series.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/series/:id' as const,
      responses: {
        200: z.custom<typeof series.$inferSelect & { chapters: typeof chapters.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/series' as const,
      input: insertSeriesSchema,
      responses: {
        201: z.custom<typeof series.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  chapters: {
    list: {
      method: 'GET' as const,
      path: '/api/series/:seriesId/chapters' as const,
      responses: {
        200: z.array(z.custom<typeof chapters.$inferSelect>()),
        404: errorSchemas.notFound,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/chapters/:id' as const,
      responses: {
        200: z.custom<typeof chapters.$inferSelect & { pages: typeof pages.$inferSelect[], nextChapterId?: number, prevChapterId?: number }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/series/:seriesId/chapters' as const,
      input: insertChapterSchema.omit({ seriesId: true }).extend({
        pages: z.array(z.string()), // Array of image URLs
      }),
      responses: {
        201: z.custom<typeof chapters.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  progress: {
    update: {
      method: 'POST' as const,
      path: '/api/series/:seriesId/progress' as const,
      input: z.object({
        chapterId: z.number(),
        pageNumber: z.number(),
      }),
      responses: {
        200: z.custom<typeof readingProgress.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/series/:seriesId/progress' as const,
      responses: {
        200: z.custom<typeof readingProgress.$inferSelect | null>(), // null if no progress
        401: errorSchemas.unauthorized,
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
