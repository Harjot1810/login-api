require('dotenv').config();

config = {
    production: {
        SECRET: process.env.SECRET,
        DATABASE: process.env.MONGODB_URI
    },
    default: {
        SECRET: 'mysecretkey',
        DATABASE: process.env.database
    }
}


exports.get = function get(env) {
    return config[env] || config.default
}