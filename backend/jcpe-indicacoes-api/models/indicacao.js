import { pool } from '../config/database.js';

export const gerarCodigoUnico = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
};

export const criarIndicacao = async (idUsuario, diasExpiracao = 30, descricao = null) => {
    try {
        let codigoUnico;
        let codigoExiste;
        
        do {
            codigoUnico = gerarCodigoUnico();
            const [rows] = await pool.execute(
                'SELECT id FROM indicacoes WHERE codigo_unico = ?',
                [codigoUnico]
            );
            codigoExiste = rows.length > 0;
        } while (codigoExiste);

        const dataExpiracao = new Date();
        dataExpiracao.setDate(dataExpiracao.getDate() + diasExpiracao);

        const [result] = await pool.execute(
            `INSERT INTO indicacoes 
             (codigo_unico, id_usuario_indicador, data_expiracao, descricao) 
             VALUES (?, ?, ?, ?)`,
            [codigoUnico, idUsuario, dataExpiracao, descricao]
        );

        const link = `${process.env.BASE_URL}/invite/${codigoUnico}`;

        return {
            id: result.insertId,
            codigoUnico,
            dataExpiracao,
            diasValidade: diasExpiracao,
            link: link,
            descricao
        };
    } catch (error) {
        console.error('Erro ao gerar convite:', error);
        throw error;
    }
};

export const buscarPorCodigo = async (codigo) => {
    try {
        const [rows] = await pool.execute(
            `SELECT i.*, u.nome as nome_indicador, u.email as email_indicador 
             FROM indicacoes i 
             LEFT JOIN usuarios u ON i.id_usuario_indicador = u.id 
             WHERE i.codigo_unico = ? AND i.ativo = TRUE`,
            [codigo]
        );
        
        const indicacao = rows[0];
        if (!indicacao) return null;

        if (indicacao.data_expiracao && new Date(indicacao.data_expiracao) < new Date()) {
            await marcarComoExpirada(codigo);
            indicacao.expirado = true;
        }

        return indicacao;
    } catch (error) {
        console.error('Erro ao buscar indicação:', error);
        throw error;
    }
};

export const marcarComoExpirada = async (codigo) => {
    try {
        await pool.execute(
            'UPDATE indicacoes SET expirado = TRUE, ativo = FALSE WHERE codigo_unico = ?',
            [codigo]
        );
        return true;
    } catch (error) {
        console.error('Erro ao marcar como expirada:', error);
        throw error;
    }
};

export const marcarComoUtilizada = async (codigo) => {
    try {
        await pool.execute(
            `UPDATE indicacoes 
             SET utilizado = TRUE, data_utilizacao = NOW() 
             WHERE codigo_unico = ?`,
            [codigo]
        );
        return true;
    } catch (error) {
        console.error('Erro ao marcar como utilizada:', error);
        throw error;
    }
};

export const listarPorUsuario = async (idUsuario) => {
    try {
        const [rows] = await pool.execute(
            `SELECT 
                codigo_unico, 
                data_criacao, 
                data_expiracao,
                data_utilizacao, 
                utilizado,
                expirado,
                descricao,
                ativo
             FROM indicacoes 
             WHERE id_usuario_indicador = ? 
             ORDER BY data_criacao DESC`,
            [idUsuario]
        );
        return rows;
    } catch (error) {
        console.error('Erro ao listar indicações:', error);
        throw error;
    }
};

export const verificarLimiteUsuario = async (idUsuario, limite = 50) => {
    try {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) as total 
             FROM indicacoes 
             WHERE id_usuario_indicador = ? 
             AND DATE(data_criacao) = CURDATE()`,
            [idUsuario]
        );
        return rows[0].total >= limite;
    } catch (error) {
        console.error('Erro ao verificar limite:', error);
        throw error;
    }
};