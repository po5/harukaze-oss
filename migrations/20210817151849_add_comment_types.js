exports.up = async function(knex) {
	await knex.raw(`
		ALTER TABLE \`comments\` ADD \`comment_type\` SMALLINT DEFAULT 0 NOT NULL;
	`)
};

exports.down = async function(knex) {
	await knex.raw(`
		ALTER TABLE \`comments\` DROP COLUMN \`comment_type\`;
	`)
};
