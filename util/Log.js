const { Dynamo_Put } = require('brcap-aws');

const appDir = __dirname.replace(/node_modules\/brcap-utils\/util/g, '');
let config = {};
try {
  config = require(`${appDir}config/log.json`);
} catch (e) {
  // maxLogLength é pra evitar estouro de memória
  config = { state: 'production', maxLogLength: 100 };
}

// LOG
/**
 * Fuçao responsável pelos console.logs
 * 
 * Requer o arquivo de configuração AppRoot/config/log.json com o conteúdo
 * 
 * ```
 * { state: 'production', endCleanAfter: 30000 }
 * ```
 * 
 * Use state:production para produção
 * 
 * Use state:developement ou utilze NODE_ENV === development para desenvolvimento
 * 
 * @example
 * const { Log } = require('brcap-utils);
 * const log  = new Log('Nome do script ou função');
 * log.info('Algo muito importante');   // <-- log.info vai sempre logar tanto em dev com em prd
 * log.debug('Algo muito importante');  // <-- log.debug registra um log.debug / dev vai printar imediatamente
 * log.error('Ocorreu um erro');        // <-- log.error vai loggar todos os log.debug registrados e o log.error
 * // Passe adiante o objeto "log" (expl: minhaFuncao(arg1, arg2, log)) para manter os registros do log juntos
 */

class Log {

  /**
   * 
   * @param {string} script Nome do script ou função
   */
  constructor(script = 'NO SCRIPT DEFINED') {
    this.script = script;
    this.maxLogLength = config.maxLogLength;
    this.log = [];
  }

  static check() {
    return (process.env.NODE_ENV === 'development' || config.state === 'development');
  }

  static getDate() {
    let data = new Date();
    let ano = data.getFullYear();
    let mes = ("00" + (data.getMonth() + 1)).slice(-2)
    let dia = ("00" + data.getDay()).slice(-2)
    let hora = ("00" + data.getHours()).slice(-2)
    let minutos = ("00" + data.getMinutes()).slice(-2)
    let segundos = ("00" + data.getSeconds()).slice(-2)
    return `${ano}-${mes}-${dia}T${hora}:${minutos}:${segundos} `;
  }

  build(type) {
    const date = Log.getDate();
    let types = {
      info: `\x1b[32m[INFO]\x1b[0m ${date} \x1b[32m${this.script ? `[${this.script}]` : ''} >>\x1b[0m`,
      debug: `\x1b[36m[DEBUG]\x1b[0m ${date} \x1b[36m${this.script ? `[${this.script}]` : ''} >>\x1b[0m`,
      error: `\x1b[31m[ERROR]\x1b[0m ${date} \x1b[31m${this.script ? `[${this.script}]` : ''} >>\x1b[0m`,
    };

    if (!Log.check()) {
      types = {
        info: `[INFO] ${date} ${this.script ? `[${this.script}]` : ''} >>`,
        debug: `[DEBUG] ${date} ${this.script ? `[${this.script}]` : ''} >>`,
        error: `[ERROR] ${date} ${this.script ? `[${this.script}]` : ''} >>`,
      };
    }

    return [types[type]];
  }

  info(...args) {
    let log = this.build('info');
    log = log.concat(args);
    console.log(...log);
  }

  debug(...args) {
    let log = this.build('debug');
    log = log.concat(args);
    // esvaziando
    if (this.log > this.maxLogLength) this.log = [];
    if (Log.check()) return console.log(...log);
    this.log.push(log);
  }

  error(...args) {
    let log = this.build('error');
    log = log.concat(args);
    this.log.map((error) => {
      console.log(...error);
    });
    this.log = [];
    console.log(...log);
  }

  static sequelize(...args) {
    if (!Log.check()) return;
    const reg = /^([^:]+:)(.*)/;
    const matchs = String(args[0] || '').match(reg);
    if (matchs.length < 2) return;
    console.log(`\x1b[32m[SEQUELIZE]\x1b[0m ${Log.getDate()} \x1b[32m[${matchs[1]}] >> \x1b[0m\x1b[33m${matchs[2]}\x1b[0m`);
  }

  // expl: Log.logDynamo('pgt-erros-dev', 'sa-east-1', { processo: "pgt-regra-pgto-prd", timestamp: Date.now(), desc: "descrição do seu erro", item: { seuItem: "item" }});
  // não retorna nada, vai tentar 3 vzs incluri seu erro
  // vai deixar logs em caso de não consegui
  static logDynamo(tableName, region, item, trys) {
    trys = trys || 1;
    Dynamo_Put(tableName, item, region, (err, data) => {
      if (!err) return;
      console.log(`brcap-utils logDynamo falhou na ${trys} tentativa.`, `tableName:${tableName}`, `region:${region}`, 'item:', item);
      if (trys >= 3) return;
      setTimeout(() => {
        Log.logDynamo(tableName, region, item, ++trys);
      }, 500);
    });
  }
}

module.exports = Log;
