-- Insert default rewards for DREWEAVE
INSERT INTO rewards (name, description, cost, category, icon_url) VALUES
  ('冥想音乐包', '精选冥想音乐，帮助放松身心', 50, '音乐', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=meditation%20music%20icon%20calm%20peaceful%20blue%20green&image_size=square'),
  ('励志壁纸包', '精选励志壁纸，每天激励自己', 30, '壁纸', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=motivational%20wallpaper%20icon%20inspiring%20sunrise%20mountain&image_size=square'),
  ('呼吸练习指导', '专业呼吸练习音频指导', 40, '练习', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=breathing%20exercise%20icon%20relaxation%20calm%20circle&image_size=square'),
  ('正念练习工具', '正念冥想练习工具包', 60, '工具', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=mindfulness%20tool%20icon%20zen%20balance%20harmony&image_size=square'),
  ('专业心理咨询', '一次专业心理咨询服务', 200, '服务', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=psychology%20consultation%20icon%20professional%20support%20care&image_size=square');