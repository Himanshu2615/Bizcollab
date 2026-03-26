const downloadPdf = require('@/handlers/downloadHandler/downloadPdf');
const exportCsv = require('@/handlers/downloadHandler/exportCsv');
const express = require('express');

const router = express.Router();

router.route('/export/:entity').get(function (req, res) {
  const { entity } = req.params;
  exportCsv(req, res, { entity });
});

router.route('/:directory/:file').get(function (req, res) {
  try {
    const { directory, file } = req.params;
    const id = file.slice(directory.length + 1).slice(0, -4); // extract id from file name
    downloadPdf(req, res, { directory, id });
  } catch (error) {
    return res.status(503).json({
      success: false,
      result: null,
      message: error.message,
      error: error,
    });
  }
});

module.exports = router;
