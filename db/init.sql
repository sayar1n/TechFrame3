-- Basic schema

CREATE TABLE IF NOT EXISTS iss_fetch_log (
    id BIGSERIAL PRIMARY KEY,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_url TEXT NOT NULL,
    payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS osdr_items (
    id BIGSERIAL PRIMARY KEY,
    dataset_id TEXT UNIQUE,
    title TEXT,
    raw JSONB,
    updated_at TIMESTAMPTZ,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Миграция: добавляем колонки если их нет
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='osdr_items' AND column_name='status') THEN
        ALTER TABLE osdr_items ADD COLUMN status TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='osdr_items' AND column_name='rest_url') THEN
        ALTER TABLE osdr_items ADD COLUMN rest_url TEXT;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS telemetry_legacy (
    id BIGSERIAL PRIMARY KEY,
    recorded_at TIMESTAMPTZ NOT NULL,
    voltage NUMERIC(6,2) NOT NULL,
    temp NUMERIC(6,2) NOT NULL,
    source_file TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cms_pages (
    id BIGSERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cms_blocks (
    id BIGSERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_iss_fetch_log_fetched_at ON iss_fetch_log(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_osdr_items_dataset_id ON osdr_items(dataset_id);
CREATE INDEX IF NOT EXISTS idx_osdr_items_inserted_at ON osdr_items(inserted_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_blocks_slug_active ON cms_blocks(slug, is_active);

-- Seed с демо контентом
INSERT INTO cms_pages(slug, title, body)
VALUES
('welcome', 'Добро пожаловать', '<h3>Демо контент</h3><p>Этот текст хранится в БД</p>'),
('unsafe', 'Небезопасный пример', '<script>console.log("XSS training")</script><p>Если вы видите всплывашку значит защита не работает</p>')
ON CONFLICT DO NOTHING;

INSERT INTO cms_blocks(slug, content, is_active)
VALUES
('dashboard_experiment', '<div class="alert alert-info">Это CMS блок из базы данных</div>', TRUE)
ON CONFLICT DO NOTHING;

