import { z } from 'zod';

export const contentTypeEnum = z.enum([
  'recipe',
  'technique',
  'ingredient_guide',
  'sauce',
  'spice_blend',
  'kitchen_tip',
]);

export const difficultyEnum = z.enum(['easy', 'medium', 'hard']);

export const ingredientSchema = z.object({
  id: z.string().optional(),
  itemName: z.string().min(1, 'Ingredient name is required'),
  amount: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  sortOrder: z.number().default(0),
});

export const instructionSchema = z.object({
  id: z.string().optional(),
  stepNumber: z.number().min(1),
  instructionText: z.string().min(1, 'Instruction text is required'),
  timerMinutes: z.number().nullable().optional(),
});

export const imageSchema = z.object({
  id: z.string().optional(),
  imageUrl: z.string().url('Invalid image URL'),
  caption: z.string().nullable().optional(),
  isPrimary: z.boolean().default(false),
});

export const tagSchema = z.union([
  z.string().transform((t) => ({ tagName: t })),
  z.object({
    id: z.string().optional(),
    tagName: z.string().min(1),
  }),
]);

// Helper Zod validator for optional image URLs that allows empty strings or null
const optionalUrlSchema = z.string().url('Must be a valid URL').or(z.literal('')).nullable().optional();

export const createContentEntitySchema = z.object({
  id: z.string().optional(),
  contentType: contentTypeEnum,
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  summary: z.string().nullable().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  servings: z.number().min(1).default(4),
  prepTimeMinutes: z.number().nullable().optional(),
  cookTimeMinutes: z.number().nullable().optional(),
  cuisine: z.string().nullable().optional(),
  difficulty: difficultyEnum.nullable().optional(),
  imageUrl: optionalUrlSchema,
  ingredients: z.array(ingredientSchema).default([]),
  instructions: z.array(instructionSchema).default([]),
  images: z.array(imageSchema).default([]),
  tags: z.array(tagSchema).default([]),
});

export const contentEntitySchema = createContentEntitySchema;

export const updateContentEntitySchema = createContentEntitySchema.partial().extend({
  id: z.string().min(1),
  changeSummary: z.string().optional(),
  approvedBy: z.string().optional(),
});

export type CreateContentEntityInput = z.infer<typeof createContentEntitySchema>;
export type ContentEntityInput = CreateContentEntityInput;
export type UpdateContentEntityInput = z.infer<typeof updateContentEntitySchema>;
