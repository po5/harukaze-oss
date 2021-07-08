exports.up = async function(knex) {
    await knex.raw(`
        CREATE TABLE \`users\` (
            \`id\` BIGINT NOT NULL AUTO_INCREMENT,
            \`user_username\` VARCHAR(16) NOT NULL,
            \`user_bio\` VARCHAR(2048),
            \`user_hash\` TEXT NOT NULL,
            \`user_role\` TINYINT NOT NULL DEFAULT 0,
            \`user_avatar_key\` VARCHAR(256),
            \`user_character\` VARCHAR(256),
            \`user_info\` TEXT NULL DEFAULT NULL,
            \`user_banned\` TINYINT NOT NULL DEFAULT 0,
            \`user_created_on\` TIMESTAMP NOT NULL DEFAULT NOW(),
            PRIMARY KEY (\`id\`));
    `)
    await knex.raw(`
        CREATE TABLE \`userlogins\` (
            \`id\` INT NOT NULL AUTO_INCREMENT,
            \`login_user\` BIGINT NOT NULL,
            \`login_ip\` VARCHAR(46) NOT NULL,
            \`login_created_on\` TIMESTAMP NOT NULL DEFAULT NOW(),
            PRIMARY KEY (\`id\`));
    `)
    await knex.raw(`
        CREATE TABLE \`ipbans\` (
            \`ip\` VARCHAR(46) NOT NULL,
            \`ban_created_on\` TIMESTAMP NOT NULL DEFAULT NOW(),
            PRIMARY KEY (\`ip\`));
    `)
    await knex.raw(`
        CREATE TABLE \`posts\` (
            \`id\` BIGINT NOT NULL AUTO_INCREMENT,
            \`post_author\` BIGINT NOT NULL,
            \`post_title\` VARCHAR(256) NOT NULL,
            \`post_slug\` VARCHAR(256) NOT NULL,
            \`post_content\` TEXT NOT NULL,
            \`post_tags\` VARCHAR(1024) NOT NULL DEFAULT '',
            \`post_enable_comments\` TINYINT NOT NULL DEFAULT 1,
            \`post_published\` TINYINT NOT NULL DEFAULT 0,
            \`post_show_title\` TINYINT NOT NULL DEFAULT 1,
            \`post_referenced_media\` VARCHAR(2048) NOT NULL DEFAULT '',
            \`post_created_on\` TIMESTAMP NOT NULL DEFAULT NOW(),
            PRIMARY KEY (\`id\`));
    `)
    await knex.raw(`
        CREATE TABLE \`comments\` (
            \`id\` BIGINT NOT NULL AUTO_INCREMENT,
            \`comment_post\` BIGINT NOT NULL,
            \`comment_parent\` BIGINT,
            \`comment_author\` BIGINT NOT NULL,
            \`comment_content\` VARCHAR(2048) NOT NULL,
            \`comment_mood\` INT NOT NULL DEFAULT 0,
            \`comment_created_on\` TIMESTAMP NOT NULL DEFAULT NOW(),
            PRIMARY KEY (\`id\`));
    `)
    await knex.raw(`
        CREATE TABLE \`media\` (
            \`id\` BIGINT NOT NULL AUTO_INCREMENT,
            \`media_uploader\` BIGINT NOT NULL,
            \`media_title\` VARCHAR(256) NOT NULL,
            \`media_filename\` VARCHAR(256) NOT NULL,
            \`media_mime\` VARCHAR(129) NOT NULL,
            \`media_key\` VARCHAR(256) NOT NULL,
            \`media_thumbnail_key\` VARCHAR(256),
            \`media_tags\` VARCHAR(2048) NOT NULL DEFAULT '',
            \`media_booru_visible\` TINYINT NOT NULL DEFAULT 1,
            \`media_thumbnail_key\` VARCHAR(256) DEFAULT NULL,
            \`media_size\` BIGINT NOT NULL,
            \`media_hash\` TEXT NOT NULL,
            \`media_comment\` VARCHAR(2048) DEFAULT NULL,
            \`media_created_on\` TIMESTAMP NOT NULL DEFAULT NOW(),
            PRIMARY KEY (\`id\`));
    `)
    await knex.raw(`
        CREATE TABLE \`collections\` (
            \`id\` INT NOT NULL AUTO_INCREMENT,
            \`collection_title\` VARCHAR(256) NULL,
            \`collection_comment\` VARCHAR(2048) NULL,
            \`collection_creator\` BIGINT NOT NULL,
            \`collection_created_on\` TIMESTAMP NOT NULL DEFAULT NOW(),
            PRIMARY KEY (\`id\`));
    `)
    await knex.raw(`
        CREATE TABLE ``collectionitems\` (
            \`id\` BIGINT NOT NULL AUTO_INCREMENT,
            \`item_collection\` INT NOT NULL,
            \`item_media\` BIGINT NOT NULL,
            \`item_creator\` BIGINT NOT NULL,
            \`item_created_on\` TIMESTAMP NOT NULL DEFAULT NOW(),
            PRIMARY KEY (\`id\`));
    `)
    await knex.raw(`
        CREATE TABLE \`harukaze\`.\`moods\` (
            \`id\` INT NOT NULL AUTO_INCREMENT,
            \`mood_name\` VARCHAR(256) NOT NULL,
            \`mood_key\` VARCHAR(256) NOT NULL,
            \`mood_creator\` VARCHAR(45) NOT NULL,
            \`mood_created_on\` TIMESTAMP NOT NULL DEFAULT NOW(),
            PRIMARY KEY (\`id\`));
    `)
};

exports.down = async function(knex) {
    await knex.schema.dropTable('users')
    await knex.schema.dropTable('userlogins')
    await knex.schema.dropTable('ipbans')
    await knex.schema.dropTable('posts')
    await knex.schema.dropTable('comments')
    await knex.schema.dropTable('media')
};
