-- Sample Data for YWMDSBS School Management System (Minimal Version)
-- This script creates realistic test data using only basic columns that likely exist

-- 1. Clear existing data (optional - uncomment if you want to start fresh)
-- DELETE FROM grades;
-- DELETE FROM assessments;
-- DELETE FROM enrollments;
-- DELETE FROM class_subject_assignments;
-- DELETE FROM class_teachers;
-- DELETE FROM assessment_types;
-- DELETE FROM semesters;
-- DELETE FROM subjects;
-- DELETE FROM classes;
-- DELETE FROM students;
-- DELETE FROM teachers;

-- 2. Insert Teachers (minimal columns)
INSERT INTO teachers (id, user_id, first_name, last_name, created_at) VALUES
('tchr-001', 'teacher-001', 'John', 'Smith', NOW()),
('tchr-002', 'teacher-002', 'Sarah', 'Johnson', NOW()),
('tchr-003', 'teacher-003', 'Michael', 'Brown', NOW()),
('tchr-004', 'teacher-004', 'Emily', 'Davis', NOW()),
('tchr-005', 'teacher-005', 'David', 'Wilson', NOW());

-- 3. Insert Students (minimal columns)
INSERT INTO students (id, user_id, first_name, last_name, grade_level, created_at) VALUES
('std-001', 'student-001', 'Alice', 'Martinez', 9, NOW()),
('std-002', 'student-002', 'Bob', 'Anderson', 9, NOW()),
('std-003', 'student-003', 'Carol', 'Thomas', 9, NOW()),
('std-004', 'student-004', 'David', 'Jackson', 9, NOW()),
('std-005', 'student-005', 'Emma', 'White', 9, NOW()),
('std-006', 'student-006', 'Frank', 'Harris', 10, NOW()),
('std-007', 'student-007', 'Grace', 'Martin', 10, NOW()),
('std-008', 'student-008', 'Henry', 'Thompson', 10, NOW()),
('std-009', 'student-009', 'Isabella', 'Garcia', 10, NOW()),
('std-010', 'student-010', 'Jack', 'Martinez', 10, NOW()),
('std-011', 'student-011', 'Kate', 'Robinson', 11, NOW()),
('std-012', 'student-012', 'Liam', 'Clark', 11, NOW()),
('std-013', 'student-013', 'Mia', 'Rodriguez', 11, NOW()),
('std-014', 'student-014', 'Noah', 'Lewis', 11, NOW()),
('std-015', 'student-015', 'Olivia', 'Lee', 11, NOW());

-- 4. Insert Subjects
INSERT INTO subjects (id, name, code, description, created_at) VALUES
('sub-001', 'Mathematics', 'MATH', 'Mathematics including algebra, geometry, and calculus', NOW()),
('sub-002', 'English', 'ENG', 'English language and literature', NOW()),
('sub-003', 'Physics', 'PHY', 'Physics and physical sciences', NOW()),
('sub-004', 'Chemistry', 'CHEM', 'Chemistry and chemical sciences', NOW()),
('sub-005', 'Biology', 'BIO', 'Biology and life sciences', NOW()),
('sub-006', 'History', 'HIST', 'World and national history', NOW()),
('sub-007', 'Geography', 'GEOG', 'Physical and human geography', NOW()),
('sub-008', 'Computer Science', 'CS', 'Computer science and programming', NOW());

-- 5. Insert Classes
INSERT INTO classes (id, name, grade_level, created_at) VALUES
('cls-001', 'Grade 9A', 9, NOW()),
('cls-002', 'Grade 9B', 9, NOW()),
('cls-003', 'Grade 10A', 10, NOW()),
('cls-004', 'Grade 10B', 10, NOW()),
('cls-005', 'Grade 11A', 11, NOW()),
('cls-006', 'Grade 11B', 11, NOW());

-- 6. Insert Semesters
INSERT INTO semesters (id, name, academic_year, start_date, end_date, is_current, created_at) VALUES
('sem-001', 'Fall 2024', '2024-2025', '2024-09-01', '2025-01-15', false, NOW()),
('sem-002', 'Spring 2025', '2024-2025', '2025-01-16', '2025-06-15', true, NOW()),
('sem-003', 'Summer 2025', '2024-2025', '2025-06-16', '2025-08-31', false, NOW());

-- 7. Insert Assessment Types
INSERT INTO assessment_types (id, name, description, weight_default, created_at) VALUES
('at-001', 'Quiz', 'Short assessment on specific topics', 10, NOW()),
('at-002', 'Homework', 'Regular homework assignments', 5, NOW()),
('at-003', 'Midterm Exam', 'Mid-semester comprehensive assessment', 25, NOW()),
('at-004', 'Final Exam', 'End-of-semester comprehensive assessment', 35, NOW()),
('at-005', 'Project', 'Long-term project or presentation', 15, NOW()),
('at-006', 'Lab Work', 'Laboratory or practical work', 10, NOW());

-- 8. Insert Class-Teacher Assignments
INSERT INTO class_teachers (id, class_id, teacher_id, role, created_at) VALUES
-- Class 9A
('cta-001', 'cls-001', 'tchr-001', 'class_teacher', NOW()),
('cta-002', 'cls-001', 'tchr-001', 'subject_teacher', NOW()),
('cta-003', 'cls-001', 'tchr-002', 'subject_teacher', NOW()),
('cta-004', 'cls-001', 'tchr-003', 'subject_teacher', NOW()),
-- Class 9B
('cta-005', 'cls-002', 'tchr-002', 'class_teacher', NOW()),
('cta-006', 'cls-002', 'tchr-002', 'subject_teacher', NOW()),
('cta-007', 'cls-002', 'tchr-004', 'subject_teacher', NOW()),
-- Class 10A
('cta-008', 'cls-003', 'tchr-003', 'class_teacher', NOW()),
('cta-009', 'cls-003', 'tchr-003', 'subject_teacher', NOW()),
('cta-010', 'cls-003', 'tchr-005', 'subject_teacher', NOW()),
('cta-011', 'cls-003', 'tchr-001', 'subject_teacher', NOW()),
-- Class 10B
('cta-012', 'cls-004', 'tchr-004', 'class_teacher', NOW()),
('cta-013', 'cls-004', 'tchr-004', 'subject_teacher', NOW()),
('cta-014', 'cls-004', 'tchr-002', 'subject_teacher', NOW()),
-- Class 11A
('cta-015', 'cls-005', 'tchr-005', 'class_teacher', NOW()),
('cta-016', 'cls-005', 'tchr-005', 'subject_teacher', NOW()),
('cta-017', 'cls-005', 'tchr-003', 'subject_teacher', NOW()),
-- Class 11B
('cta-018', 'cls-006', 'tchr-001', 'class_teacher', NOW()),
('cta-019', 'cls-006', 'tchr-001', 'subject_teacher', NOW()),
('cta-020', 'cls-006', 'tchr-004', 'subject_teacher', NOW());

-- 9. Insert Class-Subject Assignments
INSERT INTO class_subject_assignments (id, class_id, subject_id, teacher_id, created_at) VALUES
-- Class 9A
('csa-001', 'cls-001', 'sub-001', 'tchr-001', NOW()), -- Mathematics
('csa-002', 'cls-001', 'sub-002', 'tchr-002', NOW()), -- English
('csa-003', 'cls-001', 'sub-003', 'tchr-003', NOW()), -- Physics
-- Class 9B
('csa-004', 'cls-002', 'sub-001', 'tchr-002', NOW()), -- Mathematics
('csa-005', 'cls-002', 'sub-004', 'tchr-004', NOW()), -- Chemistry
-- Class 10A
('csa-006', 'cls-003', 'sub-003', 'tchr-003', NOW()), -- Physics
('csa-007', 'cls-003', 'sub-005', 'tchr-005', NOW()), -- Biology
('csa-008', 'cls-003', 'sub-001', 'tchr-001', NOW()), -- Mathematics
-- Class 10B
('csa-009', 'cls-004', 'sub-002', 'tchr-004', NOW()), -- English
('csa-010', 'cls-004', 'sub-001', 'tchr-002', NOW()), -- Mathematics
-- Class 11A
('csa-011', 'cls-005', 'sub-003', 'tchr-005', NOW()), -- Physics
('csa-012', 'cls-005', 'sub-008', 'tchr-003', NOW()), -- Computer Science
-- Class 11B
('csa-013', 'cls-006', 'sub-001', 'tchr-001', NOW()), -- Mathematics
('csa-014', 'cls-006', 'sub-006', 'tchr-004', NOW()); -- History

-- 10. Insert Student Enrollments
INSERT INTO enrollments (id, student_id, class_id, enrollment_date, is_active, created_at) VALUES
-- Grade 9A (5 students)
('enr-001', 'std-001', 'cls-001', '2024-09-01', true, NOW()),
('enr-002', 'std-002', 'cls-001', '2024-09-01', true, NOW()),
('enr-003', 'std-003', 'cls-001', '2024-09-01', true, NOW()),
('enr-004', 'std-004', 'cls-001', '2024-09-01', true, NOW()),
('enr-005', 'std-005', 'cls-001', '2024-09-01', true, NOW()),
-- Grade 9B (0 students - for testing empty class)
-- Grade 10A (5 students)
('enr-006', 'std-006', 'cls-003', '2024-09-01', true, NOW()),
('enr-007', 'std-007', 'cls-003', '2024-09-01', true, NOW()),
('enr-008', 'std-008', 'cls-003', '2024-09-01', true, NOW()),
('enr-009', 'std-009', 'cls-003', '2024-09-01', true, NOW()),
('enr-010', 'std-010', 'cls-003', '2024-09-01', true, NOW()),
-- Grade 10B (0 students - for testing empty class)
-- Grade 11A (5 students)
('enr-011', 'std-011', 'cls-005', '2024-09-01', true, NOW()),
('enr-012', 'std-012', 'cls-005', '2024-09-01', true, NOW()),
('enr-013', 'std-013', 'cls-005', '2024-09-01', true, NOW()),
('enr-014', 'std-014', 'cls-005', '2024-09-01', true, NOW()),
('enr-015', 'std-015', 'cls-005', '2024-09-01', true, NOW());
-- Grade 11B (0 students - for testing empty class)

-- 11. Insert Sample Assessments
INSERT INTO assessments (id, title, assessment_type_id, class_subject_assignment_id, max_score, weight, assessment_date, created_by_teacher_id, semester_id, is_published, created_at) VALUES
-- Mathematics assessments for Grade 9A
('ass-001', 'Algebra Quiz 1', 'at-001', 'csa-001', 50, 10, '2025-02-01', 'tchr-001', 'sem-002', true, NOW()),
('ass-002', 'Geometry Midterm', 'at-003', 'csa-001', 100, 25, '2025-03-15', 'tchr-001', 'sem-002', true, NOW()),
('ass-003', 'Calculus Final', 'at-004', 'csa-001', 150, 35, '2025-06-01', 'tchr-001', 'sem-002', false, NOW()),
-- English assessments for Grade 9A
('ass-004', 'Essay Writing', 'at-005', 'csa-002', 80, 15, '2025-02-15', 'tchr-002', 'sem-002', true, NOW()),
('ass-005', 'Literature Test', 'at-001', 'csa-002', 60, 10, '2025-04-01', 'tchr-002', 'sem-002', true, NOW()),
-- Physics assessments for Grade 9A
('ass-006', 'Mechanics Lab', 'at-006', 'csa-003', 40, 10, '2025-02-20', 'tchr-003', 'sem-002', true, NOW()),
('ass-007', 'Waves and Optics', 'at-003', 'csa-003', 100, 25, '2025-04-10', 'tchr-003', 'sem-002', false, NOW()),
-- Mathematics assessments for Grade 10A
('ass-008', 'Trigonometry Quiz', 'at-001', 'csa-008', 40, 10, '2025-02-05', 'tchr-001', 'sem-002', true, NOW()),
('ass-009', 'Statistics Project', 'at-005', 'csa-008', 100, 15, '2025-03-20', 'tchr-001', 'sem-002', true, NOW()),
('ass-010', 'Advanced Algebra Final', 'at-004', 'csa-008', 120, 35, '2025-06-05', 'tchr-001', 'sem-002', false, NOW()),
-- Biology assessments for Grade 10A
('ass-011', 'Cell Biology Homework', 'at-002', 'csa-007', 30, 5, '2025-02-10', 'tchr-005', 'sem-002', true, NOW()),
('ass-012', 'Genetics Midterm', 'at-003', 'csa-007', 90, 25, '2025-04-05', 'tchr-005', 'sem-002', true, NOW()),
-- Physics assessments for Grade 11A
('ass-013', 'Quantum Physics Quiz', 'at-001', 'csa-011', 45, 10, '2025-02-12', 'tchr-005', 'sem-002', true, NOW()),
('ass-014', 'Computer Science Project', 'at-005', 'csa-012', 120, 15, '2025-03-25', 'tchr-003', 'sem-002', false, NOW());

-- 12. Insert Sample Grades
INSERT INTO grades (id, student_id, assessment_id, score, created_at) VALUES
-- Grades for Grade 9A Mathematics - Algebra Quiz 1
('grd-001', 'std-001', 'ass-001', 45, NOW()),
('grd-002', 'std-002', 'ass-001', 38, NOW()),
('grd-003', 'std-003', 'ass-001', 42, NOW()),
('grd-004', 'std-004', 'ass-001', 48, NOW()),
('grd-005', 'std-005', 'ass-001', 35, NOW()),
-- Grades for Grade 9A Mathematics - Geometry Midterm
('grd-006', 'std-001', 'ass-002', 85, NOW()),
('grd-007', 'std-002', 'ass-002', 72, NOW()),
('grd-008', 'std-003', 'ass-002', 78, NOW()),
('grd-009', 'std-004', 'ass-002', 92, NOW()),
('grd-010', 'std-005', 'ass-002', 68, NOW()),
-- Grades for Grade 9A English - Essay Writing
('grd-011', 'std-001', 'ass-004', 72, NOW()),
('grd-012', 'std-002', 'ass-004', 85, NOW()),
('grd-013', 'std-003', 'ass-004', 68, NOW()),
('grd-014', 'std-004', 'ass-004', 90, NOW()),
('grd-015', 'std-005', 'ass-004', 75, NOW()),
-- Grades for Grade 10A Mathematics - Trigonometry Quiz
('grd-016', 'std-006', 'ass-008', 35, NOW()),
('grd-017', 'std-007', 'ass-008', 38, NOW()),
('grd-018', 'std-008', 'ass-008', 40, NOW()),
('grd-019', 'std-009', 'ass-008', 32, NOW()),
('grd-020', 'std-010', 'ass-008', 36, NOW()),
-- Grades for Grade 10A Biology - Cell Biology Homework
('grd-021', 'std-006', 'ass-011', 28, NOW()),
('grd-022', 'std-007', 'ass-011', 25, NOW()),
('grd-023', 'std-008', 'ass-011', 30, NOW()),
('grd-024', 'std-009', 'ass-011', 27, NOW()),
('grd-025', 'std-010', 'ass-011', 29, NOW());

-- 13. Verification Queries (optional - uncomment to check data)
-- SELECT 'Teachers' as table_name, COUNT(*) as count FROM teachers
-- UNION ALL
-- SELECT 'Students', COUNT(*) FROM students
-- UNION ALL
-- SELECT 'Classes', COUNT(*) FROM classes
-- UNION ALL
-- SELECT 'Subjects', COUNT(*) FROM subjects
-- UNION ALL
-- SELECT 'Semesters', COUNT(*) FROM semesters
-- UNION ALL
-- SELECT 'Assessment Types', COUNT(*) FROM assessment_types
-- UNION ALL
-- SELECT 'Class-Teacher Assignments', COUNT(*) FROM class_teachers
-- UNION ALL
-- SELECT 'Class-Subject Assignments', COUNT(*) FROM class_subject_assignments
-- UNION ALL
-- SELECT 'Enrollments', COUNT(*) FROM enrollments
-- UNION ALL
-- SELECT 'Assessments', COUNT(*) FROM assessments
-- UNION ALL
-- SELECT 'Grades', COUNT(*) FROM grades;

-- Note: This version uses only the most basic columns that are likely to exist
-- If any column still doesn't exist, you can remove it from the INSERT statements
