exports.up = async function(knex) {
	await knex.raw(`
		ALTER TABLE \`media\` ADD \`media_width\` INT NULL;
	`)
	await knex.raw(`
		ALTER TABLE \`media\` ADD \`media_height\` INT NULL;
	`)
};

exports.down = async function(knex) {
	await knex.raw(`
		ALTER TABLE \`media\` DROP COLUMN \`media_width\`;
	`)
	await knex.raw(`
		ALTER TABLE \`media\` DROP COLUMN \`media_height\`;
	`)
};
