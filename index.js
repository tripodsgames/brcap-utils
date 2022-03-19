const moment = require('moment');
const ValidadorCPF = require('./util/validadorCPF.js');
const ValidadorCNPJ = require('./util/validadorCNPJ.js');
const validadorJSON = require('./util/validadorJSON.js');
const DiaUtil = require('./util/diaUtil.js');
const GetDataLocal = require('./util/getDataLocal.js');
const ValidadorDTO = require('./dto/ValidadorDTO.js');
const Log = require('./util/Log.js');
const BRMath = require('./util/Math.js');
const sequelizePaginate = require('./util/SequelizeTools.js').paginate;
const getProp = require('./util/getProp.js');
const aws = require('brcap-aws');

/**
 * Função responsável por retornar o proximo dia útil a partir de uma data, somando o número de dias desejado.
 * Deve-se informar os seguintes parâmetros:
 *      data (data inicial),
 *      numeroDias (número de dias úteis que será somado a data inicial),
 *      tableNameFeriado (nome da tabela de feriado no DynamoDB),
 *      region (nome da região que o DynamoDB está localizado na AWS)
 * Retorna no callback, atributo resultado, o próximo dia útil, somando o número de dias desejado, como String no formato 'YYYY-MM-DD'.
 * Se houver erro retorna no callback (error, resultado) o seguinte objeto: {
 *      statusCode: number,
 *      mensagem: string
 * }
 * @example
 * // returns proximoDiaUtil '2018-02-15'
 * brcap-utils.getProximoDiaUtil('2018-02-09', 2,
 *        'dev_feriado_tb', 'sa-east-1', (error, resultado) => {
 *            if (error) {
 *                res.status(error.statusCode ? error.statusCode : 500)
 *                    .json(error.stack ? error.stack : error.mensagem ? error.mensagem : error);
 *            } else {
 *                res.status(200).json({ proximoDiaUtil: resultado });
 *           }
 * });
 * @param {string} data data inicial
 * @param {number} numeroDias número de dias úteis que será somado a data inicial
 * @param {string} tableNameFeriado nome da tabela de feriado no DynamoDB
 * @param {string} region nome da região que o DynamoDB está localizado na AWS
 * @param {callback} callback
*/
function getProximoDiaUtil(data, numeroDias, tableNameFeriado, region, callback) {
  validaDadosProximoDiaUtil(data, numeroDias, tableNameFeriado, region, (error, resultado) => {
    if (error) {
      callback(error, resultado);
    } else {
      DiaUtil.getProximoDiaUtil(data, numeroDias, tableNameFeriado, region, (error, proximoDiaUtil) => {
        if (error) {
          callback(error, null);
        } else {
          callback(null, proximoDiaUtil);
        }
      });
    }
  });
}

function getProximoDiaUtilDecendio(data, numeroDias, tableNameFeriado, region, callback) {
  validaDadosProximoDiaUtil(data, numeroDias, tableNameFeriado, region, (error, resultado) => {
    if (error) {
      callback(error, resultado);
    } else {
      DiaUtil.getProximoDiaUtilDecendio(data, numeroDias, tableNameFeriado, region, (error, proximoDiaUtil) => {
        if (error) {
          callback(error, null);
        } else {
          callback(null, proximoDiaUtil);
        }
      });
    }
  });
}

/**
 * Função valida se os parâmetros para calcular o próximo dia útil estão com os tipos esperados.
 * @param {string} data data inicial
 * @param {number} numeroDias número de dias úteis que será somado a data inicial
 * @param {string} tableNameFeriado nome da tabela de feriado no DynamoDB
 * @param {string} region nome da região que o DynamoDB está localizado na AWS
 * @param {callback} callback
*/
function validaDadosProximoDiaUtil(data, numeroDias, tableNameFeriado, region, callback) {
  try {
    let mensagem = [];
    let validator = mensagem.concat(validaNotEmpty('data', data), validaNotEmpty('numeroDias', numeroDias), validaNotEmpty('tableNameFeriado', tableNameFeriado), validaNotEmpty('region', region), validaData('data', data), validaNumeric('numeroDias', numeroDias));

    if (validator.length > 0) {
      callback({
        statusCode: 400,
        mensagem: validator,
      }, null);
    } else {
      callback(null, null);
    }
  } catch (error) {
    callback({
      statusCode: error.statusCode ? error.statusCode : 500,
      mensagem: error.stack ? error.stack : error,
    }, null);
  }
}

/**
 * Função valida se o campo informado é nulo (null) ou indefindo (undefined)
 * @param {string} nomeCampo
 * @param {any} valorCampo
 * @returns {array}
*/
function validaNotEmpty(nomeCampo, valorCampo) {
  let msg = [];
  if (valorCampo == null || valorCampo == undefined) {
    msg.push(new ValidadorDTO(`Valor do atributo ${nomeCampo} não informado.`));
  }
  return msg;
}

/**
 * Função valida se o campo informado é uma data válida.
 * @param {string} nomeCampo
 * @param {any} valorCampo
 * @returns {array}
*/
function validaData(nomeCampo, valorCampo) {
  let msg = [];
  if (valorCampo && (!moment(valorCampo, 'YYYY-MM-DD', true).isValid() && !moment(valorCampo, 'YYYY-MM-DD HH:mm:ss', true).isValid())) {
    msg.push(new ValidadorDTO(`${nomeCampo} deve ser uma data válida.`));
  }
  return msg;
}

/**
 * Função valida se o campo informado é um valor numérico.
 * @param {string} nomeCampo
 * @param {any} valorCampo
 * @returns {array}
*/
function validaNumeric(nomeCampo, valorCampo) {
  let msg = [];
  if (valorCampo && isNaN(parseInt(valorCampo))) {
    msg.push(new ValidadorDTO(`${nomeCampo} deve ser numérico.`));
  }
  return msg;
}

function buscaBancoFebraban(tableName, region, callback) {
  let docClient = new AWS.DynamoDB.DocumentClient();
  let params = {
    TableName: tableName,
    region,
  };
  let items = [];
  var scanExecute = function (callback) {
    docClient.scan(params, (err, result) => {
      if (err) {
        callback(err);
      } else {
        items = items.concat(result.Items);
        if (result.LastEvaluatedKey) {
          params.ExclusiveStartKey = result.LastEvaluatedKey;
          scanExecute(callback);
        } else {
          callback(err, items);
        }
      }
    });
  };
  scanExecute(callback);
}

const getCryptedDbProperties = async (bucket, key) => {
  return new Promise((resolve, reject) => {
    aws.S3_Get(bucket, key, (err, result) => (err ? reject({ body: null, region: null, err }) : resolve({ body: result.Body, region: 'sa-east-1', err: '' })))
  })
}

const kmsDecrypt = (data) => {
  return new Promise(
    (resolve, reject) => aws.Kms_decrypt(data.body, data.region,
      (error, sucess) => error ? reject(error) : resolve(JSON.parse(sucess))
    )
  );
}

module.exports = {
  // Validações
  cpfValido: ValidadorCPF.isValid,
  cpfEhValido: ValidadorCPF.isValid,
  cnpjValido: ValidadorCNPJ.isValid,
  isCnpjValido: ValidadorCNPJ.isValid,
  validateSchemaSqs: validadorJSON.validateSchemaSqs,
  validateSchemaService: validadorJSON.validateSchemaService,
  validaNotEmpty,
  validaData,
  validaNumeric,
  // Utilitários
  limpaCPF: ValidadorCPF.limpaCPF,
  getProximoDiaUtil,
  getProximoDiaUtilDecendio,
  buscaBancoFebraban,
  getProp,
  Log,
  BRMath,
  sequelizePaginate,
  getDataLocal: GetDataLocal.getDataLocal,
  getCryptedDbProperties,
  kmsDecrypt
};
