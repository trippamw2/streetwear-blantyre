-- Referral System for PowerPod Store
-- Create referral codes for users to share

-- Table: user_referral_codes
-- Each user gets a unique referral code
CREATE TABLE IF NOT EXISTS user_referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code VARCHAR(12) UNIQUE NOT NULL,
  rewards_points INTEGER DEFAULT 500,
  rewards_redeemed INTEGER DEFAULT 0,
  max_referrals INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: referral_transactions
-- Track successful referrals
CREATE TABLE IF NOT EXISTS referral_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referral_code VARCHAR(12) NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  referee_reward INTEGER DEFAULT 200,
  referrer_reward INTEGER DEFAULT 500,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: referral_rewards_history
-- Track rewards given
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_id UUID REFERENCES referral_transactions(id) ON DELETE SET NULL,
  reward_type TEXT NOT NULL,
  reward_points INTEGER NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON user_referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referrer ON referral_transactions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referee ON referral_transactions(referee_id);

-- Enable RLS
ALTER TABLE user_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own referral code" ON user_referral_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own referral code" ON user_referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own referral code" ON user_referral_codes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own referrals" ON referral_transactions FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  existing_count INTEGER;
BEGIN
  LOOP
    SELECT UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)) INTO code;
    SELECT COUNT(*) INTO existing_count FROM user_referral_codes WHERE code = code;
    IF existing_count = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create referral code for new user
CREATE OR REPLACE FUNCTION create_user_referral_code(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  code := generate_referral_code(user_id);
  INSERT INTO user_referral_codes (user_id, code) VALUES (user_id, code);
  RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add referral rewards after order complete
CREATE OR REPLACE FUNCTION add_referral_rewards(transaction_id UUID)
RETURNS VOID AS $$
DECLARE
  t referral_transactions%ROWTYPE;
  referrer user_referral_codes%ROWTYPE;
BEGIN
  SELECT * INTO t FROM referral_transactions WHERE id = transaction_id;
  IF t.status != 'completed' THEN RETURN; END IF;
  
  SELECT * INTO referrer FROM user_referral_codes WHERE user_id = t.referrer_id;
  IF referrer IS NULL THEN RETURN; END IF;
  
  UPDATE user_referral_codes 
  SET rewards_redeemed = rewards_redeemed + t.referrer_reward,
      updated_at = NOW()
  WHERE user_id = t.referrer_id;
  
  INSERT INTO referral_rewards (user_id, transaction_id, reward_type, reward_points)
  VALUES (t.referrer_id, transaction_id, 'referral', t.referrer_reward);
  
  IF t.referee_id IS NOT NULL THEN
    INSERT INTO referral_rewards (user_id, transaction_id, reward_type, reward_points)
    VALUES (t.referee_id, transaction_id, 'signup', t.referee_reward);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;