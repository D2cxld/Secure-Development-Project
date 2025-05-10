DROP TABLE IF EXISTS user_login;
CREATE TABLE user_login (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255) DEFAULT NULL,
  role ENUM('user', 'admin', 'superadmin') DEFAULT 'user',
  uses_2fa BOOLEAN DEFAULT FALSE
);
