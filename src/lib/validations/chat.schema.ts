import { z } from "zod";

export const SendMessageSchema = z.object({
  conversationId: z.string().uuid("ID de conversación inválido"),
  message: z
    .string()
    .min(1, "El mensaje no puede estar vacío")
    .max(3000, "El mensaje no debe superar los 3,000 caracteres"),
  attachmentUrl: z
    .string()
    .max(500, "La ruta o URL del adjunto es demasiado larga")
    .refine(
      (val) =>
        /^https:\/\//i.test(val) ||
        (/^[a-zA-Z0-9_./-]+$/.test(val) && !val.includes("..") && !val.startsWith("/")),
      "El adjunto debe ser una URL HTTPS válida o una ruta de almacenamiento segura"
    )
    .optional()
    .nullable(),
  attachmentType: z
    .enum(["document", "image"], {
      message: "Tipo de adjunto no válido",
    })
    .optional()
    .nullable(),
});

export type SendMessageValues = z.infer<typeof SendMessageSchema>;
