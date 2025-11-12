import { Router } from 'express';
import { 
    gerarConvite, 
    validarIndicacao, 
    utilizarIndicacao, 
    listarIndicacoes 
} from '../controllers/indicacoesController.js';

const router = Router();

router.post('/invite/generate', gerarConvite);
router.get('/invite/validate/:codigo', validarIndicacao);
router.post('/invite/use/:codigo', utilizarIndicacao);
router.get('/users/:idUsuario/invites', listarIndicacoes);

export default router;