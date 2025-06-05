// CRM trigger configuration
module.exports = {
  churnAlert: {
    condition: "last_login > NOW() - INTERVAL '30 days'",

    action: "sendRetentionMessage"
  }
};
