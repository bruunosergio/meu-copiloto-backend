import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('8h'),
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
  DEFAULT_STORE_ID: Joi.string().default('loja-piloto'),
});
