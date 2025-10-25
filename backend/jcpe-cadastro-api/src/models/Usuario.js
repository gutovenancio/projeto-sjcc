const bcrypt = require('bcryptjs');

class Usuario {
    constructor(id, nome, email, senhaHash, criadoEm){
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.senhaHash = senhaHash;
        this.criadoEm = criadoEm;
    }

    static async criar(nome, email, senha) {
        if(!nome || !email || !senha){
            throw new Error("Nome, email e senha são obrigatórios.");
        }

        if(!this.validarEmail(email)){
            throw new Error("Email inválido.");
        }
        if(!this.validarSenha(senha)){
            throw new Error("Senha deve ter pelo menos 6 caracteres.");
        }

        const senhaHash = await bcrypt.hash(senha, 10);
        const criadoEm = new Date();

        return new Usuario(null, nome, email, senhaHash, criadoEm);
    }

    async verificarSenha(senha){
        return await bcrypt.compare(senha, this.senhaHash)
    }

    alterarNome(novoNome){
        if(!novoNome || novoNome.trim().length === 0){
            throw new Error("Nome não pode ser vazio.");
        }
        this.nome = novoNome.trim();
    }

    ativar(){}
    desativar(){}

    static validarEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validarSenha(senha){
        return senha && senha.length >= 6;
    }

    toJSON(){
        return {
            id: this.id,
            nome: this.nome,
            email: this.email,
            criadoEm: this.criadoEm
        };
    }
}

module.exports = Usuario;