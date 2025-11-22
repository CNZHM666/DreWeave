-- RLS Policies for check_ins table
CREATE POLICY "Users can view their own check-ins" ON check_ins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own check-ins" ON check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own check-ins" ON check_ins
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own check-ins" ON check_ins
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for test_results table
CREATE POLICY "Users can view their own test results" ON test_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own test results" ON test_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for coins table
CREATE POLICY "Users can view their own coins" ON coins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own coins" ON coins
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for rewards table (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view rewards" ON rewards
  FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for achievements table (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view achievements" ON achievements
  FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for user_achievements table
CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements" ON user_achievements
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON check_ins TO anon, authenticated;
GRANT INSERT ON check_ins TO anon, authenticated;
GRANT UPDATE ON check_ins TO anon, authenticated;
GRANT DELETE ON check_ins TO anon, authenticated;

GRANT SELECT ON test_results TO anon, authenticated;
GRANT INSERT ON test_results TO anon, authenticated;

GRANT SELECT ON coins TO anon, authenticated;
GRANT UPDATE ON coins TO anon, authenticated;

GRANT SELECT ON rewards TO anon, authenticated;

GRANT SELECT ON achievements TO anon, authenticated;

GRANT SELECT ON user_achievements TO anon, authenticated;
GRANT INSERT ON user_achievements TO anon, authenticated;
GRANT UPDATE ON user_achievements TO anon, authenticated;