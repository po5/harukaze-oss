exports.up = async function(knex) {
	await knex.raw(`
		ALTER TABLE \`posts\` ADD \`post_publish_date\` TIMESTAMP NULL;
	`)
};

exports.down = async function(knex) {
	await knex.raw(`
		ALTER TABLE \`posts\` DROP COLUMN \`post_publish_date\`;
	`)
};
