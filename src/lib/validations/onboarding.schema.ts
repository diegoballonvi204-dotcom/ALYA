import { z } from "zod";

export const LawyerOnboardingSchema = z
  .object({
    barAssociation: z.string().min(3, "Selecciona tu colegio profesional"),
    barNumber: z
      .string()
      .regex(/^\d{3,6}$/, "El número de colegiatura debe tener entre 3 y 6 dígitos"),
    yearsExperience: z.coerce
      .number()
      .min(0, "Mínimo 0 años")
      .max(70, "Años de experiencia no válidos"),
    bio: z
      .string()
      .min(50, "Redacta una presentación profesional de al menos 50 caracteres")
      .max(1200, "Máximo 1200 caracteres"),
    specialties: z
      .array(
        z.object({
          specialtyId: z.number(),
          experienceYears: z.number().min(0),
          isPrimary: z.boolean(),
        })
      )
      .min(1, "Debes seleccionar al menos una especialidad jurídica"),
    virtualAttention: z.boolean(),
    physicalAttention: z.boolean(),
    addressOffice: z.string().optional(),
    consultationPrice: z.coerce
      .number()
      .min(30, "La tarifa sugerida mínima es S/. 30.00")
      .optional(),
  })
  .refine((data) => data.virtualAttention || data.physicalAttention, {
    message: "Debes seleccionar al menos una modalidad (virtual o presencial)",
    path: ["virtualAttention"],
  });

export type LawyerOnboardingValues = z.infer<typeof LawyerOnboardingSchema>;

export const ClientOnboardingSchema = z.object({
  firstName: z.string().min(2, "Ingresa tus nombres completos"),
  lastName: z.string().min(2, "Ingresa tus apellidos completos"),
  phone: z
    .string()
    .regex(/^9\d{8}$/, "Ingresa un número celular peruano válido (9 dígitos comenzando con 9)"),
  documentType: z.enum(["DNI", "CE", "PASAPORTE"]),
  documentNumber: z.string().min(8, "Número de documento no válido"),
  city: z.string().min(2, "Selecciona tu ciudad o departamento"),
});

export type ClientOnboardingValues = z.infer<typeof ClientOnboardingSchema>;
