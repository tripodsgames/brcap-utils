/**
 * 
 * @param {number} value Valor a ser arredondado
 * @param {number} [decimals] Decimais (Padrão: 2)
 * @returns {number}
 */
const round = (value, decimals) => {
  return Number(`${Math.round(`${value}e${decimals || 2}`)}e-${decimals || 2}`);
};

module.exports = {
  round
};
