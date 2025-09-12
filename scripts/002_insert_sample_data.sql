-- Insert sample time slots
INSERT INTO public.time_slots (day_of_week, start_time, end_time) VALUES
(1, '09:00', '10:30'), -- Monday 9:00-10:30
(1, '10:45', '12:15'), -- Monday 10:45-12:15
(1, '13:15', '14:45'), -- Monday 13:15-14:45
(1, '15:00', '16:30'), -- Monday 15:00-16:30
(2, '09:00', '10:30'), -- Tuesday 9:00-10:30
(2, '10:45', '12:15'), -- Tuesday 10:45-12:15
(2, '13:15', '14:45'), -- Tuesday 13:15-14:45
(2, '15:00', '16:30'), -- Tuesday 15:00-16:30
(3, '09:00', '10:30'), -- Wednesday 9:00-10:30
(3, '10:45', '12:15'), -- Wednesday 10:45-12:15
(3, '13:15', '14:45'), -- Wednesday 13:15-14:45
(3, '15:00', '16:30'), -- Wednesday 15:00-16:30
(4, '09:00', '10:30'), -- Thursday 9:00-10:30
(4, '10:45', '12:15'), -- Thursday 10:45-12:15
(4, '13:15', '14:45'), -- Thursday 13:15-14:45
(4, '15:00', '16:30'), -- Thursday 15:00-16:30
(5, '09:00', '10:30'), -- Friday 9:00-10:30
(5, '10:45', '12:15'), -- Friday 10:45-12:15
(5, '13:15', '14:45'), -- Friday 13:15-14:45
(5, '15:00', '16:30'); -- Friday 15:00-16:30

-- Insert sample rooms
INSERT INTO public.rooms (name, capacity, type, equipment) VALUES
('Room A101', 50, 'classroom', ARRAY['projector', 'whiteboard']),
('Room A102', 45, 'classroom', ARRAY['projector', 'whiteboard']),
('Lab B201', 30, 'lab', ARRAY['computers', 'projector']),
('Lab B202', 25, 'lab', ARRAY['computers', 'projector']),
('Auditorium C301', 200, 'auditorium', ARRAY['projector', 'sound_system']),
('Seminar D401', 20, 'seminar', ARRAY['projector', 'whiteboard']);

-- Insert sample subjects
INSERT INTO public.subjects (name, code, department, credits) VALUES
('Introduction to Computer Science', 'CS101', 'Computer Science', 3),
('Data Structures', 'CS201', 'Computer Science', 4),
('Database Systems', 'CS301', 'Computer Science', 3),
('Web Development', 'CS302', 'Computer Science', 3),
('Calculus I', 'MATH101', 'Mathematics', 4),
('Linear Algebra', 'MATH201', 'Mathematics', 3),
('Physics I', 'PHY101', 'Physics', 4),
('Chemistry I', 'CHEM101', 'Chemistry', 4);
