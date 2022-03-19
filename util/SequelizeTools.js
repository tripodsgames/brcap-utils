module.exports = {

  /**
   * Paginação para Sequelize (raw = true, forçado)
   * @param {object} sequilize  Sequelize
   * @param {object} model      Model Sequelize
   * @param {object} options    Sequilize Options
   * @param {number} limit      Limite de resultados por pagina
   * @param {number} page       Pagina desejada, se null === 1
   * @param {object} [req]      Opcional, objeto req do Express, se informado retorna currentPageLink, nextPagelink, previousPageLink
   * @returns {Promise}
   */
  paginate: (sequelize, model, options, limit, page, req) => new Promise((resolve, reject) => {
    (async () => {
      try {
        let logging = sequelize.options && typeof sequelize.options.logging === 'function' ? sequelize.options.logging : false;
        logging = options.logging && typeof options.logging === 'function' ? options.logging : logging;
        let totalQuery;
        const getQuery = (sql) => {
          if (logging) logging(sql);
          totalQuery = sql.replace(/Executing\s\(default\):\s|LIMIT[^;]+|\s;|;/g, '');
          totalQuery = `SELECT COUNT(*) AS TOTAL FROM (${totalQuery}) AS GRPS`;
        };

        let currentPage = page && parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
        const offset = currentPage * limit - limit;
        Object.assign(options, {
          raw: true,
          logging: getQuery,
          limit,
          offset,
        });
        const success = {};
        const rows = await model.findAll(options);
        const resultTotalQuery = await sequelize.query(totalQuery);
        const total = resultTotalQuery[0][0].TOTAL;

        const totalPages = Math.ceil(total / limit);
        const nextPage = currentPage + 1 <= totalPages ? currentPage + 1 : totalPages;
        const previousPage = currentPage - 1 > 0 ? currentPage - 1 : 1;
        let currentPageURL;
        let nextPageURL;
        let previousPageURL;
        let firstPageURL;
        let lastPageURL;
        if (req) {
          const requestedUrl = `${req.protocol}://${req.get('Host')}${req.url}`;
          currentPageURL = requestedUrl;
          if (!/\?/g.test(requestedUrl)) currentPageURL += '?';
          if (!/&page=|\?page=/g.test(requestedUrl)) currentPageURL += `&page=${currentPage}`;
          currentPageURL = currentPageURL.replace(/page=[\d]+/g, `page=${currentPage}`);
          nextPageURL = currentPageURL.replace(/page=[\d]+/g, `page=${nextPage}`);
          previousPageURL = currentPageURL.replace(/page=[\d]+/g, `page=${previousPage}`);
          firstPageURL = currentPageURL.replace(/page=[\d]+/g, `page=${1}`);
          lastPageURL = currentPageURL.replace(/page=[\d]+/g, `page=${totalPages}`);
        }
        Object.assign(success, {
          rows,
          total,
          totalPages,
          currentPage,
          nextPage,
          previousPage,
          currentPageURL,
          firstPageURL,
          lastPageURL,
          nextPageURL,
          previousPageURL,
        });
        delete (success.count);
        if (currentPage >= nextPage) {
          delete (success.nextPage);
          delete (success.nextPageURL);
        }
        if (currentPage < 2) {
          delete (success.previousPage);
          delete (success.previousPageURL);
        }
        if (!total) {
          delete (success.currentPage);
          delete (success.currentPageURL);
          delete (success.firstPageURL);
          delete (success.lastPageURL);
        }
        resolve(success);
      } catch (error) {
        reject(error);
      }
    })();
  })

};
