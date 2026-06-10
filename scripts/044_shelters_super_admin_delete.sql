-- ============================================================================
-- 044_shelters_super_admin_delete.sql
-- Permite al super_admin BORRAR protectoras (antes solo podía el propietario).
-- El update ya estaba permitido por shelters_update_status_super_admin.
-- ============================================================================

DROP POLICY IF EXISTS shelters_delete_super_admin ON shelters;
CREATE POLICY shelters_delete_super_admin ON shelters
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'super_admin'
      UNION
      SELECT id FROM public.shelters WHERE role = 'super_admin'
    )
  );
