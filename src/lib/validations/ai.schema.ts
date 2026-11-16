import { z } from "zod";

export const ClassifyCaseAISchema = z.object({
  title: z.string().optional().default("Consulta Legal"),
  description: z
    .string()
    .min(15, "Por favor describe el caso con al menos 15 caracteres para el análisis de IA"),
  city: z.string().optional().nullable(),
});

export type ClassifyCaseAIValues = z.infer<typeof ClassifyCaseAISchema>;
