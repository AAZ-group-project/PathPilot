const localStrategy = require('passport-local').Strategy;
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

function initialize(passport) {
    const authenticateUser = async (email, password, done) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .limit(1);

            if (error) return done(error);
            if (!data || data.length === 0) {
                return done(null, false, { message: "Email address is not registered" });
            }

            const user = data[0];
            const isMatch = await bcrypt.compare(password, user.password);

            if (isMatch) {
                return done(null, user);
            } else {
                return done(null, false, { message: "Password is incorrect" });
            }
        } catch (err) {
            return done(err);
        }
    };

    passport.use(new localStrategy(
        { usernameField: 'email', passwordField: 'password' },
        authenticateUser
    ));

    passport.serializeUser((user, done) => done(null, user.id));

    passport.deserializeUser(async (id, done) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .limit(1);

            if (error) return done(error);
            return done(null, data && data[0] ? data[0] : null);
        } catch (err) {
            return done(err);
        }
    });
}

module.exports = initialize;