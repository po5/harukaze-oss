# cms

The CMS repository. The main part of the service. Requires a core server to operate.

# Dependencies
 - Node.js 16+
 - Yarn
 - PostgreSQL
 - Harukaze Core server

# Setup
To install Node dependencies, run `yarn install`.
Copy `config.example.json` to `config.json` and modify it to reflect the installation.

To start the development server, run `yarn start`. To build a JavaScript distribution, run `yarn build`.

MySQL mode `ONLY_FULL_GROUP_BY` must be disabled for some admin functionality to work.

# Integration with szurubooru
If you want to use szurubooru instead of the built-in booru, you can switch `enable` to `true` in the `szurubooru` section of `config.json`.

In the same section, you will need to supply credentials for an administrator, either using password or a token.
When szurubooru is enabled, the site will sync users that have signed in or registered since it was enabled between the booru and Harukaze.
