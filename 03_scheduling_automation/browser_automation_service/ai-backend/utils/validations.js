// Request validation schemas (Joi)
const Joi = require('joi');
module.exports = {
  chatMessageSchema: Joi.object({
    userId: Joi.string().required(),
    message: Joi.string().required()
  })
};
