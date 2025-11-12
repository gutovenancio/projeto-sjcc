import { pool } from '../config/database.js';
import { 
    criarIndicacao, 
    buscarPorCodigo, 
    marcarComoUtilizada, 
    listarPorUsuario, 
    verificarLimiteUsuario 
} from '../models/indicacao.js';

export const gerarConvite = async (req, res) => {
    try {
        const { idUsuario, diasExpiracao = 30, descricao = null } = req.body;

        if (!idUsuario) {
            return res.status(400).json({ 
                success: false,
                error: 'ID do usuário é obrigatório' 
            });
        }

        const [user] = await pool.execute('SELECT id, nome FROM usuarios WHERE id = ?', [idUsuario]);
        if (user.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Usuário não encontrado' 
            });
        }

        const limiteAtingido = await verificarLimiteUsuario(idUsuario);
        if (limiteAtingido) {
            return res.status(429).json({ 
                success: false,
                error: 'Limite diário de convites atingido' 
            });
        }

        const diasValidos = Math.min(Math.max(parseInt(diasExpiracao) || 30, 1), 365);
        const novoConvite = await criarIndicacao(idUsuario, diasValidos, descricao);
        
        res.status(201).json({
            success: true,
            message: 'Link gerado com sucesso',
            data: novoConvite
        });
    } catch (error) {
        console.error('Erro ao gerar convite:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor' 
        });
    }
};

export const validarIndicacao = async (req, res) => {
    try {
        const { codigo } = req.params;

        const indicacao = await buscarPorCodigo(codigo);

        if (!indicacao) {
            return res.status(404).json({ 
                success: false,
                error: 'Código de indicação inválido' 
            });
        }

        if (indicacao.expirado) {
            return res.status(400).json({ 
                success: false,
                error: 'Este código de indicação expirou' 
            });
        }

        if (indicacao.utilizado) {
            return res.status(400).json({ 
                success: false,
                error: 'Este código de indicação já foi utilizado' 
            });
        }

        const diasRestantes = Math.ceil(
            (new Date(indicacao.data_expiracao) - new Date()) / (1000 * 60 * 60 * 24)
        );

        res.json({
            success: true,
            data: {
                codigo: indicacao.codigo_unico,
                indicador: indicacao.nome_indicador,
                dataCriacao: indicacao.data_criacao,
                dataExpiracao: indicacao.data_expiracao,
                diasRestantes: Math.max(0, diasRestantes),
                descricao: indicacao.descricao
            }
        });
    } catch (error) {
        console.error('Erro ao validar indicação:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor' 
        });
    }
};

export const utilizarIndicacao = async (req, res) => {
    try {
        const { codigo } = req.params;

        const indicacao = await buscarPorCodigo(codigo);

        if (!indicacao) {
            return res.status(404).json({ 
                success: false,
                error: 'Código de indicação inválido' 
            });
        }

        if (indicacao.expirado) {
            return res.status(400).json({ 
                success: false,
                error: 'Esta indicação expirou' 
            });
        }

        if (indicacao.utilizado) {
            return res.status(400).json({ 
                success: false,
                error: 'Esta indicação já foi utilizada' 
            });
        }

        await marcarComoUtilizada(codigo);

        res.json({
            success: true,
            message: 'Indicação utilizada com sucesso',
            data: {
                codigo: indicacao.codigo_unico,
                indicador: indicacao.nome_indicador,
                dataUtilizacao: new Date()
            }
        });
    } catch (error) {
        console.error('Erro ao utilizar indicação:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor' 
        });
    }
};

export const listarIndicacoes = async (req, res) => {
    try {
        const { idUsuario } = req.params;

        const indicacoes = await listarPorUsuario(idUsuario);

        const indicacoesFormatadas = indicacoes.map(ind => ({
            codigo: ind.codigo_unico,
            dataCriacao: ind.data_criacao,
            dataExpiracao: ind.data_expiracao,
            utilizado: ind.utilizado,
            expirado: ind.expirado,
            descricao: ind.descricao,
            status: ind.expirado ? 'expirado' : ind.utilizado ? 'utilizado' : 'ativo'
        }));

        res.json({
            success: true,
            data: indicacoesFormatadas,
            total: indicacoes.length
        });
    } catch (error) {
        console.error('Erro ao listar indicações:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor' 
        });
    }
};