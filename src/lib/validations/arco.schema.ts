import { z } from "zod";

export const SubmitArcoRequestSchema = z.object({
  requesterName: z
    .string()
    .min(3, "Ingresa tu nombre completo")
    .max(150, "Máximo 150 caracteres"),
  requesterDni: z
    .string()
    .regex(/^\d{8}$/, "El DNI peruano debe contener exactamente 8 dígitos numéricos"),
  requesterEmail: z.string().email("Correo electrónico de contacto inválido"),
  requestType: z.enum(
    ["access", "rectification", "cancellation", "opposition"],
    {
      message: "Selecciona un tipo de derecho ARCO válido",
    }
  ),
  justification: z
    .string()
    .min(20, "Describe con al menos 20 caracteres los fundamentos de tu solicitud")
    .max(2000, "Máximo 2,000 caracteres"),
  supportingDocumentUrl: z
    .string()
    .url("URL de documento adjunto inválida")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type SubmitArcoRequestValues = z.infer<typeof SubmitArcoRequestSchema>;

export const ResolveArcoRequestSchema = z.object({
  requestId: z.string().uuid("ID de solicitud inválido"),
  decision: z.enum(["resolved", "rejected", "in_process"], {
    message: "Dictamen no válido",
  }),
  resolutionNotes: z
    .string()
    .min(10, "Detalla los fundamentos jurídicos de la resolución")
    .max(2000),
});

export type ResolveArcoRequestValues = z.infer<typeof ResolveArcoRequestSchema>;
