# Example:
const crypto = require('crypto');
function hashLog(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}
module.exports = { hashLog };
