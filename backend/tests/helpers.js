const jwt = require('jsonwebtoken');

const makeToken = (id = 'user123') =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });

// Makes the auth middleware resolve `user` for a token created by makeToken().
const loginAs = (User, user) => {
  User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
  return `Bearer ${makeToken(String(user._id))}`;
};

const employer = { _id: 'emp1', role: 'employer', name: 'Eve Employer' };
const applicant = { _id: 'app1', role: 'applicant', name: 'Alex Applicant' };

module.exports = { makeToken, loginAs, employer, applicant };
