-- Monthly Planner - Database schema
-- Import this via phpMyAdmin (InfinityFree control panel > MySQL Databases > phpMyAdmin)
-- All tables include user_id (default 1) so Phase 2 login can be added later
-- without restructuring anything.

CREATE TABLE IF NOT EXISTS domains (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL DEFAULT 1,
  name VARCHAR(100) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  domain_id INT NOT NULL,
  user_id INT NOT NULL DEFAULT 1,
  name VARCHAR(255) NOT NULL,
  priority ENUM('high','medium','low') NOT NULL DEFAULT 'medium',
  tags VARCHAR(255) DEFAULT '',
  important TINYINT(1) NOT NULL DEFAULT 0,
  urgent TINYINT(1) NOT NULL DEFAULT 0,
  estimated_hours DECIMAL(6,2) DEFAULT NULL,
  actual_hours DECIMAL(6,2) NOT NULL DEFAULT 0,
  timer_started_at DATETIME DEFAULT NULL,
  status ENUM('active','done') NOT NULL DEFAULT 'active',
  deadline DATE DEFAULT NULL,
  is_recurring_instance TINYINT(1) NOT NULL DEFAULT 0,
  recurring_template_id INT DEFAULT NULL,
  completed_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS subtasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  priority ENUM('high','medium','low') NOT NULL DEFAULT 'medium',
  tags VARCHAR(255) DEFAULT '',
  deadline DATE DEFAULT NULL,
  done TINYINT(1) NOT NULL DEFAULT 0,
  is_recurring_instance TINYINT(1) NOT NULL DEFAULT 0,
  recurring_template_id INT DEFAULT NULL,
  completed_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS recurring_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  domain_id INT NOT NULL,
  task_id INT DEFAULT NULL COMMENT 'if set, generates a subtask under this task instead of a new task',
  name VARCHAR(255) NOT NULL,
  frequency ENUM('daily','weekly') NOT NULL,
  weekday VARCHAR(20) DEFAULT NULL COMMENT 'comma-separated 0=Sunday..6=Saturday, only for weekly',
  priority ENUM('high','medium','low') NOT NULL DEFAULT 'medium',
  tags VARCHAR(255) DEFAULT '',
  important TINYINT(1) NOT NULL DEFAULT 0,
  urgent TINYINT(1) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  last_generated_period VARCHAR(10) DEFAULT NULL COMMENT 'deprecated, generation now checks for an existing instance directly',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS goals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  domain_id INT DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  type ENUM('annual','quarterly','monthly') NOT NULL,
  year INT DEFAULT NULL,
  quarter TINYINT DEFAULT NULL COMMENT '1-4, only for quarterly goals',
  month TINYINT DEFAULT NULL COMMENT '1-12, only for monthly goals',
  target_date DATE DEFAULT NULL,
  notes TEXT,
  done TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'used directly for monthly goals (flat checklist, no sub-goals)',
  progress_percent INT NOT NULL DEFAULT 0 COMMENT 'deprecated -- annual/quarterly progress is now computed from goal_items',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sub-goals for annual/quarterly goals (a simple checklist per goal, same
-- pattern as tasks -> subtasks). Monthly goals do NOT use this table --
-- they're a flat single-level checklist by design (kept simple on purpose).
CREATE TABLE IF NOT EXISTS goal_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  goal_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  done TINYINT(1) NOT NULL DEFAULT 0,
  completed_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Single free-write scratchpad (one row, id=1). Not per-day -- just a rough pad.
CREATE TABLE IF NOT EXISTS journal (
  id INT PRIMARY KEY,
  content MEDIUMTEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed: your two domains + real task list, ready to go on first load
INSERT INTO domains (name, sort_order) VALUES ('Company', 1), ('Self', 2);

SET @company := (SELECT id FROM domains WHERE name='Company' LIMIT 1);
SET @self_id := (SELECT id FROM domains WHERE name='Self' LIMIT 1);

INSERT INTO tasks (domain_id, name, priority) VALUES
(@company, 'Amazon product upload', 'medium'),
(@company, 'Thin Wall tube research', 'medium'),
(@company, 'Blog approve 2', 'medium'),
(@company, 'Linkedin post 4', 'medium'),
(@company, 'Manjusar site visit', 'medium'),
(@company, 'Amit Bhatia sir learn 11 session', 'medium'),
(@company, 'Service department document keepup', 'medium'),
(@company, 'Invoices excel sheet', 'medium'),
(@company, 'Bhaskar sir topic learn', 'medium'),
(@company, 'Facebook 4 post for service application', 'medium'),
(@company, 'NTT report read and understand', 'medium'),
(@company, 'Kpi finalized', 'medium'),
(@company, 'Seo webpage on website', 'medium'),
(@company, 'Supervisor license', 'medium'),
(@company, 'FMS - flow management system', 'medium'),
(@company, 'Inventory management system', 'medium'),
(@company, 'Any miscellaneous small works in daily chores', 'low'),
(@company, 'Amazon selling (skill)', 'low'),
(@company, 'Claude designer (skill)', 'low'),
(@company, 'Canva designer (skill)', 'low'),
(@self_id, 'Book reading: MFL, 48 LOP, POM', 'medium'),
(@self_id, 'Eye exercises 15 minutes', 'medium'),
(@self_id, 'Weight lose: max 80 kg', 'medium'),
(@self_id, 'Instagram new account speech practice', 'medium');
