-- ============================================================================
-- 043_signup_trigger_professionals.sql
-- Crea (de nuevo) el trigger on_auth_user_created para que, al registrarse,
-- se cree automáticamente la fila correcta según raw_user_meta_data.user_type:
--   'shelter'      -> shelters (pending)
--   'professional' -> profiles (user) + professionals (pending)
--   resto          -> profiles (user)
-- Cada inserción va en su propio bloque con manejo de excepciones para que un
-- fallo NUNCA bloquee el alta del usuario en auth.users.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  utype text := NEW.raw_user_meta_data->>'user_type';
  ptype text := NEW.raw_user_meta_data->>'professional_type';
BEGIN
  IF utype = 'shelter' THEN
    BEGIN
      INSERT INTO public.shelters (id, name, email, phone, location, description, status)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'Nueva protectora'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'location', ''),
        COALESCE(NEW.raw_user_meta_data->>'description', ''),
        'pending'
      )
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  ELSE
    -- Perfil base para usuarios y profesionales (les permite usar la app pública).
    BEGIN
      INSERT INTO public.profiles (id, email, display_name, phone, role)
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        'user'
      )
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    IF utype = 'professional' THEN
      BEGIN
        INSERT INTO public.professionals (owner_id, type, name, email, phone, location, status)
        VALUES (
          NEW.id,
          COALESCE(NULLIF(ptype, ''), 'veterinario'),
          COALESCE(NEW.raw_user_meta_data->>'name', 'Nuevo profesional'),
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'phone', ''),
          COALESCE(NEW.raw_user_meta_data->>'location', ''),
          'pending'
        );
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
