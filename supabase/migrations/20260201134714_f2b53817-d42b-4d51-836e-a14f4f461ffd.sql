-- Create a table to store the app data (categories with subcategories and topics)
CREATE TABLE public.app_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '[]'::jsonb,
  version TEXT NOT NULL DEFAULT '1.0.0',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.app_data ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (everyone can view the data)
CREATE POLICY "Anyone can read app data" 
ON public.app_data 
FOR SELECT 
USING (true);

-- Create policy for public insert (for initial data creation)
CREATE POLICY "Anyone can insert app data" 
ON public.app_data 
FOR INSERT 
WITH CHECK (true);

-- Create policy for public update (admin logic handled in app)
CREATE POLICY "Anyone can update app data" 
ON public.app_data 
FOR UPDATE 
USING (true);

-- Insert initial row so there's always one record to update
INSERT INTO public.app_data (data, version) VALUES ('[]'::jsonb, '1.0.0');