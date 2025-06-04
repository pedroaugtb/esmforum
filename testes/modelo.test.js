/* eslint-disable no-undef */
const bd     = require('../bd/bd_utils.js');
const modelo = require('../modelo.js');

/**
 * Para cada teste iniciamos um banco limpo e apontado
 * para o arquivo `esmforum-teste.db`.
 */
beforeEach(() => {
  bd.reconfig('./bd/esmforum-teste.db');
  bd.exec('DELETE FROM respostas', []);
  bd.exec('DELETE FROM perguntas', []);
});

describe('Camada de modelo – integração completa', () => {

  // -----------------------------------------------------------------------
  // 1. Estado inicial
  // -----------------------------------------------------------------------
  it('retorna lista vazia quando não há perguntas', () => {
    expect(modelo.listar_perguntas()).toHaveLength(0);
  });

  // -----------------------------------------------------------------------
  // 2. Inserção e listagem de várias perguntas
  // -----------------------------------------------------------------------
  it('insere três perguntas e mantém ordem / atributos', () => {
    const idA = modelo.cadastrar_pergunta('Quanto é 1 + 1?');
    const idB = modelo.cadastrar_pergunta('Quanto é 2 + 2?');
    const idC = modelo.cadastrar_pergunta('Quanto é 3 + 3?');

    const lista = modelo.listar_perguntas();
    expect(lista).toHaveLength(3);

    // IDs autoincrementais preservam ordem
    expect(lista.map(p => p.id_pergunta)).toEqual([idA, idB, idC]);

    // textos corretos
    expect(lista[0].texto).toBe('Quanto é 1 + 1?');
    expect(lista[1].texto).toBe('Quanto é 2 + 2?');

    // contador de respostas inicia em zero
    expect(lista.every(p => p.num_respostas === 0)).toBe(true);
  });

  // -----------------------------------------------------------------------
  // 3. get_pergunta com ID válido e inválido
  // -----------------------------------------------------------------------
  it('get_pergunta devolve objeto válido ou undefined', () => {
    const id = modelo.cadastrar_pergunta('Capital da França?');

    const encontrada = modelo.get_pergunta(id);
    expect(encontrada).toBeDefined();
    expect(encontrada.id_pergunta).toBe(id);
    expect(encontrada.texto).toBe('Capital da França?');

    // ID inexistente → resultado falsy
    expect(modelo.get_pergunta(999999)).toBeFalsy();
  });

  // -----------------------------------------------------------------------
  // 4. Cadastro de respostas e verificação de contadores
  // -----------------------------------------------------------------------
  it('cadastrar_resposta inclui respostas e atualiza num_respostas', () => {
    const idPerg = modelo.cadastrar_pergunta('4 + 4 = ?');

    // sem respostas ainda
    expect(modelo.get_num_respostas(idPerg)).toBe(0);

    // duas respostas
    const idR1 = modelo.cadastrar_resposta(idPerg, '8');
    const idR2 = modelo.cadastrar_resposta(idPerg, 'oito');

    // IDs numéricos
    [idR1, idR2].forEach(rid => expect(typeof rid).toBe('number'));

    // contador atualizado
    expect(modelo.get_num_respostas(idPerg)).toBe(2);

    // conteúdo e vínculo das respostas
    const respostas = modelo.get_respostas(idPerg);
    expect(respostas).toHaveLength(2);
    expect(respostas.map(r => r.id_resposta)).toEqual([idR1, idR2]);
    expect(respostas.map(r => r.texto))
      .toEqual(expect.arrayContaining(['8', 'oito']));
    respostas.forEach(r => expect(r.id_pergunta).toBe(idPerg));
  });

  // -----------------------------------------------------------------------
  // 5. Funções de leitura para registros inexistentes
  // -----------------------------------------------------------------------
  it('funções de leitura retornam valores “vazios” quando a pergunta não existe', () => {
    const fakeId = 424242;
    expect(modelo.get_respostas(fakeId)).toEqual([]);
    expect(modelo.get_num_respostas(fakeId)).toBe(0);
  });

  // -----------------------------------------------------------------------
  // 6. listar_perguntas reflete num_respostas após inserção de respostas
  // -----------------------------------------------------------------------
  it('listar_perguntas exibe contador atualizado após novas respostas', () => {
    const idPerg = modelo.cadastrar_pergunta('Qual a cor do céu?');
    modelo.cadastrar_resposta(idPerg, 'Azul');
    modelo.cadastrar_resposta(idPerg, 'Depende da hora');

    const alvo = modelo.listar_perguntas()
                       .find(p => p.id_pergunta === idPerg);

    expect(alvo).toBeDefined();
    expect(alvo.num_respostas).toBe(2);
  });

});
