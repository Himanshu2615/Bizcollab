const mongoose = require('mongoose');

const updateBySettingKey = async (req, res) => {
  const Model = req.models?.Setting || mongoose.model('Setting');
  const settingKey = req.params.settingKey || undefined;

  if (!settingKey) {
    return res.status(202).json({
      success: false,
      result: null,
      message: 'No settingKey provided ',
    });
  }
  const { settingValue, settingCategory } = req.body;

  if (settingValue === undefined) {
    return res.status(202).json({
      success: false,
      result: null,
      message: 'No settingValue provided ',
    });
  }
  const result = await Model.findOneAndUpdate(
    { settingKey, ...(req.tenantId && { tenantId: req.tenantId }) },
    {
      settingValue,
      ...(settingCategory && { settingCategory }),
      ...(req.tenantId && { tenantId: req.tenantId }),
    },

    {
      new: true, // return the new result instead of the old one
      runValidators: true,
      upsert: true,
    }
  ).exec();
  if (!result) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No document found by this settingKey: ' + settingKey,
    });
  } else {
    return res.status(200).json({
      success: true,
      result,
      message: 'we update this document by this settingKey: ' + settingKey,
    });
  }
};

module.exports = updateBySettingKey;
