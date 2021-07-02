const config = {
    production: {
        SECRET: process.env.SECRET,
        DATABASE: process.env.MONGODB_URI
    },
    default: {
        SECRET: 'mysecretkey',
        DATABASE: 'mongodb+srv://Harjot1810:Harjot@1@cluster0.v8ruy.mongodb.net/AuthData?retryWrites=true&w=majority'
    }
}


exports.get = function get(env) {
    return config[env] || config.default
}