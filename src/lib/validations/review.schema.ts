import { z } from "zod";

export const CreateReviewSchema = z.object({
  consultationId: z.string().uuid("ID de consulta inválido"),
  lawyerId: z.string().uuid("ID de abogado inválido"),
  caseId: z.string().uuid("ID de caso inválido"),
  communicationScore: z
    .number()
    .int()
    .min(1, "Califica la comunicación del 1 al 5")
    .max(5, "Máximo 5 estrellas"),
  punctualityScore: z
    .number()
    .int()
    .min(1, "Califica la puntualidad del 1 al 5")
    .max(5, "Máximo 5 estrellas"),
  clarityScore: z
    .number()
    .int()
    .min(1, "Califica la claridad jurídica del 1 al 5")
    .max(5, "Máximo 5 estrellas"),
  attentionScore: z
    .number()
    .int()
    .min(1, "Califica el trato profesional del 1 al 5")
    .max(5, "Máximo 5 estrellas"),
  comment: z
    .string()
    .max(1000, "El comentario no debe superar 1,000 caracteres")
    .optional()
    .nullable(),
});

export type CreateReviewValues = z.infer<typeof CreateReviewSchema>;
