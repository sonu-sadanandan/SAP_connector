require('dotenv').config();

const auth = Buffer.from(`${process.env.USERNAME}:${process.env.PASSWORD}`).toString('base64');

module.exports = { auth };