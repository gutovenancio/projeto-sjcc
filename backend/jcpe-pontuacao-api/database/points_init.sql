
CREATE TABLE IF NOT EXISTS point_activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    activity_type ENUM('news_read', 'referral', 'streak_bonus') NOT NULL,
    points_earned INT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS streak_achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    streak_days INT NOT NULL,
    points_earned INT NOT NULL,
    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_streak_achievement (user_id, streak_days)
);


ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_points INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_level INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date DATE;


CREATE INDEX IF NOT EXISTS idx_users_points ON users(total_points);
CREATE INDEX IF NOT EXISTS idx_users_streak ON users(current_streak);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(current_level);