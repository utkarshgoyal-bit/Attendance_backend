const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Generate JWT
const generateToken = (user, remember = false) => {
  return jwt.sign(
    { id: user._id, role: user.role, orgId: user.orgId, tokenVersion: user.tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: remember ? process.env.JWT_REMEMBER_EXPIRE : process.env.JWT_EXPIRE }
  );
};

// Security Questions List
const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What city were you born in?",
  "What was your childhood nickname?",
  "What is the name of your favorite childhood friend?",
  "What was the make of your first car?",
  "What school did you attend for sixth grade?",
];

// GET Security Questions List
router.get('/security-questions', (req, res) => {
  res.json(SECURITY_QUESTIONS);
});

// POST Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, remember } = req.body;
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.isActive) return res.status(400).json({ message: 'Account is deactivated' });
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    const token = generateToken(user, remember);
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });
    
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
        isFirstLogin: user.isFirstLogin,
        hasSecurityQuestions: user.securityQuestions?.length >= 2
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Logout
router.post('/logout', auth, (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// POST Logout all devices (increment token version)
router.post('/logout-all', auth, async (req, res) => {
  try {
    req.user.tokenVersion += 1;
    await req.user.save();
    res.clearCookie('token');
    res.json({ message: 'Logged out from all devices' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET Current User
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('orgId', 'name logo');
    res.json({
      id: user._id,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
      isFirstLogin: user.isFirstLogin,
      hasSecurityQuestions: user.securityQuestions?.length >= 2
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Change Password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
    
    user.password = newPassword;
    user.isFirstLogin = false;
    user.tokenVersion += 1; // Invalidate all other sessions
    await user.save();
    
    const token = generateToken(user);
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    
    res.json({ message: 'Password changed successfully', token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Set Security Questions
router.post('/security-questions', auth, async (req, res) => {
  try {
    const { questions } = req.body; // [{ question, answer }, { question, answer }]
    
    if (!questions || questions.length < 2) {
      return res.status(400).json({ message: 'At least 2 security questions required' });
    }
    
    const hashedQuestions = await Promise.all(
      questions.map(async (q) => ({
        question: q.question,
        answer: await User.hashAnswer(q.answer)
      }))
    );
    
    req.user.securityQuestions = hashedQuestions;
    req.user.isFirstLogin = false;
    await req.user.save();
    
    res.json({ message: 'Security questions set successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Verify Security Questions (for password reset)
router.post('/verify-security', async (req, res) => {
  try {
    const { email, answers } = req.body; // answers: [{ index, answer }]
    
    const user = await User.findOne({ email });
    if (!user || !user.securityQuestions?.length) {
      return res.status(400).json({ message: 'Invalid email or no security questions set' });
    }
    
    let correct = 0;
    for (const a of answers) {
      const isCorrect = await user.compareAnswer(a.index, a.answer);
      if (isCorrect) correct++;
    }
    
    if (correct < 2) {
      return res.status(400).json({ message: 'Security answers incorrect' });
    }
    
    // Generate reset token (short lived)
    const resetToken = jwt.sign({ id: user._id, reset: true }, process.env.JWT_SECRET, { expiresIn: '15m' });
    
    res.json({ resetToken, message: 'Verified successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Reset Password (after security verification)
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    if (!decoded.reset) return res.status(400).json({ message: 'Invalid reset token' });
    
    const user = await User.findById(decoded.id);
    if (!user) return res.status(400).json({ message: 'User not found' });
    
    user.password = newPassword;
    user.tokenVersion += 1;
    await user.save();
    
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid or expired reset token' });
  }
});

module.exports = router;
