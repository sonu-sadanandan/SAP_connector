require('dotenv').config();

const auth = Buffer.from(`${process.env.USER_NAME}:${process.env.PASSWORD}`).toString('base64');

module.exports = { auth };