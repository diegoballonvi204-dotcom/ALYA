import { z } from "zod";

export const BookConsultationSchema = z.object({
  caseId: z.string().uuid("ID de caso inválido"),
  lawyerId: z.string().uuid("ID de abogado inválido"),
  scheduledAt: z.string().min(1, "Fecha y hora de la cita requerida"),
  durationMinutes: z.number().int().min(15).max(180).default(45),
  modality: z.enum(["virtual", "in_person"], {
    message: "Modalidad inválida",
  }),
  agreedPrice: z.number().min(0, "La tarifa no puede ser negativa"),
  notes: z.string().max(1000, "Máximo 1,000 caracteres").optional().nullable(),
});

export type BookConsultationValues = z.infer<typeof BookConsultationSchema>;

export const UpdateConsultationStatusSchema = z.object({
  consultationId: z.string().uuid("ID de consulta inválido"),
  status: z.enum(
    ["requested", "confirmed", "rescheduled", "completed", "cancelled"],
    {
      message: "Estado de consulta inválido",
    }
  ),
  meetingLink: z
    .string()
    .url("El enlace debe ser una URL válida (ej. Google Meet o Zoom)")
    .optional()
    .nullable()
    .or(z.literal("")),
  meetingAddress: z
    .string()
    .max(300, "Máximo 300 caracteres")
    .optional()
    .nullable()
    .or(z.literal("")),
  notes: z.string().max(1000).optional().nullable(),
});

export type UpdateConsultationStatusValues = z.infer<
  typeof UpdateConsultationStatusSchema
>;

export const SaveLawyerScheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, "Formato de hora HH:MM"),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, "Formato de hora HH:MM"),
  slotDurationMinutes: z.number().int().min(15).max(180).default(45),
  isActive: z.boolean().default(true),
});

export type SaveLawyerScheduleValues = z.infer<typeof SaveLawyerScheduleSchema>;
