-- MIGRATION v15
-- Create SEO Pages table
CREATE TABLE IF NOT EXISTS seo_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path TEXT UNIQUE NOT NULL,
    type TEXT CHECK (type IN ('page', 'article')),
    last_crawled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title TEXT,
    meta_description TEXT,
    h1 TEXT,
    word_count INT,
    seo_score INT DEFAULT 0,
    aio_score INT DEFAULT 0,
    published_at TIMESTAMP WITH TIME ZONE
);

-- Create SEO Suggestions table
CREATE TABLE IF NOT EXISTS seo_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES seo_pages(id) ON DELETE CASCADE,
    category TEXT CHECK (category IN ('Technical', 'Content', 'AIO', 'Schema')),
    issue TEXT NOT NULL,
    suggestion TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('High', 'Medium', 'Low')),
    status TEXT CHECK (status IN ('Open', 'Resolved')) DEFAULT 'Open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE seo_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_suggestions ENABLE ROW LEVEL SECURITY;

-- Policies for seo_pages
CREATE POLICY "Public Read SEO Pages" ON seo_pages
    FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated Insert SEO Pages" ON seo_pages
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated Update SEO Pages" ON seo_pages
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated Delete SEO Pages" ON seo_pages
    FOR DELETE TO authenticated USING (true);

-- Policies for seo_suggestions
CREATE POLICY "Public Read SEO Suggestions" ON seo_suggestions
    FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated Insert SEO Suggestions" ON seo_suggestions
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated Update SEO Suggestions" ON seo_suggestions
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated Delete SEO Suggestions" ON seo_suggestions
    FOR DELETE TO authenticated USING (true);
