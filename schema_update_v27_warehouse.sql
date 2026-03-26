-- ============================================
-- Schema Update v27: Warehouse Management
-- Quản lý Kho - Phiếu nhập hàng nhiều vật tư
-- ============================================

-- 1. Danh mục vật tư (Master Materials)
CREATE TABLE IF NOT EXISTS warehouse_materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  unit TEXT NOT NULL DEFAULT 'cái',  -- đơn vị tính: cái, m, m², kg, cuộn, tấm, bộ...
  category TEXT,  -- nhóm: LED, Mica, Inox, Aluminium, Điện, Phụ kiện...
  stock_quantity NUMERIC(12,2) DEFAULT 0,
  min_stock NUMERIC(12,2) DEFAULT 0,  -- mức tồn kho tối thiểu (cảnh báo)
  unit_price NUMERIC(14,2) DEFAULT 0,  -- giá tham khảo
  note TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Phiếu nhập hàng (Import Receipt Header)
CREATE TABLE IF NOT EXISTS import_receipts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  receipt_code TEXT UNIQUE NOT NULL,  -- mã phiếu: PN-20260321-001
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier TEXT,  -- nhà cung cấp
  total_amount NUMERIC(14,2) DEFAULT 0,
  note TEXT,
  status TEXT CHECK (status IN ('draft', 'confirmed', 'cancelled')) DEFAULT 'confirmed',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Chi tiết phiếu nhập (Import Receipt Items)
CREATE TABLE IF NOT EXISTS import_receipt_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  receipt_id UUID NOT NULL REFERENCES import_receipts(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES warehouse_materials(id),
  quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(14,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Enable RLS
-- ============================================
ALTER TABLE warehouse_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_receipt_items ENABLE ROW LEVEL SECURITY;

-- Policies: Service Role full access (admin API routes use service role key)
CREATE POLICY "Service Role Full Access warehouse_materials" ON warehouse_materials USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access import_receipts" ON import_receipts USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access import_receipt_items" ON import_receipt_items USING (true) WITH CHECK (true);

-- ============================================
-- Trigger: auto update updated_at
-- ============================================
CREATE TRIGGER update_warehouse_materials_updated_at 
  BEFORE UPDATE ON warehouse_materials 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_import_receipts_updated_at 
  BEFORE UPDATE ON import_receipts 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================
-- Function: Auto update stock when receipt confirmed
-- ============================================
CREATE OR REPLACE FUNCTION update_stock_on_import()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE warehouse_materials
  SET stock_quantity = stock_quantity + NEW.quantity
  WHERE id = NEW.material_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_on_import
  AFTER INSERT ON import_receipt_items
  FOR EACH ROW EXECUTE PROCEDURE update_stock_on_import();

-- ============================================
-- Seed: Default materials for signage business
-- ============================================
INSERT INTO warehouse_materials (name, sku, unit, category, stock_quantity, note) VALUES
  ('Mica trắng sữa 3mm', 'MICA-3MM-W', 'tấm', 'Mica', 0, 'Kích thước 1220x2440mm'),
  ('Mica trắng sữa 5mm', 'MICA-5MM-W', 'tấm', 'Mica', 0, 'Kích thước 1220x2440mm'),
  ('Mica trong suốt 3mm', 'MICA-3MM-T', 'tấm', 'Mica', 0, 'Kích thước 1220x2440mm'),
  ('LED module Hàn Quốc', 'LED-MOD-KR', 'bộ', 'LED', 0, 'Module 3 bóng, ánh sáng trắng'),
  ('LED thanh nhôm 12V', 'LED-BAR-12V', 'thanh', 'LED', 0, '1m, ánh sáng trắng 6500K'),
  ('LED Neon Flex', 'LED-NEON', 'mét', 'LED', 0, '12V, nhiều màu'),
  ('Nguồn tổ ong 12V-30A', 'PSU-12V-30A', 'cái', 'Điện', 0, '360W'),
  ('Nguồn tổ ong 12V-20A', 'PSU-12V-20A', 'cái', 'Điện', 0, '240W'),
  ('Inox gương 304', 'INOX-304-G', 'tấm', 'Inox', 0, '1220x2440mm, dày 0.8mm'),
  ('Inox xước 304', 'INOX-304-X', 'tấm', 'Inox', 0, '1220x2440mm, dày 0.8mm'),
  ('Inox vàng gương 304', 'INOX-304-VG', 'tấm', 'Inox', 0, '1220x2440mm, dày 0.8mm'),
  ('Aluminium composite 3mm', 'ALU-3MM', 'tấm', 'Aluminium', 0, 'Kích thước 1220x2440mm'),
  ('Aluminium composite 4mm', 'ALU-4MM', 'tấm', 'Aluminium', 0, 'Kích thước 1220x2440mm'),
  ('Sắt hộp 20x40', 'SAT-20x40', 'cây', 'Sắt/Thép', 0, 'Dài 6m'),
  ('Sắt hộp 40x40', 'SAT-40x40', 'cây', 'Sắt/Thép', 0, 'Dài 6m'),
  ('Tôn galvanize 0.45mm', 'TON-045', 'tấm', 'Tôn', 0, '1220x2440mm'),
  ('Keo Silicone trong', 'KEO-SILI-T', 'tuýp', 'Phụ kiện', 0, '300ml'),
  ('Rivets (đinh tán) 4mm', 'RIVET-4MM', 'hộp', 'Phụ kiện', 0, '1000 cái/hộp'),
  ('Dây điện 2x1.5mm', 'DAY-2x15', 'mét', 'Điện', 0, 'Dây đôi'),
  ('Băng keo 2 mặt VHB', 'BK-VHB', 'cuộn', 'Phụ kiện', 0, '3M VHB, 12mm x 33m')
ON CONFLICT (sku) DO NOTHING;
