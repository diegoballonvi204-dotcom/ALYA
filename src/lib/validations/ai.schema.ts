import { z } from "zod";

export const ClassifyCaseAISchema = z.object({
  title: z.string().min(3, "El título debe contener al menos 3 caracteres"),
  description: z
    .string()
    .min(15, "Por favor describe el caso con al menos 15 caracteres para el análisis de IA"),
  city: z.string().optional().nullable(),
});

export type ClassifyCaseAIValues = z.infer<typeof ClassifyCaseAISchema>;
