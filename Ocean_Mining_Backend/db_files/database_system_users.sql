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

-- Seed fixed login accounts (演示账号；首次部署后请立即修改密码)
-- 注意：AuthService 目前是明文比较，生产环境应改为 BCrypt；这里不再内置真实口令。
-- ON CONFLICT 只跳过，不覆盖已有账号的密码，避免重复执行脚本把线上口令改回默认值。
INSERT INTO system_users (username, password, display_name, is_active)
VALUES
    ('admin', 'CHANGE_ME_ADMIN', '管理员', TRUE),
    ('operator', 'CHANGE_ME_OPERATOR', '值班员', TRUE),
    ('viewer', 'CHANGE_ME_VIEWER', '访客', TRUE)
ON CONFLICT (username) DO NOTHING;
