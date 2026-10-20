-- Migración 023: Aislamiento estricto y privacidad total de casos legales
-- Elimina políticas permisivas que exponían casos ajenos con status 'published' o 'matching'

-- 1. Eliminar políticas vulnerables anteriores
DROP POLICY IF EXISTS "Abogados del match o casos disponibles pueden ver caso" ON public.cases;
DROP POLICY IF EXISTS "Cliente ve sus propios casos o casos en matching" ON public.cases;
DROP POLICY IF EXISTS "Clientes ven unicamente sus propios casos" ON public.cases;
DROP POLICY IF EXISTS "Abogados ven unicamente casos asignados por match" ON public.cases;

-- 2. Asegurar que RLS esté habilitado en public.cases
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- 3. Política estricta para Clientes: únicamente ven sus propios casos creados
CREATE POLICY "Clientes ven unicamente sus propios casos"
ON public.cases
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR is_admin()
);

-- 4. Política estricta para Abogados: únicamente ven casos con match formal asignado a su ID
CREATE POLICY "Abogados ven unicamente casos asignados por match"
ON public.cases
FOR SELECT
TO authenticated
USING (
    can_lawyer_view_case(id)
    OR user_id = auth.uid()
    OR is_admin()
);
