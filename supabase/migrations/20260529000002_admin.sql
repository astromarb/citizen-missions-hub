-- Admin flag on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Per-banner display name + description (managed by admin portal)
CREATE TABLE IF NOT EXISTS banner_items (
  filename    TEXT PRIMARY KEY,
  display_name TEXT,
  description  TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE banner_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_banner_items"  ON banner_items;
DROP POLICY IF EXISTS "admin_write_banner_items"   ON banner_items;
CREATE POLICY "public_read_banner_items" ON banner_items
  FOR SELECT USING (true);
CREATE POLICY "admin_write_banner_items" ON banner_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Per-set description (Collection subtitle shown in banner picker)
CREATE TABLE IF NOT EXISTS banner_sets_meta (
  set_name    TEXT PRIMARY KEY,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE banner_sets_meta ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_banner_sets_meta" ON banner_sets_meta;
DROP POLICY IF EXISTS "admin_write_banner_sets_meta"  ON banner_sets_meta;
CREATE POLICY "public_read_banner_sets_meta" ON banner_sets_meta
  FOR SELECT USING (true);
CREATE POLICY "admin_write_banner_sets_meta" ON banner_sets_meta
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Broadcasts — groundwork for future push/in-app messages
CREATE TABLE IF NOT EXISTS broadcasts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL DEFAULT '',
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at     TIMESTAMPTZ
);

ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_broadcasts" ON broadcasts;
CREATE POLICY "admin_all_broadcasts" ON broadcasts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
