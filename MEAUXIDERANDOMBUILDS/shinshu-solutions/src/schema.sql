-- Shinshu Solutions Database Schema
-- D1 Database: shinshu-solutions
-- ID: 071a4f1b-da85-4bdb-a32a-de3e608269d3

-- ============================================
-- CLIENTS
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'USA',
  status TEXT DEFAULT 'active', -- active, inactive, archived
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- ============================================
-- CONTACTS
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  client_id TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  title TEXT,
  role TEXT, -- primary, secondary, billing, technical
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- ============================================
-- PROPERTIES
-- ============================================
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  client_id TEXT,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  property_type TEXT, -- residential, commercial, industrial, land
  square_feet INTEGER,
  bedrooms INTEGER,
  bathrooms REAL,
  lot_size TEXT,
  year_built INTEGER,
  status TEXT DEFAULT 'active', -- active, sold, pending, off-market
  listing_price REAL,
  current_value REAL,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- ============================================
-- PROJECTS
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  client_id TEXT,
  property_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  project_type TEXT, -- construction, renovation, maintenance, inspection, other
  status TEXT DEFAULT 'planning', -- planning, in_progress, on_hold, completed, cancelled
  start_date INTEGER,
  end_date INTEGER,
  budget REAL,
  actual_cost REAL,
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  assigned_to TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
);

-- ============================================
-- SERVICES
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  service_type TEXT, -- design, construction, consulting, maintenance, inspection
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  unit_price REAL,
  quantity REAL DEFAULT 1,
  total_price REAL,
  start_date INTEGER,
  end_date INTEGER,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- ============================================
-- DOCUMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  client_id TEXT,
  property_id TEXT,
  project_id TEXT,
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- pdf, doc, xls, image, etc.
  file_size INTEGER, -- bytes
  r2_key TEXT NOT NULL, -- R2 storage key
  category TEXT, -- contract, invoice, blueprint, photo, report, other
  description TEXT,
  uploaded_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_contacts_client ON contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_properties_client ON properties(client_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_property ON projects(property_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_services_project ON services(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_client ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_property ON documents(property_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
