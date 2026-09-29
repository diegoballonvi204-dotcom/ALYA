import { z } from "zod";

export const SendMessageSchema = z.object({
  conversationId: z.string().uuid("ID de conversación inválido"),
  message: z
    .string()
    .min(1, "El mensaje no puede estar vacío")
    .max(3000, "El mensaje no debe superar los 3,000 caracteres"),
  attachmentUrl: z.string().url("URL de adjunto inválida").optional().nullable(),
  attachmentType: z
    .enum(["document", "image"], {
      message: "Tipo de adjunto no válido",
    })
    .optional()
    .nullable(),
});

export type SendMessageValues = z.infer<typeof SendMessageSchema>;
