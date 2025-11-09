-- Update Report Threshold Migration
-- Changes the auto-removal threshold from 5 reports to 2 reports
-- Run this in your Supabase SQL Editor

-- Update the function to check for 2+ reports instead of 5+
CREATE OR REPLACE FUNCTION check_and_remove_reported_items()
RETURNS TRIGGER AS $$
DECLARE
  report_count INTEGER;
BEGIN
  -- Count reports for this item with the same reason
  SELECT COUNT(*) INTO report_count
  FROM item_reports
  WHERE item_id = NEW.item_id
    AND reason = NEW.reason;
  
  -- If 2 or more reports for the same reason, mark item as unavailable
  IF report_count >= 2 THEN
    UPDATE items
    SET available = FALSE
    WHERE id = NEW.item_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- The trigger should already exist, but if not, create it
DROP TRIGGER IF EXISTS auto_remove_reported_items ON item_reports;
CREATE TRIGGER auto_remove_reported_items
  AFTER INSERT ON item_reports
  FOR EACH ROW
  EXECUTE FUNCTION check_and_remove_reported_items();

