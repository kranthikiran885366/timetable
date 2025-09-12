-- Create branches table
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  head_of_department UUID REFERENCES public.profiles(id),
  established_year INTEGER,
  total_semesters INTEGER DEFAULT 8,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on branches
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Create policies for branches
CREATE POLICY "Everyone can view branches" ON public.branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage branches" ON public.branches FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create sections table
CREATE TABLE IF NOT EXISTS public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 4),
  semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
  academic_year TEXT NOT NULL,
  max_students INTEGER DEFAULT 60,
  class_teacher_id UUID REFERENCES public.faculty(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(branch_id, year, semester, name, academic_year)
);

-- Enable RLS on sections
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

-- Create policies for sections
CREATE POLICY "Everyone can view sections" ON public.sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage sections" ON public.sections FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create courses table (linking subjects to sections)
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
  semester TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  course_type TEXT NOT NULL CHECK (course_type IN ('theory', 'lab', 'tutorial', 'project')) DEFAULT 'theory',
  hours_per_week INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subject_id, section_id, semester, academic_year)
);

-- Enable RLS on courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Create policies for courses
CREATE POLICY "Everyone can view courses" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Update subjects table to include branch reference
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS subject_type TEXT CHECK (subject_type IN ('theory', 'lab', 'tutorial', 'project')) DEFAULT 'theory';

-- Update faculty table to include branch reference
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);

-- Insert default branches
INSERT INTO public.branches (name, code, description, total_semesters) VALUES
('Computer Science Engineering', 'CSE', 'Computer Science and Engineering Department', 8),
('Electronics and Communication Engineering', 'ECE', 'Electronics and Communication Engineering Department', 8),
('Mechanical Engineering', 'MECH', 'Mechanical Engineering Department', 8),
('Civil Engineering', 'CIVIL', 'Civil Engineering Department', 8),
('Information Technology', 'IT', 'Information Technology Department', 8),
('Electrical Engineering', 'EEE', 'Electrical and Electronics Engineering Department', 8)
ON CONFLICT (code) DO NOTHING;
