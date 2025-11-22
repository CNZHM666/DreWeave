-- Add helpful indexes for performance on check_ins
create index if not exists idx_check_ins_user_created_at on check_ins (user_id, created_at desc);
create index if not exists idx_check_ins_user_date on check_ins (user_id, date);