import { pool } from '../config/database.js';
import { 
    criarIndicacao, 
    buscarPorCodigo, 
    marcarComoUtilizada, 
    listarPorUsuario, 
    verificarLimiteUsuario,
    marcarComoExpirada
} from '../models/indicacao.js';
import axios from 'axios';

const PREMIOS_API_URL = process.env.PREMIOS_API_URL || 'http://localhost:3003';
const PONTOS_POR_INDICACAO = 50;

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
            return res.status(404).json({ success: false, error: 'Código de indicação inválido' });
        }
        if (indicacao.expirado) {
            return res.status(400).json({ success: false, error: 'Esta indicação expirou' });
        }
        if (indicacao.utilizado) {
            return res.status(400).json({ success: false, error: 'Esta indicação já foi utilizada' });
        }

        // 1. Marca o código como usado no banco
        await marcarComoUtilizada(codigo);

        // --- INÍCIO DA NOVA LÓGICA DE RECOMPENSA ---
        try {
            // 2. Tenta dar a recompensa em JCoins para o usuário que indicou
            await axios.post(`${PREMIOS_API_URL}/points/add`, {
                userId: indicacao.id_usuario_indicador.toString(), // Converte o ID para string (ex: '1')
                points: PONTOS_POR_INDICACAO,
                reason: `Indicacao bem-sucedida (codigo: ${codigo})`
            });
            console.log(`[utilizarIndicacao] Recompensa de ${PONTOS_POR_INDICACAO} JCoins enviada para o usuário ${indicacao.id_usuario_indicador}`);
        } catch (apiError) {
            console.error(`[ERRO] Falha ao creditar JCoins para ${indicacao.id_usuario_indicador}. Erro: ${apiError.message}`);
            // Não paramos a execução; o convite foi usado, mas o crédito falhou.
        }
        // --- FIM DA NOVA LÓGICA DE RECOMPENSA ---

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
        res.status(500).json({ success: false, error: 'Erro interno do servidor' });
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

        const totalUtilizadas = indicacoes.filter(ind => ind.utilizado).length;

        res.json({
            success: true,
            data: indicacoesFormatadas,
            total: indicacoes.length,
            totalUtilizadas: totalUtilizadas
        });
    } catch (error) {
        console.error('Erro ao listar indicações:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor' 
        });
    }
};