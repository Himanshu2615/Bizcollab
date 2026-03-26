const mongoose = require('mongoose');

const flattenObject = (obj, prefix = '') => {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k]) && !(obj[k] instanceof mongoose.Types.ObjectId) && !(obj[k] instanceof Date)) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
};

module.exports = async function exportCsv(req, res, { entity }) {
  try {
    const modelName = entity.slice(0, 1).toUpperCase() + entity.slice(1);
    const Model = req.models[modelName];

    if (!Model) {
      return res.status(404).json({
        success: false,
        result: null,
        message: `Model '${modelName}' does not exist`,
      });
    }

    const results = await Model.find({}).lean().exec();

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No data found to export',
      });
    }

    // Process and flatten data for CSV
    const flattenedData = results.map(item => flattenObject(item));

    // Get all unique keys for headers, but filter out some internal ones
    const internalKeys = ['_id', '__v', 'id', 'tenantId', 'updated', 'created', 'removed', 'isRemoved'];
    
    // For specific entities, we might want to prioritize certain columns or handle specific fields
    let columns = [];
    if (entity === 'invoice' || entity === 'quote') {
      columns = [
        'number', 'year', 'date', 'status', 'paymentStatus', 
        'total', 'subTotal', 'taxTotal', 'taxRate',
        'client.name', 'client.email', 'client.phone',
        'notes', 'created'
      ];
    } else if (entity === 'client') {
       columns = ['name', 'email', 'phone', 'address', 'companyName', 'gstNumber'];
    } else if (entity === 'payment') {
      columns = ['number', 'date', 'amount', 'currency', 'client.name', 'invoice.number', 'paymentMode.name', 'ref'];
    } else {
      // Generic case: get all keys from the first item that aren't internal
      const allKeys = new Set();
      flattenedData.forEach(item => Object.keys(item).forEach(key => allKeys.add(key)));
      columns = Array.from(allKeys).filter(key => !internalKeys.some(ik => key === ik || key.endsWith('.' + ik)));
    }

    // Build the CSV string
    const csvRows = [];
    
    // Header row
    csvRows.push(columns.join(','));

    // Data rows
    for (const row of flattenedData) {
      const values = columns.map(col => {
        let val = row[col];
        
        // Handle dates
        if (val instanceof Date) {
          val = val.toISOString();
        }
        
        // Stringify and escape
        let cell = String(val === null || val === undefined ? '' : typeof val === 'object' ? JSON.stringify(val) : val);
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          cell = `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      });
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');

    // Send the response
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${entity}-export-${new Date().toISOString().slice(0, 10)}.csv`);
    
    return res.status(200).send(csvString);

  } catch (error) {
    console.error('CSV Export Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};
