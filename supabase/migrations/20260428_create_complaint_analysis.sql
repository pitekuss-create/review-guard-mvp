-- Create complaint_analysis table
CREATE TABLE IF NOT EXISTS public.complaint_analysis (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    original_text text NOT NULL,
    extracted_keywords text[] NOT NULL DEFAULT '{}',
    sentiment_score smallint NOT NULL CHECK (sentiment_score >= 1 AND sentiment_score <= 10),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT complaint_analysis_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.complaint_analysis ENABLE ROW LEVEL SECURITY;

-- Select Policy: Only the store owner can view their complaint analysis
CREATE POLICY "Store owners can view their own complaint analysis"
    ON public.complaint_analysis
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = complaint_analysis.store_id
            AND stores.user_id = auth.uid()
        )
    );

-- Insert Policy is omitted because inserts will be performed server-side 
-- via the service_role key which bypasses RLS. 
