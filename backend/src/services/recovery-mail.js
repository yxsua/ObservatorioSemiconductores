// Connect the future mail provider here. Never log or return recovery links.
// enabled must become true only when credentials, sender and delivery are ready.
module.exports = {
 enabled: false,
 async sendPasswordReset({to, url, expiresInMinutes}) {
  void to; void url; void expiresInMinutes;
  throw new Error('Recovery mail provider is not configured');
 }
};
