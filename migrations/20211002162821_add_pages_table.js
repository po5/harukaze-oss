exports.up = async function(knex) {
	await knex.raw(`
        CREATE TABLE \`pages\` (
			\`id\` INT AUTO_INCREMENT NOT NULL,
			\`page_creator\` BIGINT NOT NULL,
			\`page_title\` VARCHAR(256) NOT NULL,
			\`page_slug\` VARCHAR(256) NOT NULL,
			\`page_content\` TEXT NOT NULL,
			\`page_show_link\` BOOL NOT NULL,
			\`page_created_on\` TIMESTAMP NOT NULL DEFAULT NOW(),
			PRIMARY KEY (\`id\`));
    `)
};

exports.down = async function(knex) {
	await knex.schema.dropTable('pages')
};
