-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  level TEXT DEFAULT 'Culture Explorer',
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  countries_bridged TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenges table
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('audio', 'visual', 'cultural', 'quiz')),
  country TEXT NOT NULL,
  flag TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  options JSONB,
  correct_answer TEXT,
  media_url TEXT,
  is_daily BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_challenges table to track completion
CREATE TABLE public.user_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  points_earned INTEGER NOT NULL,
  user_answer TEXT,
  is_correct BOOLEAN,
  UNIQUE(user_id, challenge_id)
);

-- Create social feed posts table
CREATE TABLE public.feed_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  points_earned INTEGER DEFAULT 0,
  streak_count INTEGER DEFAULT 0,
  country TEXT,
  flag TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create likes table
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Create comments table
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create friendships table
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Challenges policies (public read)
CREATE POLICY "Anyone can view challenges" ON public.challenges FOR SELECT USING (true);

-- User challenges policies
CREATE POLICY "Users can view their own challenge completions" ON public.user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own challenge completions" ON public.user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Feed posts policies
CREATE POLICY "Anyone can view feed posts" ON public.feed_posts FOR SELECT USING (true);
CREATE POLICY "Users can create their own feed posts" ON public.feed_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Post likes policies
CREATE POLICY "Anyone can view likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own likes" ON public.post_likes FOR ALL USING (auth.uid() = user_id);

-- Post comments policies
CREATE POLICY "Anyone can view comments" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.post_comments FOR UPDATE USING (auth.uid() = user_id);

-- Friendships policies
CREATE POLICY "Users can view their friendships" ON public.friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can create friendships" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their friendships" ON public.friendships FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample challenges
INSERT INTO public.challenges (title, description, type, country, flag, points, difficulty, options, correct_answer) VALUES
('Learn Japanese Greeting', 'Listen and repeat: "Ohayo gozaimasu" (Good morning)', 'audio', 'Japan', '🇯🇵', 10, 'Easy', '{"audio_url": "/audio/japanese-greeting.mp3"}', 'ohayo gozaimasu'),
('Guess the Dish', 'Which country is famous for this delicious pasta dish?', 'visual', 'Italy', '🇮🇹', 15, 'Medium', '{"image_url": "/images/pasta.jpg", "choices": ["🇮🇹 Italy", "🇫🇷 France", "🇪🇸 Spain", "🇬🇷 Greece"]}', '🇮🇹 Italy'),
('Complete the Proverb', 'Complete this saying: "When in Rome..."', 'cultural', 'Italy', '🇮🇹', 20, 'Hard', '{"hint": "This proverb is about adapting to local customs"}', 'do as the Romans do'),
('Korean Counting', 'How do you say "one" in Korean?', 'quiz', 'South Korea', '🇰🇷', 10, 'Easy', '{"choices": ["하나 (hana)", "둘 (dul)", "셋 (set)", "넷 (net)"]}', '하나 (hana)'),
('French Cuisine', 'What is the main ingredient in French Ratatouille?', 'quiz', 'France', '🇫🇷', 15, 'Medium', '{"choices": ["Vegetables", "Meat", "Fish", "Cheese"]}', 'Vegetables'),
('German Tradition', 'What is Oktoberfest primarily known for?', 'quiz', 'Germany', '🇩🇪', 15, 'Medium', '{"choices": ["Beer festival", "Music festival", "Food festival", "Art festival"]}', 'Beer festival');

-- Function to get daily challenge
CREATE OR REPLACE FUNCTION public.get_daily_challenge()
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  type TEXT,
  country TEXT,
  flag TEXT,
  points INTEGER,
  difficulty TEXT,
  options JSONB,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.title, c.description, c.type, c.country, c.flag, c.points, c.difficulty, c.options, c.created_at
  FROM public.challenges c
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$;