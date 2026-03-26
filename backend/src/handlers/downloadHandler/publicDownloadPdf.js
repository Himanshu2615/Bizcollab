const custom = require('@/controllers/pdfController');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { getTenantDB } = require('../../utils/dbSwitch');

const ClientSchema = require('../../models/schemas/Client');
const InvoiceSchema = require('../../models/schemas/Invoice');
const QuoteSchema = require('../../models/schemas/Quote');
const PaymentSchema = require('../../models/schemas/Payment');
const SettingSchema = require('../../models/schemas/Setting');

module.exports = async function publicDownloadPdf(req, res) {
  try {
    const { tenantId, directory, id } = req.params;

    if (!tenantId || !directory || !id) {
       return res.status(400).json({ success: false, message: 'Missing parameters' });
    }

    const tenantDB = getTenantDB(tenantId);
    if (!tenantDB) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const modelName = directory.slice(0, 1).toUpperCase() + directory.slice(1);
    
    // Manual model registration for this public request
    const models = {
      Client: tenantDB.model('Client', ClientSchema),
      Invoice: tenantDB.model('Invoice', InvoiceSchema),
      Quote: tenantDB.model('Quote', QuoteSchema),
      Payment: tenantDB.model('Payment', PaymentSchema),
      Setting: tenantDB.model('Setting', SettingSchema),
    };

    const Model = models[modelName];
    if (!Model) {
      return res.status(404).json({ success: false, message: `Model '${modelName}' not found` });
    }

    const result = await Model.findOne({ _id: id }).exec();
    if (!result) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Attach mock req objects needed by some controllers/middlewares if any
    req.models = models;
    req.tenantId = tenantId;

    const fileId = modelName.toLowerCase() + '-' + result._id + '.pdf';
    const folderPath = modelName.toLowerCase();
    const targetLocation = path.join(process.cwd(), 'src', 'public', 'download', folderPath, fileId);

    // Create directory if it doesn't exist
    const dir = path.dirname(targetLocation);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await custom.generatePdf(
      modelName,
      { filename: folderPath, format: 'A4', targetLocation },
      result,
      async () => {
        return res.download(targetLocation, (error) => {
          // Delete the temporary file after download completes or fails
          fs.unlink(targetLocation, (err) => {
            if (err) console.error('Error deleting public temp PDF:', err);
          });

          if (error)
            return res.status(500).json({
              success: false,
              message: "Couldn't find file",
              error: error.message,
            });
        });
      },
      req
    );
  } catch (error) {
    console.error('Public PDF Download Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
