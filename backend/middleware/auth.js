exports.authenticate = (req, res, next) => {
  // Mock authentication for now
  req.user = { id: '1', role: 'patient' };
  next();
};
