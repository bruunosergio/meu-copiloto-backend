import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('8h'),
  // Sessao do terminal da loja (Store.codigo+senha) - dura o turno todo.
  JWT_EXPIRES_IN_LOJA: Joi.string().default('12h'),
  // Sessao do vendedor apos escolher o nome + PIN - curta de proposito
  // (o frontend ja devolve ao seletor apos ~5min de inatividade ou apos
  // registrar 1 falta; isto e so o teto de seguranca - ver ADR-0007).
  JWT_EXPIRES_IN_VENDEDOR: Joi.string().default('20m'),
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
  DEFAULT_STORE_ID: Joi.string().default('loja-piloto'),
});
