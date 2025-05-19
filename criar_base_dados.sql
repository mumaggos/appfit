# Script de Criação da Base de Dados - FitnessApp

Este script SQL cria a estrutura da base de dados para o FitnessApp quando utilizar MySQL como sistema de gestão de base de dados.

```sql
-- Criar a base de dados
CREATE DATABASE IF NOT EXISTS fitness_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fitness_db;

-- Tabela de utilizadores
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de perfis de utilizador
CREATE TABLE IF NOT EXISTS user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    name VARCHAR(255),
    age INT,
    gender ENUM('male', 'female', 'other'),
    height FLOAT, -- em cm
    weight FLOAT, -- em kg
    activity_level ENUM('sedentary', 'light', 'moderate', 'intense'),
    goal ENUM('lose', 'maintain', 'gain'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de planos de dieta
CREATE TABLE IF NOT EXISTS diet_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tdee INT NOT NULL, -- Gasto Calórico Diário Total
    daily_calories INT NOT NULL,
    protein_g INT NOT NULL,
    carbs_g INT NOT NULL,
    fat_g INT NOT NULL,
    plan_data JSON NOT NULL, -- Armazena o plano completo em formato JSON
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de planos de treino
CREATE TABLE IF NOT EXISTS workout_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    days_per_week INT NOT NULL,
    intensity VARCHAR(50) NOT NULL,
    plan_data JSON NOT NULL, -- Armazena o plano completo em formato JSON
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de preferências do utilizador
CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    liked_foods TEXT,
    disliked_foods TEXT,
    dietary_restrictions TEXT,
    preferred_exercises TEXT,
    avoided_exercises TEXT,
    additional_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de anúncios/publicidade
CREATE TABLE IF NOT EXISTS advertisements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(512),
    target_url VARCHAR(512),
    placement_area VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de categorias de produtos
CREATE TABLE IF NOT EXISTS product_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    sku VARCHAR(100),
    image_url VARCHAR(512),
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES product_categories(id)
);

-- Criar utilizador para a aplicação
CREATE USER IF NOT EXISTS 'fitness_user'@'%' IDENTIFIED BY 'senha_segura_da_bd';
GRANT ALL PRIVILEGES ON fitness_db.* TO 'fitness_user'@'%';
FLUSH PRIVILEGES;

-- Inserir um administrador inicial (senha: admin123)
INSERT INTO users (username, email, password_hash, is_admin) 
VALUES ('admin', 'admin@exemplo.com', '$2b$12$tPZUfXQMYqQFWT0SjsIXB.XMQD5HJWRIXd8V0.IHGKqbHNNGJW.Iy', TRUE);

-- Inserir algumas categorias de produtos iniciais
INSERT INTO product_categories (name, description, slug) VALUES 
('Suplementos', 'Suplementos nutricionais para melhorar o desempenho', 'suplementos'),
('Equipamento', 'Equipamento para treino em casa ou no ginásio', 'equipamento'),
('Vestuário', 'Roupa técnica para treino', 'vestuario');

-- Inserir alguns produtos iniciais
INSERT INTO products (name, slug, description, price, stock_quantity, is_active, is_featured, category_id) VALUES 
('Whey Protein 1kg', 'whey-protein-1kg', 'Proteína de alta qualidade para recuperação muscular', 29.99, 50, TRUE, TRUE, 1),
('Tapete de Yoga', 'tapete-de-yoga', 'Tapete antiderrapante para yoga e exercícios no chão', 19.99, 30, TRUE, FALSE, 2),
('T-shirt Técnica', 't-shirt-tecnica', 'T-shirt respirável para treino intenso', 15.99, 100, TRUE, TRUE, 3);

-- Inserir alguns anúncios iniciais
INSERT INTO advertisements (title, description, image_url, target_url, placement_area, is_active) VALUES 
('Promoção de Verão', 'Desconto de 20% em todos os suplementos', 'https://exemplo.com/imagens/promo-verao.jpg', 'https://exemplo.com/promocao-verao', 'dashboard_top', TRUE),
('Novos Equipamentos', 'Conheça a nossa nova linha de equipamentos para treino em casa', 'https://exemplo.com/imagens/equipamentos.jpg', 'https://exemplo.com/equipamentos', 'shop_sidebar', TRUE);
```

## Como Utilizar Este Script

### Com MySQL Instalado Localmente
```bash
mysql -u root -p < criar_base_dados.sql
```

### Com Docker
```bash
docker exec -i mysql_container mysql -u root -p < criar_base_dados.sql
```

### Notas Importantes
- Este script cria um utilizador administrador inicial com as credenciais:
  - Email: admin@exemplo.com
  - Senha: admin123
- Altere a senha do utilizador administrador após o primeiro login
- Modifique a senha do utilizador da base de dados ('fitness_user') para uma senha segura antes de usar em produção
