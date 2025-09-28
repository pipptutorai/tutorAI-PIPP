import express from 'express';
import { supabase } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, full_name')
      .eq('id', data.user.id)
      .single();
    
    res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        role: profile?.role || 'user',
        full_name: profile?.full_name
      },
      session: data.session
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, role = 'user' } = req.body;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role: role === 'admin' ? 'user' : role // Prevent self-admin registration
        }
      }
    });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json({
      message: 'Registration successful. Please check your email for verification.',
      user: data.user
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Get current user profile
router.get('/me', requireAuth(), async (req, res) => {
  res.json({ user: req.user });
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;