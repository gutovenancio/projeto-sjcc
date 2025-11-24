const { pool } = require('../config/database');

class PointsService {
    
   
    static calculateLevel(totalPoints) {
        let level = 1;
        while (totalPoints >= this.pointsForLevel(level + 1)) {
            level++;
        }
        return level;
    }

    
    static pointsForLevel(level) {
        if (level === 1) return 0;
        return 50 * Math.pow(2, level - 2);
    }

    // Calcular multiplicador do nível
    static getLevelMultiplier(level) {
        const multipliers = {
            1: 1, 2: 1, 3: 2, 4: 2, 5: 4, 6: 4,
            7: 8, 8: 8, 9: 16, 10: 16
        };
        return multipliers[level] || 1;
    }

   
    static calculateNewsPoints(userLevel) {
        const basePoints = 1;
        const multiplier = this.getLevelMultiplier(userLevel);
        return basePoints * multiplier;
    }

    
    static calculateReferralPoints(userLevel) {
        const basePoints = 5;
        const multiplier = this.getLevelMultiplier(userLevel);
        return basePoints * multiplier;
    }

   
    static getStreakBonus(streakDays) {
        const bonuses = {
            7: 3,
            15: 7,
            30: 15,
            60: 30,
            100: 50,
            365: 100
        };
        return bonuses[streakDays] || 0;
    }

    
    static pointsToReais(points) {
        return points / 20; 
    }

    
    static async updateUserPoints(userId, pointsToAdd) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            
            const [users] = await connection.execute(
                'SELECT * FROM users WHERE id = ?',
                [userId]
            );
            
            if (users.length === 0) {
                throw new Error('Usuário não encontrado');
            }

            const user = users[0];
            const newTotalPoints = user.total_points + pointsToAdd;
            const newLevel = this.calculateLevel(newTotalPoints);

            
            await connection.execute(
                'UPDATE users SET total_points = ?, current_level = ? WHERE id = ?',
                [newTotalPoints, newLevel, userId]
            );

            await connection.commit();

            return {
                newTotalPoints,
                newLevel,
                pointsAdded: pointsToAdd,
                levelMultiplier: this.getLevelMultiplier(newLevel)
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    
    static async processUserStreak(userId) {
        const today = new Date().toISOString().split('T')[0];
        
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) return null;

        const user = users[0];
        const lastActivity = user.last_activity_date;
        
        let newStreak = user.current_streak;
        let streakBonus = 0;

       
        if (lastActivity !== today) {
            if (lastActivity) {
                const lastDate = new Date(lastActivity);
                const todayDate = new Date(today);
                const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
                
                if (diffDays > 1) {
                    newStreak = 1; 
                } else {
                    newStreak = user.current_streak + 1; 
                }
            } else {
                newStreak = 1; 
            }

            
            streakBonus = this.getStreakBonus(newStreak);
            
           
            if (streakBonus > 0) {
                const [existingBonus] = await pool.execute(
                    'SELECT id FROM streak_achievements WHERE user_id = ? AND streak_days = ?',
                    [userId, newStreak]
                );
                
                if (existingBonus.length === 0) {
                    
                    await pool.execute(
                        'INSERT INTO streak_achievements (user_id, streak_days, points_earned) VALUES (?, ?, ?)',
                        [userId, newStreak, streakBonus]
                    );
                } else {
                    streakBonus = 0; 
                }
            }

        
            await pool.execute(
                `UPDATE users 
                 SET current_streak = ?, last_activity_date = ?, 
                     longest_streak = GREATEST(longest_streak, ?) 
                 WHERE id = ?`,
                [newStreak, today, newStreak, userId]
            );

            return {
                newStreak,
                streakBonus,
                streakMessage: streakBonus > 0 ? `Bônus de ${streakBonus} pontos por ${newStreak} dias consecutivos!` : ''
            };
        }

        return {
            newStreak: user.current_streak,
            streakBonus: 0,
            streakMessage: 'Atividade já registrada hoje'
        };
    }

    // Registrar atividade de pontos
    static async logActivity(userId, activityType, points, description) {
        await pool.execute(
            'INSERT INTO point_activities (user_id, activity_type, points_earned, description) VALUES (?, ?, ?, ?)',
            [userId, activityType, points, description]
        );
    }

    // Obter estatísticas do usuário
    static async getUserStats(userId) {
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) return null;

        const user = users[0];
        const nextLevel = user.current_level + 1;
        const pointsForNextLevel = this.pointsForLevel(nextLevel);
        const pointsNeeded = pointsForNextLevel - user.total_points;

        // Obter atividades recentes
        const [activities] = await pool.execute(
            'SELECT * FROM point_activities WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
            [userId]
        );

        return {
            user: {
                id: user.id,
                name: user.name,
                totalPoints: user.total_points,
                currentLevel: user.current_level,
                currentStreak: user.current_streak,
                longestStreak: user.longest_streak,
                lastActivity: user.last_activity_date
            },
            levelInfo: {
                currentMultiplier: this.getLevelMultiplier(user.current_level),
                nextLevel,
                pointsForNextLevel,
                pointsNeeded,
                progressPercentage: Math.min(100, Math.floor((user.total_points / pointsForNextLevel) * 100))
            },
            recentActivities: activities,
            pointsValue: this.pointsToReais(user.total_points)
        };
    }
}

module.exports = PointsService;