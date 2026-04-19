-- =====================================================
-- LOOKITRY SOCIAL OS - Analytics Database
-- =====================================================

-- Tabla principal de posts
CREATE TABLE IF NOT EXISTS social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('twitter', 'facebook', 'instagram', 'linkedin')),
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('image', 'carousel', 'video', 'text')),
    caption_text TEXT,
    image_url TEXT,
    carousel_images TEXT[], -- Array de URLs para carousels
    posted_at TIMESTAMPTZ NOT NULL,
    buffer_post_id VARCHAR(255), -- ID del post en Buffer
    status VARCHAR(20) DEFAULT 'posted' CHECK (status IN ('draft', 'scheduled', 'posted', 'failed')),
    
    -- Hook y CTA tracking
    hook_type VARCHAR(50),
    hook_text TEXT,
    cta_type VARCHAR(50),
    cta_text TEXT,
    
    -- Métricas (se actualizan manualmente o via API)
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    
    -- Engagements calculados
    engagement_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Deduplicación
    UNIQUE(buffer_post_id, platform)
);

-- Tabla de métricas por día (para tracking histórico)
CREATE TABLE IF NOT EXISTS social_metrics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL,
    metric_date DATE NOT NULL,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, platform, metric_date)
);

-- Tabla de hooks (biblioteca de hooks virales)
CREATE TABLE IF NOT EXISTS social_hooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hook_type VARCHAR(50) NOT NULL,
    hook_text TEXT NOT NULL,
    description TEXT,
    engagement_avg DECIMAL(5,2) DEFAULT 0,
    uses_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    best_platforms TEXT[], -- ['instagram', 'twitter']
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de content calendar
CREATE TABLE IF NOT EXISTS social_content_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(20) NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    content_type VARCHAR(20) NOT NULL,
    theme VARCHAR(100),
    caption_template TEXT,
    image_prompt TEXT,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'draft', 'scheduled', 'posted', 'cancelled')),
    post_id UUID REFERENCES social_posts(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform, scheduled_date, scheduled_time)
);

-- Tabla de performance summary (agregaciones)
CREATE TABLE IF NOT EXISTS social_performance_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(20) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_posts INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    total_shares INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    avg_engagement_rate DECIMAL(5,2) DEFAULT 0,
    best_hook_id UUID REFERENCES social_hooks(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform, period_start, period_end)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_posts_platform ON social_posts(platform);
CREATE INDEX IF NOT EXISTS idx_posts_posted_at ON social_posts(posted_at);
CREATE INDEX IF NOT EXISTS idx_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_hooks_type ON social_hooks(hook_type);
CREATE INDEX IF NOT EXISTS idx_hooks_engagement ON social_hooks(engagement_avg DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_date ON social_content_calendar(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_calendar_status ON social_content_calendar(status);
CREATE INDEX IF NOT EXISTS idx_metrics_post ON social_metrics_daily(post_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Función para actualizar engagement rate
CREATE OR REPLACE FUNCTION update_engagement_rate()
RETURNS TRIGGER AS $$
BEGIN
    NEW.engagement_rate := CASE 
        WHEN NEW.views > 0 THEN 
            ROUND(((NEW.likes + NEW.comments + NEW.shares + NEW.saves)::DECIMAL / NEW.views * 100), 2)
        ELSE 0
    END;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar engagement automáticamente
DROP TRIGGER IF EXISTS trg_update_engagement ON social_posts;
CREATE TRIGGER trg_update_engagement
    BEFORE UPDATE ON social_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_engagement_rate();

-- Función para trackear uso de hook
CREATE OR REPLACE FUNCTION track_hook_use()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.hook_text IS NOT NULL THEN
        UPDATE social_hooks 
        SET uses_count = uses_count + 1,
            updated_at = NOW()
        WHERE hook_text = NEW.hook_text;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para trackear hooks
DROP TRIGGER IF EXISTS trg_track_hook_use ON social_posts;
CREATE TRIGGER trg_track_hook_use
    AFTER INSERT ON social_posts
    FOR EACH ROW
    EXECUTE FUNCTION track_hook_use();

-- =====================================================
-- VIEWS
-- =====================================================

-- Vista de performance por platform
CREATE OR REPLACE VIEW v_social_performance AS
SELECT 
    platform,
    COUNT(*) as total_posts,
    SUM(likes) as total_likes,
    SUM(comments) as total_comments,
    SUM(shares) as total_shares,
    SUM(views) as total_views,
    AVG(engagement_rate) as avg_engagement_rate,
    MAX(engagement_rate) as best_engagement_rate
FROM social_posts
WHERE status = 'posted'
GROUP BY platform;

-- Vista de mejores hooks
CREATE OR REPLACE VIEW v_best_hooks AS
SELECT 
    h.*,
    CASE WHEN h.uses_count > 0 THEN 
        ROUND((h.success_count::DECIMAL / h.uses_count) * 100, 2)
    ELSE 0 END as success_rate
FROM social_hooks h
WHERE h.uses_count >= 3
ORDER BY h.engagement_avg DESC
LIMIT 20;

-- =====================================================
-- SEED DATA - Hooks iniciales
-- =====================================================

INSERT INTO social_hooks (hook_type, hook_text, description) VALUES
    ('question', '¿Sabías que...?', 'Pregunta que genera curiosidad'),
    ('stat', 'El 90% de las personas...', 'Estadística que impacta'),
    ('story', 'Esta es la historia de...', 'Storytelling personal'),
    ('controversy', 'Lo que nadie te dice sobre...', 'Perspectiva controversial'),
    ('howto', 'Cómo conseguir... en 3 pasos', 'Tutorial rápido'),
    ('fact', 'La verdad sobre...', 'Desmitificación'),
    ('challenge', 'Prueba esto esta semana...', 'Reto para el usuario'),
    ('comparison', 'Antes vs Después', 'Transformación visual')
ON CONFLICT DO NOTHING;

-- =====================================================
-- RLS POLICIES (Row Level Security)
-- =====================================================

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_hooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_performance_summary ENABLE ROW LEVEL SECURITY;

-- Por ahora, solo el owner puede ver/editar (Sam Wilkie - ID 1049458877)
-- Esto se ajustará cuando tengamos auth
