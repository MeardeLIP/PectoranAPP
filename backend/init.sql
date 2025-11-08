-- Инициализация базы данных PectoranAPP
-- Создание начальных данных для системы

-- Создание ролей пользователей
INSERT INTO users (username, password_hash, role, full_name, is_active, created_at, updated_at) VALUES
('admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2W', 'admin', 'Администратор системы', true, NOW(), NOW()),
('director', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2W', 'director', 'Директор ресторана', true, NOW(), NOW());

-- Создание официантов
INSERT INTO users (username, role, waiter_number, full_name, is_active, created_at, updated_at) VALUES
('waiter1', 'waiter', 1, 'Официант 1', true, NOW(), NOW()),
('waiter2', 'waiter', 2, 'Официант 2', true, NOW(), NOW()),
('waiter3', 'waiter', 3, 'Официант 3', true, NOW(), NOW()),
('waiter4', 'waiter', 4, 'Официант 4', true, NOW(), NOW());

-- Создание поваров
INSERT INTO users (username, role, waiter_number, full_name, is_active, created_at, updated_at) VALUES
('cook1', 'cook', 101, 'Повар 1', true, NOW(), NOW()),
('cook2', 'cook', 102, 'Повар 2', true, NOW(), NOW());

-- Создание категорий меню
INSERT INTO menu_categories (name, description, sort_order, icon, color, is_active, created_at, updated_at) VALUES
('Напитки', 'Горячие и холодные напитки', 1, 'coffee', '#4CAF50', true, NOW(), NOW()),
('Закуски', 'Холодные и горячие закуски', 2, 'restaurant', '#FF9800', true, NOW(), NOW()),
('Основные блюда', 'Мясные и рыбные блюда', 3, 'dinner_dining', '#F44336', true, NOW(), NOW()),
('Десерты', 'Сладкие блюда и выпечка', 4, 'cake', '#E91E63', true, NOW(), NOW()),
('Салаты', 'Овощные и мясные салаты', 5, 'eco', '#8BC34A', true, NOW(), NOW());

-- Создание позиций меню
INSERT INTO menu_items (name, description, price, category_id, preparation_time, is_available, is_active, sort_order, created_at, updated_at) VALUES
-- Напитки
('Кофе американо', 'Классический черный кофе', 150.00, 1, 3, true, true, 1, NOW(), NOW()),
('Капучино', 'Кофе с молочной пенкой', 180.00, 1, 4, true, true, 2, NOW(), NOW()),
('Чай черный', 'Классический черный чай', 120.00, 1, 2, true, true, 3, NOW(), NOW()),
('Сок апельсиновый', 'Свежевыжатый апельсиновый сок', 200.00, 1, 1, true, true, 4, NOW(), NOW()),
('Кока-кола', 'Газированный напиток 0.5л', 100.00, 1, 1, true, true, 5, NOW(), NOW()),

-- Закуски
('Брускетта с томатами', 'Хлеб с помидорами и базиликом', 250.00, 2, 5, true, true, 1, NOW(), NOW()),
('Сырная тарелка', 'Ассорти из сыров с орехами', 450.00, 2, 3, true, true, 2, NOW(), NOW()),
('Карпаччо из говядины', 'Тонко нарезанная говядина', 380.00, 2, 4, true, true, 3, NOW(), NOW()),

-- Основные блюда
('Стейк из говядины', 'Стейк средней прожарки с гарниром', 1200.00, 3, 15, true, true, 1, NOW(), NOW()),
('Лосось на гриле', 'Филе лосося с овощами', 950.00, 3, 12, true, true, 2, NOW(), NOW()),
('Паста карбонара', 'Спагетти с беконом и сливочным соусом', 650.00, 3, 10, true, true, 3, NOW(), NOW()),
('Ризотто с грибами', 'Кремовое ризотто с лесными грибами', 580.00, 3, 12, true, true, 4, NOW(), NOW()),

-- Десерты
('Тирамису', 'Классический итальянский десерт', 320.00, 4, 5, true, true, 1, NOW(), NOW()),
('Чизкейк', 'Десерт из творожного сыра', 280.00, 4, 3, true, true, 2, NOW(), NOW()),
('Мороженое', 'Ассорти из 3 шариков', 180.00, 4, 1, true, true, 3, NOW(), NOW()),

-- Салаты
('Цезарь с курицей', 'Классический салат Цезарь', 350.00, 5, 8, true, true, 1, NOW(), NOW()),
('Греческий салат', 'Свежие овощи с фетой', 280.00, 5, 5, true, true, 2, NOW(), NOW()),
('Салат с креветками', 'Свежий салат с тигровыми креветками', 420.00, 5, 7, true, true, 3, NOW(), NOW());

-- Обновляем пароли для админов (пароль: admin123)
UPDATE users SET password_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2W' WHERE username IN ('admin', 'director');
