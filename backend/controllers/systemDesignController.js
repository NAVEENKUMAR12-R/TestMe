const { createSystemDesignService } = require('../services/systemDesignService');

function createSystemDesignController(deps) {
  const service = createSystemDesignService(deps);

  const analyze = async (req, res, next) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Supabase auth required' });
        return;
      }
      await service.streamAnalysis({ req, res });
    } catch (error) {
      if (!res.headersSent) {
        res.status(error.status || 500).json({ error: error.message || 'Analysis failed' });
      } else {
        res.end();
      }
      next?.(error);
    }
  };

  return { analyze };
}

module.exports = { createSystemDesignController };
