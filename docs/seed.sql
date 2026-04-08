-- Database Seed File for Gia Pha OS
-- This file populates the database with sample data for testing purposes.
-- WARNING: This will TRUNCATE existing functional data if run on an active DB.

-- 1. TRUNCATE exiting tables to ensure clean slate
TRUNCATE TABLE relationships CASCADE;
TRUNCATE TABLE person_details_private CASCADE;
TRUNCATE TABLE persons CASCADE;

-- 2. INSERT PERSONS (4 Generations of sample data)
INSERT INTO persons (id, full_name, gender, birth_year, is_deceased, death_year, is_in_law, note) VALUES
-- Generation 1 (Cố / First Generation)
('11111111-1111-1111-1111-111111111111', 'Trần Văn Cố', 'male', 1905, TRUE, 1980, FALSE, 'Ông cố tổ dòng họ (Đời 1)'),
('22222222-2222-2222-2222-222222222222', 'Nguyễn Thị Cố', 'female', 1910, TRUE, 1985, TRUE, 'Bà cố'),

-- Generation 2 (Ông/Bà / Second Generation)
('33333333-3333-3333-3333-333333333333', 'Trần Văn Ông Trưởng', 'male', 1935, TRUE, 2010, FALSE, 'Con trai trưởng (Đời 2)'),
('44444444-4444-4444-4444-444444444444', 'Lê Thị Bà Trưởng', 'female', 1938, TRUE, 2015, TRUE, 'Con dâu trưởng'),

('33333333-1111-1111-1111-111111111111', 'Trần Văn Ông Hai', 'male', 1937, TRUE, 2018, FALSE, 'Con trai thứ (Đời 2)'),
('44444444-1111-1111-1111-111111111111', 'Phạm Thị Bà Hai', 'female', 1940, FALSE, NULL, TRUE, 'Con dâu thứ'),

('55555555-5555-5555-5555-555555555555', 'Trần Thị Cô Út', 'female', 1945, FALSE, NULL, FALSE, 'Con gái út'),
('66666666-6666-6666-6666-666666666666', 'Vũ Văn Dượng Út', 'male', 1942, FALSE, NULL, TRUE, 'Con rể (Dượng út)'),

-- Generation 3 (Cha/Mẹ / Third Generation - Children of Trưởng)
('77777777-7777-7777-7777-777777777777', 'Trần Văn Cha', 'male', 1965, FALSE, NULL, FALSE, 'Cháu nội đích tôn, cha hiện tại (Đời 3)'),
('88888888-8888-8888-8888-888888888888', 'Hoàng Thị Mẹ', 'female', 1968, FALSE, NULL, TRUE, 'Mẹ hiện tại'),

('77777777-1111-1111-1111-111111111111', 'Trần Thị O', 'female', 1968, FALSE, NULL, FALSE, 'Cô (Chị em với Cha)'),
('88888888-1111-1111-1111-111111111111', 'Lý Văn Dượng', 'male', 1965, FALSE, NULL, TRUE, 'Chồng của Cô'),

-- Generation 3 (Children of Hai)
('77777777-2222-2222-2222-222222222222', 'Trần Văn Chú', 'male', 1970, FALSE, NULL, FALSE, 'Em họ của Cha'),
('88888888-2222-2222-2222-222222222222', 'Đỗ Thị Thím', 'female', 1972, FALSE, NULL, TRUE, 'Vợ của Chú'),

-- Generation 3 (Children of Út)
('99999999-9999-9999-9999-999999999999', 'Vũ Thị Em Họ', 'female', 1975, FALSE, NULL, FALSE, 'Cách một đời mang họ Vũ'),
('99999999-1111-1111-1111-111111111111', 'Vũ Văn Em Họ', 'male', 1978, FALSE, NULL, FALSE, 'Cách một đời mang họ Vũ'),

-- Generation 4 (Đời 4 - Con Cháu / Fourth Generation)
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Trần Văn Con Trai', 'male', 1995, FALSE, NULL, FALSE, 'Chắt đích tôn (Đời 4) - Admin'),
('aaaaaaaa-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Đinh Thị Con Dâu', 'female', 1995, FALSE, NULL, TRUE, 'Con dâu mới'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Trần Thị Con Gái', 'female', 1998, FALSE, NULL, FALSE, 'Em gái của Admin'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Trần Văn Em Út', 'male', 2005, FALSE, NULL, FALSE, 'Em trai út đang đi học'),

('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Lý Văn Cháu Trai', 'male', 1990, FALSE, NULL, FALSE, 'Con trai của Cô'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Trần Văn Cháu Họ', 'male', 2000, FALSE, NULL, FALSE, 'Con trai của Chú');

-- 3. INSERT PERSON_DETAILS_PRIVATE (Admin contact data)
-- Let's put some random details for the alive ones
INSERT INTO person_details_private (person_id, phone_number, occupation, current_residence) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '0901234567', 'Chuyên gia IT', 'Hà Nội'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '0987654321', 'Nhà thiết kế', 'Hà Nội'),
('77777777-7777-7777-7777-777777777777', '0911222333', 'Về hưu', 'Quê Quán');

-- 4. INSERT RELATIONSHIPS
-- Relationships link persons together. 
-- For biological_child, person_a is the Parent, person_b is the Child
-- For marriage, person_a and person_b are Spouses
INSERT INTO relationships (type, person_a, person_b) VALUES
-- Gen 1 Marriages
('marriage', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'),

-- Gen 2 Children of (Gen 1)
('biological_child', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333'), -- Trưởng
('biological_child', '11111111-1111-1111-1111-111111111111', '33333333-1111-1111-1111-111111111111'), -- Hai
('biological_child', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555'), -- Út

('biological_child', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333'), -- Trưởng
('biological_child', '22222222-2222-2222-2222-222222222222', '33333333-1111-1111-1111-111111111111'), -- Hai
('biological_child', '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555'), -- Út

-- Gen 2 Marriages
('marriage', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444'), -- Trưởng vợ
('marriage', '33333333-1111-1111-1111-111111111111', '44444444-1111-1111-1111-111111111111'), -- Hai vợ
('marriage', '66666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555'), -- Út chồng

-- Gen 3 Children of Trưởng
('biological_child', '33333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777'), -- Cha
('biological_child', '44444444-4444-4444-4444-444444444444', '77777777-7777-7777-7777-777777777777'), -- Cha
('biological_child', '33333333-3333-3333-3333-333333333333', '77777777-1111-1111-1111-111111111111'), -- Cô
('biological_child', '44444444-4444-4444-4444-444444444444', '77777777-1111-1111-1111-111111111111'), -- Cô

-- Gen 3 Children of Hai
('biological_child', '33333333-1111-1111-1111-111111111111', '77777777-2222-2222-2222-222222222222'), -- Chú
('biological_child', '44444444-1111-1111-1111-111111111111', '77777777-2222-2222-2222-222222222222'), -- Chú

-- Gen 3 Children of Út
('biological_child', '55555555-5555-5555-5555-555555555555', '99999999-9999-9999-9999-999999999999'),
('biological_child', '66666666-6666-6666-6666-666666666666', '99999999-9999-9999-9999-999999999999'),
('biological_child', '55555555-5555-5555-5555-555555555555', '99999999-1111-1111-1111-111111111111'),
('biological_child', '66666666-6666-6666-6666-666666666666', '99999999-1111-1111-1111-111111111111'),

-- Gen 3 Marriages
('marriage', '77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888'), -- Cha x Mẹ
('marriage', '88888888-1111-1111-1111-111111111111', '77777777-1111-1111-1111-111111111111'), -- Dượng x Cô
('marriage', '77777777-2222-2222-2222-222222222222', '88888888-2222-2222-2222-222222222222'), -- Chú x Thím

-- Gen 4 Children of Cha x Mẹ
('biological_child', '77777777-7777-7777-7777-777777777777', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), -- Trai 1
('biological_child', '88888888-8888-8888-8888-888888888888', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('biological_child', '77777777-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), -- Gái 1
('biological_child', '88888888-8888-8888-8888-888888888888', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('biological_child', '77777777-7777-7777-7777-777777777777', 'cccccccc-cccc-cccc-cccc-cccccccccccc'), -- Út trai
('biological_child', '88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),

-- Gen 4 Marriage Trai 1 x Dâu
('marriage', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),

-- Gen 4 Children of Cô
('biological_child', '88888888-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
('biological_child', '77777777-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),

-- Gen 4 Children of Chú
('biological_child', '77777777-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
('biological_child', '88888888-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');

-- Done planting seeds.
