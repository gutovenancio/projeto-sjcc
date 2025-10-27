class CriarUsuarioDTO {
    constructor(nome, email, senha){
        this.nome = nome;
        this.email = email;
        this.senha = senha;
    }

    static fromRequest(body){
        return new criarUsuarioDTO(body.nome, body.email, body.senha);
    }
}

module.exports = CriarUsuarioDTO;