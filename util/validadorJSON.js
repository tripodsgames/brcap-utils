let { Validator } = require('jsonschema');
let validator = new Validator();
const UTF_8 = 'utf8';

module.exports = class validadorJSON {
  /** valida json sqs
     * @param  {json} schema
     * @param  {json} payload
     * @param  {callback} callback
     */

  /**
   * 
   * @param {any} schema 
   * @param {string} payload 
   * @param {callback} callback 
   */
  static validateSchemaSqs(schema, payload, callback) {
    let listValidacao = validarRequestSchemaSqs(schema, payload);
    if (listValidacao.length == 0) {
      validateJsonSchema(schema, payload, (erro, resultado) => {
        callback(erro, resultado);
      });
    } else {
      callback(listValidacao, null);
    }
  }


  /**  validar payload service
     * @param  {} schema
     * @param  {} payload
     * @param  {} resource
     * @param  {} httpMethod
     * @param  {} callback
     */
  static validateSchemaService(schema, payload, resource, httpMethod, callback) {
    let listValidacao = validarValidateSchemaService(schema, payload, resource, httpMethod);
    if (listValidacao.length == 0) {
      validarArquivo(schema, payload, resource, httpMethod, (erro, resultado) => {
        callback(erro, resultado);
      });
    } else {
      callback(listValidacao, null);
    }
  }
};


function validarArquivo(schema, payload, resource, httpMethod, callback) {
  if (schema) {
    let schemaValidation = JSON.parse(schema.Body.toString(UTF_8))[resource][httpMethod];

    if (schemaValidation) {
      validateJsonSchema(payload, schemaValidation, (erro, resultado) => {
        callback(erro, resultado);
      });
    } else {
      throw new Error('Configuração não encontrada.');
    }
  } else {
    callback(erro, null);
  }
}


function validateJsonSchema(schema, payload, callback) {
  if (validator.validate(payload, schema).errors.length > 0) {
    let listaErros = validator.validate(payload, schema).errors;

    try {
      const error = listaErros.map(
        error => error.schema.message[error.name],
      );
      callback(error, null);
    } catch (error) {
      console.log('Erro ao recuperar lista de mensagem ', error);
      callback(listaErros, null);
    }
  } else {
    callback(null, []);
  }
}

function validarValidateSchemaService(schema, payload, resource, httpMethod) {
  let message = [];
  return message.concat(validaNotEmpty(schema),
    validaNotEmpty(payload),
    validaNotEmpty(resource),
    validaNotEmpty(httpMethod));
}


function validarRequestSchemaSqs(schema, payload) {
  let message = [];
  return message.concat(validaNotEmpty(schema),
    validaNotEmpty(payload));
}


function validaNotEmpty(schema) {
  msg = [];

  if (!schema) {
    const varToString = schema => Object.keys(schema)[0];
    const displayName = varToString({ schema });
    msg.push({ campo: displayName, mensagem: 'não informado.' });
  }

  return msg;
}
