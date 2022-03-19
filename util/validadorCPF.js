const blacklist = Object.freeze([
  '00000000000',
  '11111111111',
  '22222222222',
  '33333333333',
  '44444444444',
  '55555555555',
  '66666666666',
  '77777777777',
  '88888888888',
  '99999999999',
]);

/** Função retirada do site da receita federal */
const validadorCPFReceitaFederal = (cpf) => {
  let soma = 0;
  let resto;

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }

  resto = (soma * 10) % 11;

  if ((resto == 10) || (resto == 11)) {
    resto = 0;
  }

  if (resto != parseInt(cpf.substring(9, 10))) {
    return false;
  }

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }

  resto = (soma * 10) % 11;

  if ((resto == 10) || (resto == 11)) {
    resto = 0;
  }

  if (resto != parseInt(cpf.substring(10, 11))) {
    return false;
  }

  return true;
};

/**
 * 
 * @param {string | number} number 
 * @param {string} width 
 * @returns {string}
 */
const leftPadMask = (number, width) => {
  // make sure it's a string
  const input = `${number}`;
  if (input.length >= width.length)
    return input;

  const fillAmt = Math.max(width.length - input.length, 0);
  return width.slice(0, fillAmt) + input;
};

/** Classe responsável pela validação de CPF */
module.exports = class ValidadorCPF {

  /**
   * Função para retirar a formatação do CPF.
   * @example limpaCPF('423.375.020-07'); // retorna 42337502007
   * @param {string | number} cpf
   * @returns {string} Retorna o CPF sem formatação.
   */
  static limpaCPF(cpf) {
    return cpf ? `${cpf}`.replace(/[^\d]+/g, '') : '';
  }

  /**
     * Função responsável pela validação de CPF.
     * Retorna true para válido e false se CPF é inválido.
     * @example
     * ehValido(423.375.020-07);
     * // retorna true
     * @param {string} cpf
     * @returns {string} return sss
    */
  static ehValido(cpf) {
    return ValidadorCPF.isValid(cpf);
  }

  /**
   * Função responsável pela validação de CPF.
   * @example isValid('423.375.020-07'); // true
   * @param {string | number} cpf 
   * @returns {boolean} true se o cpf for válido e false para inválido.
   */
  static isValid(cpf) {
    if (!cpf) {
      return false;
    }

    const cpfSrc = leftPadMask(this.limpaCPF(cpf), '00000000000');

    if (cpfSrc.length !== 11 || blacklist.includes(cpfSrc)) {
      return false;
    }

    return validadorCPFReceitaFederal(cpfSrc);
  }

};
