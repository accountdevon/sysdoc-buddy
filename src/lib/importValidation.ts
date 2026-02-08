import { z } from 'zod';

const MAX_IMPORT_SIZE = 10_000_000; // 10MB

const CodeBlockSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  code: z.string().max(10000),
  language: z.string().min(1).max(50),
});

const TopicSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
  notes: z.string().max(10000),
  codeBlocks: z.array(CodeBlockSchema).max(50),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

const SubcategorySchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  topics: z.array(TopicSchema).max(100),
});

const CategorySchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  icon: z.string().min(1).max(50),
  subcategories: z.array(SubcategorySchema).max(50),
});

const AppDataSchema = z.object({
  categories: z.array(CategorySchema).max(100),
  version: z.string().min(1).max(20),
  exportedAt: z.string().optional(),
});

export function validateImportData(jsonString: string) {
  if (jsonString.length > MAX_IMPORT_SIZE) {
    return { success: false as const, error: 'Import file too large (max 10MB)' };
  }

  const parsed = JSON.parse(jsonString);
  const result = AppDataSchema.safeParse(parsed);

  if (!result.success) {
    return { success: false as const, error: result.error.message };
  }

  return { success: true as const, data: result.data };
}
