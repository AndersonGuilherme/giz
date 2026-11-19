// Configura a infra ANTES de carregar o serviço: sem isso, o import do serviço já quebra.
process.env.DATABASE_URL ??= 'postgres://localhost:5432/loja_test';
process.env.MAIL_API_KEY ??= 'chave-de-teste';
