const spicedPg = require("spiced-pg");
// const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");
const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/petition"
);

module.exports.registerUser = (
    first_name,
    last_name,
    email_address,
    password_hash
) => {
    // TO PREVENT AN SQL INJECTION (-> Params):
    const q = `
        INSERT INTO users (first_name, last_name, email_address, password_hash)
        VALUES ($1, $2, $3, $4) RETURNING id
    `;
    const params = [first_name, last_name, email_address, password_hash];
    return db.query(q, params);
};

module.exports.findUser = (email_address) => {
    return db.query(`SELECT * FROM users WHERE email_address = $1`, [
        email_address,
    ]);
};

module.exports.createSignerProfile = (user_id, age, city, url) => {
    // TO PREVENT AN SQL INJECTION (-> Params):
    const q = `
    INSERT INTO user_profiles (user_id, age, city, url)
    VALUES ($1, $2, $3, $4)
    `;
    const params = [user_id, age || null, city || null, url || null];
    return db.query(q, params);
};

module.exports.getSignerInfosToEdit = (user_id) => {
    const q = `SELECT first_name, last_name, email_address, password_hash, age, city, url FROM users JOIN user_profiles ON user_profiles.user_id = users.id WHERE users.id = $1`;
    const params = [user_id];
    return db.query(q, params);
};

module.exports.updateUsersMainInfos = (
    first_name,
    last_name,
    email_address,
    user_id
) => {
    const q = `UPDATE users SET first_name = $1, last_name = $2, email_address = $3 WHERE id = $4`;
    const params = [first_name, last_name, email_address, user_id];
    return db.query(q, params);
};

module.exports.updateUsersPassword = (password_hash, user_id) => {
    const q = `UPDATE users SET password_hash = $1 WHERE id = $2`;
    const params = [password_hash, user_id];
    return db.query(q, params);
};

module.exports.updateUsersProfile = (age, city, url, user_id) => {
    const q = `INSERT INTO user_profiles (age, city, url, user_Id) VALUES ($1, $2, $3, $4) ON CONFLICT (user_Id) DO UPDATE SET age = $1, city = $2, url = $3`;
    const params = [age || null, city || null, url || null, user_id];
    return db.query(q, params);
};

module.exports.signPetition = (user_id, signature) => {
    // TO PREVENT AN SQL INJECTION (-> Params):
    const q = `
        INSERT INTO signatures (user_id, signature)
        VALUES ($1, $2) RETURNING id
    `;
    const params = [user_id, signature];
    return db.query(q, params);
};

module.exports.getSignersNames = function () {
    return db.query(
        `SELECT first_name, last_name, age, city, url FROM signatures INNER JOIN users ON signatures.user_id = users.id INNER JOIN user_profiles ON user_profiles.user_id = users.id`
    );
};

module.exports.getSignersNamesByCity = (city) => {
    const q = `SELECT first_name, last_name, age, city, url FROM signatures INNER JOIN users ON signatures.user_id = users.id INNER JOIN user_profiles ON user_profiles.user_id = users.id WHERE LOWER(city) = LOWER($1)`;
    const params = [city];
    return db.query(q, params);
};

// version that works for logins:
// module.exports.getSignature = (signatureId) => {
//     return db.query(
//         `SELECT signature FROM signatures WHERE user_id = ${signatureId}`
//     );
// };

// version that works for deleting/changing signature when logged in:
// module.exports.getSignature = (signatureId) => {
//     return db.query(
//         `SELECT signature FROM signatures WHERE id = ${signatureId}`
//     );
// };

// trial 3:
module.exports.getSignature = (user_id) => {
    return db.query(
        `SELECT signature FROM signatures WHERE user_id = ${user_id}`
    );
};

// To check if there is a signature for the user_id:
module.exports.findSignature = (user_id) => {
    return db.query(`SELECT * FROM signatures WHERE user_id = $1`, [user_id]);
};

module.exports.deleteSignature = (user_id) => {
    return db.query(
        `
            DELETE FROM signatures
            WHERE user_id = $1
        `,
        [user_id]
    );
};
