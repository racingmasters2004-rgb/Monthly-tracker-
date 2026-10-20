-- =========================================================
-- Monthly Planner & Expense Tracker — Database Migration
-- PostgreSQL / Supabase schema with Row-Level Security (RLS)
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User Profiles
CREATE TABLE IF NOT EXISTS profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT 'User',
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    currency TEXT NOT NULL DEFAULT 'INR',
    currency_symbol TEXT NOT NULL DEFAULT '₹',
    sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    haptic_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    onboarding_done BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only read own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can only update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Domains
CREATE TABLE IF NOT EXISTS domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_domains_user ON domains(user_id, sort_order);
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own domains" ON domains FOR ALL USING (auth.uid() = user_id);

-- 3. Tasks
CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE task_status AS ENUM ('active', 'done');

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    priority priority_level NOT NULL DEFAULT 'medium',
    tags TEXT[] NOT NULL DEFAULT '{}',
    important BOOLEAN NOT NULL DEFAULT FALSE,
    urgent BOOLEAN NOT NULL DEFAULT FALSE,
    status task_status NOT NULL DEFAULT 'active',
    deadline DATE,
    completed_at TIMESTAMPTZ,
    is_recurring_instance BOOLEAN NOT NULL DEFAULT FALSE,
    recurring_template_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_domain ON tasks(user_id, domain_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(user_id, deadline);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);

-- 4. Subtasks
CREATE TABLE IF NOT EXISTS subtasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    priority priority_level NOT NULL DEFAULT 'medium',
    tags TEXT[] NOT NULL DEFAULT '{}',
    deadline DATE,
    done BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    is_recurring_instance BOOLEAN NOT NULL DEFAULT FALSE,
    recurring_template_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id, done);
CREATE INDEX IF NOT EXISTS idx_subtasks_user ON subtasks(user_id, deadline);
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subtasks" ON subtasks FOR ALL USING (auth.uid() = user_id);

-- 5. Recurring Templates
CREATE TYPE recurring_frequency AS ENUM ('daily', 'weekly');

CREATE TABLE IF NOT EXISTS recurring_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    frequency recurring_frequency NOT NULL DEFAULT 'daily',
    weekdays SMALLINT[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
    priority priority_level NOT NULL DEFAULT 'medium',
    tags TEXT[] NOT NULL DEFAULT '{}',
    important BOOLEAN NOT NULL DEFAULT FALSE,
    urgent BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rec_tpl_user ON recurring_templates(user_id, active);
ALTER TABLE recurring_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own recurring templates" ON recurring_templates FOR ALL USING (auth.uid() = user_id);

-- 6. Goals
CREATE TYPE goal_type AS ENUM ('annual', 'quarterly', 'monthly');

CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    type goal_type NOT NULL,
    year INT NOT NULL,
    quarter SMALLINT,
    month SMALLINT,
    target_date DATE,
    notes TEXT,
    done BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_user_period ON goals(user_id, type, year, quarter, month);
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own goals" ON goals FOR ALL USING (auth.uid() = user_id);

-- 7. Goal Items (Checklist sub-goals for annual and quarterly)
CREATE TABLE IF NOT EXISTS goal_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goal_items_goal ON goal_items(goal_id);
ALTER TABLE goal_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own goal items" ON goal_items FOR ALL USING (auth.uid() = user_id);

-- 8. Journal
CREATE TABLE IF NOT EXISTS journal (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE journal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own journal" ON journal FOR ALL USING (auth.uid() = user_id);

-- 9. Expense Categories
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type transaction_type NOT NULL DEFAULT 'expense',
    icon TEXT NOT NULL DEFAULT 'Tag',
    color TEXT NOT NULL DEFAULT '#1F3A52',
    sort_order INT NOT NULL DEFAULT 1,
    monthly_budget NUMERIC(12, 2),
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_user ON expense_categories(user_id, type, sort_order);
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own expense categories" ON expense_categories FOR ALL USING (auth.uid() = user_id);

-- 10. Payment Methods
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT,
    sort_order INT NOT NULL DEFAULT 1,
    archived BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_methods_user ON payment_methods(user_id, sort_order);
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own payment methods" ON payment_methods FOR ALL USING (auth.uid() = user_id);

-- 11. Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    occurred_on DATE NOT NULL,
    occurred_at TIMESTAMPTZ,
    category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
    note TEXT,
    payee TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}',
    recurring_template_id UUID,
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions(user_id, occurred_on DESC);
CREATE INDEX IF NOT EXISTS idx_tx_user_cat ON transactions(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_tx_user_method ON transactions(user_id, payment_method_id);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);

-- 12. Expense Recurring Templates
CREATE TYPE expense_frequency AS ENUM ('daily', 'weekly', 'monthly');

CREATE TABLE IF NOT EXISTS expense_recurring_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    category_id UUID REFERENCES expense_categories(id) ON DELETE CASCADE,
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
    note TEXT,
    frequency expense_frequency NOT NULL DEFAULT 'monthly',
    weekdays SMALLINT[],
    day_of_month SMALLINT,
    start_on DATE NOT NULL,
    end_on DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE expense_recurring_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own expense recurring" ON expense_recurring_templates FOR ALL USING (auth.uid() = user_id);
