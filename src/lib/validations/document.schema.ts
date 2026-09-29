import { z } from "zod";

export const UploadCaseDocSchema = z.object({
  caseId: z.string().uuid("ID de caso inválido"),
  fileName: z.string().min(1, "Nombre de archivo requerido"),
  storagePath: z.string().min(5, "Ruta de almacenamiento requerida"),
  fileSizeBytes: z
    .number()
    .max(26214400, "El documento no debe exceder los 25MB"),
  mimeType: z.string().min(3, "Tipo MIME inválido"),
  visibility: z
    .enum(["private_client", "shared_match"], {
      message: "Visibilidad no válida",
    })
    .default("shared_match"),
});

export type UploadCaseDocValues = z.infer<typeof UploadCaseDocSchema>;

export const ToggleDocumentVisibilitySchema = z.object({
  documentId: z.string().uuid("ID de documento inválido"),
  visibility: z.enum(["private_client", "shared_match"], {
    message: "Visibilidad no válida",
  }),
});

export type ToggleDocumentVisibilityValues = z.infer<
  typeof ToggleDocumentVisibilitySchema
>;
