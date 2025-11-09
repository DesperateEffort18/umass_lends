-- Update Report Threshold Migration
-- Sets the auto-deletion threshold to 5 reports
-- Items are completely deleted (not just marked unavailable)
-- Run this in your Supabase SQL Editor

-- Update the function to check for 5+ reports and delete items completely
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
  
  -- If 5 or more reports for the same reason, delete the item completely
  -- Note: This will cascade delete borrow_requests, messages, and item_reports
  -- due to foreign key constraints with ON DELETE CASCADE
  -- Note: Image deletion from storage must be handled in the API route
  IF report_count >= 5 THEN
    DELETE FROM items
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

