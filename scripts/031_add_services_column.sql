-- Add services column to dog_beaches table
ALTER TABLE dog_beaches ADD COLUMN IF NOT EXISTS services text;
