const express = require('express');
const { createSystemDesignController } = require('../controllers/systemDesignController');

function systemDesignRoutes(deps) {
  const router = express.Router();
  const controller = createSystemDesignController(deps);

  router.post('/analyze', controller.analyze);

  return router;
}

module.exports = systemDesignRoutes;
