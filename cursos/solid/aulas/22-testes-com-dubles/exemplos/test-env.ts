// Configura a infra simulada ANTES de carregar a raiz de composição.
process.env.DATABASE_URL ??= 'postgres://localhost:5432/loja_test';
process.env.MAIL_API_KEY ??= 'chave-de-teste';
