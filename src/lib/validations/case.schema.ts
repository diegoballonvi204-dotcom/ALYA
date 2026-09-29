import { z } from "zod";

export const CaseSchema = z.object({
  title: z
    .string()
    .min(6, "El título debe tener al menos 6 caracteres")
    .max(120, "El título no debe exceder los 120 caracteres"),
  description: z
    .string()
    .min(30, "Por favor describe tu problema con al menos 30 caracteres para que los abogados puedan analizarlo adecuadamente")
    .max(3000, "La descripción no puede superar los 3000 caracteres"),
  specialtyId: z.coerce.number().min(1, "Debes seleccionar una materia jurídica principal"),
  subspecialtyId: z.coerce.number().optional().nullable(),
  urgency: z.enum(["low", "medium", "high", "immediate"], {
    message: "Selecciona el nivel de urgencia del caso",
  }),
  city: z.string().min(2, "Selecciona tu ciudad o departamento de residencia"),
  modality: z.enum(["virtual", "in_person", "hybrid"], {
    message: "Selecciona una modalidad de atención",
  }),
  isConfidential: z.boolean().default(true),
});

export type CaseFormValues = z.infer<typeof CaseSchema>;
