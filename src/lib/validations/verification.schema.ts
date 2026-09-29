import { z } from "zod";

export const UploadVerificationDocsSchema = z.object({
  lawyerId: z.string().uuid("ID de abogado inválido"),
  dniFrontPath: z.string().min(5, "Debes adjuntar la imagen frontal de tu DNI"),
  dniBackPath: z.string().min(5, "Debes adjuntar la imagen posterior de tu DNI"),
  barCardPath: z.string().min(5, "Debes adjuntar tu Carné de Colegiatura oficial"),
  habilitationCertPath: z.string().optional().nullable(),
});

export type UploadVerificationDocsValues = z.infer<typeof UploadVerificationDocsSchema>;

export const ResolveVerificationSchema = z.object({
  verificationId: z.string().uuid("ID de verificación inválido"),
  decision: z.enum(["verified", "observed", "rejected", "in_review"], {
    message: "Selecciona una resolución válida",
  }),
  rejectionReason: z.string().max(500, "Máximo 500 caracteres").optional().nullable(),
  adminNotes: z.string().max(1000, "Máximo 1000 caracteres").optional().nullable(),
});

export type ResolveVerificationValues = z.infer<typeof ResolveVerificationSchema>;
