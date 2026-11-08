CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE media_type_enum AS ENUM ('movie', 'tv');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    avatar_url TEXT,
    banner_url TEXT,
    bio TEXT DEFAULT '',
    total_watch_time INT DEFAULT 0, -- in seconds
    movies_watched INT DEFAULT 0,
    series_watched INT DEFAULT 0,
    streak_days INT DEFAULT 1,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    preferences JSONB DEFAULT '{"accent": "ffffff", "provider": "cinesrc", "autoplay": true, "quality": "1080p"}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    media_id TEXT NOT NULL,
    media_type media_type_enum NOT NULL,
    title TEXT NOT NULL,
    poster_path TEXT,
    rating NUMERIC(3,1),
    notes TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_media UNIQUE (user_id, media_id, media_type)
);

-- 5. WATCH PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    media_id TEXT NOT NULL,
    media_type media_type_enum NOT NULL,
    season INT DEFAULT 1,
    episode INT DEFAULT 1,
    current_time NUMERIC(10,2) DEFAULT 0,
    duration NUMERIC(10,2) DEFAULT 0,
    progress_pct NUMERIC(5,2) DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_progress UNIQUE (user_id, media_id, media_type)
);

-- 6. TV EPISODE DETAILED PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.tv_episode_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    show_id TEXT NOT NULL,
    season_number INT NOT NULL,
    episode_number INT NOT NULL,
    current_time NUMERIC(10,2) DEFAULT 0,
    duration NUMERIC(10,2) DEFAULT 0,
    progress_pct NUMERIC(5,2) DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_ep_progress UNIQUE (user_id, show_id, season_number, episode_number)
);

-- 7. CUSTOM PLAYLISTS TABLE
CREATE TABLE IF NOT EXISTS public.playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    is_public BOOLEAN DEFAULT TRUE,
    cover_url TEXT,
    share_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PLAYLIST ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.playlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
    media_id TEXT NOT NULL,
    media_type media_type_enum NOT NULL,
    title TEXT NOT NULL,
    poster_path TEXT,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_playlist_media UNIQUE (playlist_id, media_id, media_type)
);

-- 9. USER REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.user_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    media_id TEXT NOT NULL,
    media_type media_type_enum NOT NULL,
    rating NUMERIC(3,1) CHECK (rating >= 1 AND rating <= 10),
    review_text TEXT NOT NULL,
    upvotes INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_review UNIQUE (user_id, media_id, media_type)
);

-- 10. SOCIAL USER FOLLOWS TABLE
CREATE TABLE IF NOT EXISTS public.user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_social_follow UNIQUE (follower_id, following_id)
);

-- 11. SECURITY AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    ip_address TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. WATCH HISTORY LOG TABLE
CREATE TABLE IF NOT EXISTS public.watch_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    media_id TEXT NOT NULL,
    media_type media_type_enum NOT NULL,
    title TEXT NOT NULL,
    season INT,
    episode INT,
    watched_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- HIGH-PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_user ON public.watchlists(user_id, media_type);
CREATE INDEX IF NOT EXISTS idx_progress_user ON public.progress(user_id, media_type, media_id);
CREATE INDEX IF NOT EXISTS idx_ep_progress_show ON public.tv_episode_progress(user_id, show_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user ON public.playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist ON public.playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_reviews_media ON public.user_reviews(media_id, media_type);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_watch_history_user ON public.watch_history(user_id, watched_at DESC);

-- ============================================================================
-- AUTOMATED TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function 1: Automatically handle new user sign-up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, username, avatar_url, bio)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'bio', '')
    )
    ON CONFLICT (user_id) DO UPDATE SET
        username = EXCLUDED.username,
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);

    INSERT INTO public.audit_logs (user_id, event_type, metadata)
    VALUES (NEW.id, 'ACCOUNT_CREATED', jsonb_build_object('email', NEW.email));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Fire on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function 2: Automatically update timestamp on profile & progress edits
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_progress_updated_at ON public.progress;
CREATE TRIGGER trg_progress_updated_at BEFORE UPDATE ON public.progress FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Function 3: RPC function to calculate user statistics internally
CREATE OR REPLACE FUNCTION public.get_user_stats(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    v_watch_secs INT;
    v_movies INT;
    v_series INT;
    v_saved INT;
    v_reviews INT;
BEGIN
    SELECT COALESCE(SUM(current_time), 0)::INT INTO v_watch_secs
    FROM public.progress WHERE user_id = target_user_id;

    SELECT COUNT(*) INTO v_movies
    FROM public.progress WHERE user_id = target_user_id AND media_type = 'movie' AND progress_pct >= 85;

    SELECT COUNT(*) INTO v_series
    FROM public.progress WHERE user_id = target_user_id AND media_type = 'tv';

    SELECT COUNT(*) INTO v_saved
    FROM public.watchlists WHERE user_id = target_user_id;

    SELECT COUNT(*) INTO v_reviews
    FROM public.user_reviews WHERE user_id = target_user_id;

    result := jsonb_build_object(
        'total_watch_seconds', v_watch_secs,
        'movies_completed', v_movies,
        'series_episodes_watched', v_series,
        'watchlist_saved_count', v_saved,
        'user_reviews_count', v_reviews
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 4: Atomic Account Deletion Helper RPC
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    DELETE FROM public.watchlists WHERE user_id = v_user_id;
    DELETE FROM public.progress WHERE user_id = v_user_id;
    DELETE FROM public.tv_episode_progress WHERE user_id = v_user_id;
    DELETE FROM public.playlists WHERE user_id = v_user_id;
    DELETE FROM public.user_reviews WHERE user_id = v_user_id;
    DELETE FROM public.user_follows WHERE follower_id = v_user_id OR following_id = v_user_id;
    DELETE FROM public.audit_logs WHERE user_id = v_user_id;
    DELETE FROM public.watch_history WHERE user_id = v_user_id;
    DELETE FROM public.profiles WHERE user_id = v_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DATABASE VIEWS
-- ============================================================================

-- View 1: User Dashboard Summary
CREATE OR REPLACE VIEW public.user_dashboard_summary AS
SELECT 
    p.user_id,
    p.username,
    p.avatar_url,
    p.banner_url,
    p.bio,
    p.tier,
    p.created_at AS joined_at,
    COALESCE(w.watchlist_count, 0) AS total_watchlist_items,
    COALESCE(pr.completed_count, 0) AS total_completed_titles
FROM public.profiles p
LEFT JOIN (
    SELECT user_id, COUNT(*) AS watchlist_count 
    FROM public.watchlists 
    GROUP BY user_id
) w ON w.user_id = p.user_id
LEFT JOIN (
    SELECT user_id, COUNT(*) AS completed_count 
    FROM public.progress 
    WHERE progress_pct >= 85 
    GROUP BY user_id
) pr ON pr.user_id = p.user_id;

-- View 2: Community Trending Picks
CREATE OR REPLACE VIEW public.community_trending_picks AS
SELECT 
    media_id,
    media_type,
    title,
    poster_path,
    COUNT(*) AS total_saves
FROM public.watchlists
GROUP BY media_id, media_type, title, poster_path
ORDER BY total_saves DESC
LIMIT 30;

-- View 3: Media Ratings Aggregation View
CREATE OR REPLACE VIEW public.media_community_ratings AS
SELECT 
    media_id,
    media_type,
    COUNT(*) AS total_reviews,
    ROUND(AVG(rating), 1) AS avg_community_rating
FROM public.user_reviews
GROUP BY media_id, media_type;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tv_episode_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, User write
CREATE POLICY "Public Profiles Read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users Update Own Profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users Insert Own Profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Watchlists: User access only
CREATE POLICY "Users Manage Own Watchlist" ON public.watchlists FOR ALL USING (auth.uid() = user_id);

-- Progress: User access only
CREATE POLICY "Users Manage Own Progress" ON public.progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users Manage Own Episode Progress" ON public.tv_episode_progress FOR ALL USING (auth.uid() = user_id);

-- Playlists: Public read if is_public, User manage
CREATE POLICY "Playlists Read Policy" ON public.playlists FOR SELECT USING (is_public OR auth.uid() = user_id);
CREATE POLICY "Playlists User Manage" ON public.playlists FOR ALL USING (auth.uid() = user_id);

-- Playlist Items: Read if playlist public, User manage
CREATE POLICY "Playlist Items Read" ON public.playlist_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND (is_public OR user_id = auth.uid()))
);
CREATE POLICY "Playlist Items Manage" ON public.playlist_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND user_id = auth.uid())
);

-- User Reviews: Public read, User manage
CREATE POLICY "User Reviews Public Read" ON public.user_reviews FOR SELECT USING (true);
CREATE POLICY "Users Manage Own Reviews" ON public.user_reviews FOR ALL USING (auth.uid() = user_id);

-- Social Follows: Public read, User manage
CREATE POLICY "Social Follows Read" ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "Users Manage Own Follows" ON public.user_follows FOR ALL USING (auth.uid() = follower_id);

-- Audit Logs: User access only
CREATE POLICY "Users View Own Audit Logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);

-- Watch History: User access only
CREATE POLICY "Users Manage Own History" ON public.watch_history FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- REALTIME PUBSUB SETUP
-- ============================================================================
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.progress;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.watchlists;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_reviews;
EXCEPTION
    WHEN OTHERS THEN null;
END $$;
