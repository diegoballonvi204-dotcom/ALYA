-- Migración 022: Crear bucket verification-documents y políticas de Storage

-- 1. Crear bucket privado si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'verification-documents',
    'verification-documents',
    false,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- 2. Políticas RLS para storage.objects en verification-documents

-- Permitir a usuarios autenticados subir documentos en su propia carpeta: {userId}/*
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir sus documentos de verificacion" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden subir sus documentos de verificacion"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir a usuarios autenticados actualizar o sobreescribir sus propios documentos
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus documentos de verificacion" ON storage.objects;
CREATE POLICY "Usuarios pueden actualizar sus documentos de verificacion"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir al usuario leer sus propios documentos
DROP POLICY IF EXISTS "Usuarios pueden leer sus propios documentos de verificacion" ON storage.objects;
CREATE POLICY "Usuarios pueden leer sus propios documentos de verificacion"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'verification-documents'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'verifier')
        )
    )
);
