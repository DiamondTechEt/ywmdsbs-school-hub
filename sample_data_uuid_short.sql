-- Sample Data for YWMDSBS School Management System (UUID Version - Short)
-- This script creates realistic test data using proper UUID format

-- 1. Insert Teachers (with UUIDs)
INSERT INTO teachers (id, user_id, first_name, last_name, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', 'John', 'Smith', NOW()),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440102', 'Sarah', 'Johnson', NOW()),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440103', 'Michael', 'Brown', NOW());

-- 2. Insert Students (with UUIDs)
INSERT INTO students (id, user_id, first_name, last_name, grade_level, created_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440101', 'Alice', 'Martinez', 9, NOW()),
('660e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440102', 'Bob', 'Anderson', 9, NOW()),
('660e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440103', 'Carol', 'Thomas', 9, NOW()),
('660e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440104', 'David', 'Jackson', 10, NOW()),
('660e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440105', 'Emma', 'White', 10, NOW());

-- 3. Insert Subjects (with UUIDs)
INSERT INTO subjects (id, name, code, description, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'Mathematics', 'MATH', 'Mathematics including algebra, geometry, and calculus', NOW()),
('770e8400-e29b-41d4-a716-446655440002', 'English', 'ENG', 'English language and literature', NOW()),
('770e8400-e29b-41d4-a716-446655440003', 'Physics', 'PHY', 'Physics and physical sciences', NOW());

-- 4. Insert Classes (with UUIDs)
INSERT INTO classes (id, name, grade_level, created_at) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'Grade 9A', 9, NOW()),
('880e8400-e29b-41d4-a716-446655440002', 'Grade 9B', 9, NOW()),
('880e8400-e29b-41d4-a716-446655440003', 'Grade 10A', 10, NOW());

-- 5. Insert Semesters (with UUIDs)
INSERT INTO semesters (id, name, academic_year, start_date, end_date, is_current, created_at) VALUES
('990e8400-e29b-41d4-a716-446655440001', 'Fall 2024', '2024-2025', '2024-09-01', '2025-01-15', false, NOW()),
('990e8400-e29b-41d4-a716-446655440002', 'Spring 2025', '2024-2025', '2025-01-16', '2025-06-15', true, NOW());

-- 6. Insert Assessment Types (with UUIDs)
INSERT INTO assessment_types (id, name, description, weight_default, created_at) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', 'Quiz', 'Short assessment on specific topics', 10, NOW()),
('aa0e8400-e29b-41d4-a716-446655440002', 'Homework', 'Regular homework assignments', 5, NOW()),
('aa0e8400-e29b-41d4-a716-446655440003', 'Midterm Exam', 'Mid-semester comprehensive assessment', 25, NOW()),
('aa0e8400-e29b-41d4-a716-446655440004', 'Final Exam', 'End-of-semester comprehensive assessment', 35, NOW());

-- 7. Insert Class-Subject Assignments (with UUIDs)
INSERT INTO class_subject_assignments (id, class_id, subject_id, teacher_id, created_at) VALUES
('cc0e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW()), -- Mathematics
('cc0e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', NOW()), -- English
('cc0e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', NOW()); -- Physics

-- 8. Insert Student Enrollments (with UUIDs)
INSERT INTO enrollments (id, student_id, class_id, enrollment_date, is_active, created_at) VALUES
('dd0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', '2024-09-01', true, NOW()),
('dd0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', '2024-09-01', true, NOW()),
('dd0e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440001', '2024-09-01', true, NOW()),
('dd0e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440003', '2024-09-01', true, NOW()),
('dd0e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', '880e8400-e29b-41d4-a716-446655440003', '2024-09-01', true, NOW());

-- 9. Insert Sample Assessments (with UUIDs)
INSERT INTO assessments (id, title, assessment_type_id, class_subject_assignment_id, max_score, weight, assessment_date, created_by_teacher_id, semester_id, is_published, created_at) VALUES
('ee0e8400-e29b-41d4-a716-446655440001', 'Algebra Quiz 1', 'aa0e8400-e29b-41d4-a716-446655440001', 'cc0e8400-e29b-41d4-a716-446655440001', 50, 10, '2025-02-01', '550e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440002', true, NOW()),
('ee0e8400-e29b-41d4-a716-446655440002', 'Geometry Midterm', 'aa0e8400-e29b-41d4-a716-446655440003', 'cc0e8400-e29b-41d4-a716-446655440001', 100, 25, '2025-03-15', '550e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440002', true, NOW()),
('ee0e8400-e29b-41d4-a716-446655440003', 'Essay Writing', 'aa0e8400-e29b-41d4-a716-446655440005', 'cc0e8400-e29b-41d4-a716-446655440002', 80, 15, '2025-02-15', '550e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', true, NOW()),
('ee0e8400-e29b-41d4-a716-446655440004', 'Physics Lab', 'aa0e8400-e29b-41d4-a716-446655440001', 'cc0e8400-e29b-41d4-a716-446655440003', 40, 10, '2025-02-20', '550e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440002', false, NOW());

-- 10. Insert Sample Grades (with UUIDs)
INSERT INTO grades (id, student_id, assessment_id, score, created_at) VALUES
('ff0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'ee0e8400-e29b-41d4-a716-446655440001', 45, NOW()),
('ff0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'ee0e8400-e29b-41d4-a716-446655440001', 38, NOW()),
('ff0e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'ee0e8400-e29b-41d4-a716-446655440001', 42, NOW()),
('ff0e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001', 'ee0e8400-e29b-41d4-a716-446655440002', 85, NOW()),
('ff0e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440002', 'ee0e8400-e29b-41d4-a716-446655440002', 72, NOW()),
('ff0e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440003', 'ee0e8400-e29b-41d4-a716-446655440003', 40, NOW()),
('ff0e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440004', 'ee0e8400-e29b-41d4-a716-446655440003', 35, NOW());
