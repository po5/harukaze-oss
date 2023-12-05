/**
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
exports.up = async function (knex) {
    const sql = `
    create index comments_comment_post_index
        on comments (comment_post);

    alter table comments
        add constraint comments_comments_id_fk
            foreign key (comment_parent) references comments (id)
                on delete cascade;
    
    alter table comments
        modify comment_mood int null;
    
    update comments set comment_mood = null where (select not exists(select 1 from moods where moods.id = comment_mood));

    alter table comments
        add constraint comments_moods_id_fk
            foreign key (comment_mood) references moods (id)
                on delete set null;
    
    alter table moods
        add constraint moods_moodchars_id_fk
            foreign key (mood_character) references moodchars (id);
    `

    for (const stmt of sql.split(';'))
        if (stmt.trim())
            await knex.raw(stmt)
}

/**
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
exports.down = async function (knex) {
    const sql = `
    drop index if exists comments_comment_post_index on comments;

    alter table comments
        drop foreign key if exists comments_comments_id_fk;
    
    alter table comments
        drop foreign key if exists comments_moods_id_fk;
    
    drop index if exists comments_moods_id_fk on comments;
    
    update comments set comment_mood = 0 where comment_mood is null;
    
    alter table comments
        modify comment_mood int default 0 not null;
    
    alter table moods
        drop foreign key if exists moods_moodchars_id_fk;
    
    drop index if exists moods_moodchars_id_fk on moods;
    `

    for (const stmt of sql.split(';'))
        if (stmt.trim())
            await knex.raw(stmt)
}
