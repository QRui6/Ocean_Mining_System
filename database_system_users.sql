-- Login users table for backend auth API
CREATE TABLE IF NOT EXISTS system_users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Optional trigger to keep updated_at current
CREATE OR REPLACE FUNCTION update_system_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_system_users_updated_at ON system_users;
CREATE TRIGGER trg_system_users_updated_at
BEFORE UPDATE ON system_users
FOR EACH ROW
EXECUTE FUNCTION update_system_users_updated_at();

-- Seed fixed login accounts (edit as needed)
INSERT INTO system_users (username, password, display_name, is_active)
VALUES
    ('admin', 'admin123', '管理员', TRUE),
    ('operator', 'operator123', '值班员', TRUE),
    ('viewer', 'viewer123', '访客', TRUE)
ON CONFLICT (username) DO UPDATE
SET password = EXCLUDED.password,
    display_name = EXCLUDED.display_name,
    is_active = EXCLUDED.is_active;
