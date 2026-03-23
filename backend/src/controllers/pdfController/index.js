const pug = require('pug');
const fs = require('fs');
const moment = require('moment');
let pdf = require('html-pdf');
const { listAllSettings, loadSettings } = require('@/middlewares/settings');
const { getData } = require('@/middlewares/serverData');
const useLanguage = require('@/locale/useLanguage');
const { useMoney, useDate } = require('@/settings');

const pugFiles = ['invoice', 'offer', 'quote', 'payment'];

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

exports.generatePdf = async (
  modelName,
  info = { filename: 'pdf_file', format: 'A5', targetLocation: '' },
  result,
  callback,
  req
) => {
  try {
    const { targetLocation } = info;

    // if PDF already exists, then delete it and create a new PDF
    if (fs.existsSync(targetLocation)) {
      fs.unlinkSync(targetLocation);
    }

    // render pdf html

    if (pugFiles.includes(modelName.toLowerCase())) {
      // Compile Pug template

      const settings = await loadSettings(req);
      const selectedLang = settings['bizcollab_app_language'] || 'en_us';
      const translate = useLanguage({ selectedLang });

      // Provide default values for money format settings
      const {
        currency_symbol = '$',
        currency_position = 'before',
        decimal_sep = '.',
        thousand_sep = ',',
        cent_precision = 2,
        zero_format = false,
      } = settings;

      const { moneyFormatter } = useMoney({
        settings: {
          currency_symbol,
          currency_position,
          decimal_sep,
          thousand_sep,
          cent_precision,
          zero_format,
        },
      });
      
      const { dateFormat } = useDate({ settings });

      settings.public_server_file = process.env.PUBLIC_SERVER_FILE;

      // Ensure all numeric values in result are properly formatted
      if (result) {
        // Convert string numbers to actual numbers
        if (result.subTotal !== undefined) result.subTotal = Number(result.subTotal) || 0;
        if (result.taxTotal !== undefined) result.taxTotal = Number(result.taxTotal) || 0;
        if (result.total !== undefined) result.total = Number(result.total) || 0;
        if (result.credit !== undefined) result.credit = Number(result.credit) || 0;
        
        // Process items array
        if (result.items && Array.isArray(result.items)) {
          result.items = result.items.map(item => ({
            ...item,
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 0,
            total: Number(item.total) || 0,
          }));
        }
      }

      const htmlContent = pug.renderFile('src/pdf/' + modelName + '.pug', {
        model: result,
        settings,
        translate,
        dateFormat,
        moneyFormatter,
        moment: moment,
      });

      pdf
        .create(htmlContent, {
          format: info.format,
          orientation: 'portrait',
          border: '10mm',
        })
        .toFile(targetLocation, function (error) {
          if (error) throw new Error(error);
          if (callback) callback();
        });
    }
  } catch (error) {
    throw new Error(error);
  }
};

