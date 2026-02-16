import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255, "Title must be at most 255 characters"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255, "Title must be at most 255 characters").optional(),
  completed: z.boolean({ invalid_type_error: "Completed must be a boolean" }).optional(),
}).refine((data) => data.title !== undefined || data.completed !== undefined, {
  message: "At least one field (title or completed) must be provided",
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
