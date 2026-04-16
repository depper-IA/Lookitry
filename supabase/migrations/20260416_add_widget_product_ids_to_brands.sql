-- Add widget_product_ids column to brands table
-- This column stores the ordered list of product IDs for the brand's widget

ALTER TABLE brands ADD COLUMN widget_product_ids uuid[] DEFAULT '{}';

-- Index for faster lookups
CREATE INDEX idx_brands_widget_product_ids ON brands(id) INCLUDE (widget_product_ids);

-- Comment for documentation
COMMENT ON COLUMN brands.widget_product_ids IS 'Ordered array of product IDs for the brand widget collection';