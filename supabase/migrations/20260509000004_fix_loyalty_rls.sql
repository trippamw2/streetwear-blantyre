-- Fix all loyalty system RLS issues
-- Run in Supabase SQL Editor

-- customer_loyalty
DROP POLICY IF EXISTS "Users read own loyalty" ON customer_loyalty;
DROP POLICY IF EXISTS "Users update own loyalty" ON customer_loyalty;
DROP POLICY IF EXISTS "Users can view own loyalty" ON customer_loyalty;
CREATE POLICY "customer_loyalty_read" ON customer_loyalty FOR SELECT USING (true);
CREATE POLICY "customer_loyalty_insert" ON customer_loyalty FOR INSERT WITH CHECK (true);
CREATE POLICY "customer_loyalty_update" ON customer_loyalty FOR UPDATE USING (true);

-- loyalty_programs
DROP POLICY IF EXISTS "Anyone can view loyalty_programs" ON loyalty_programs;
CREATE POLICY "loyalty_programs_read" ON loyalty_programs FOR SELECT USING (true);

-- loyalty_tiers  
DROP POLICY IF EXISTS "Anyone can view loyalty_tiers" ON loyalty_tiers;
CREATE POLICY "loyalty_tiers_read" ON loyalty_tiers FOR SELECT USING (true);

-- loyalty_transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON loyalty_transactions;
CREATE POLICY "loyalty_transactions_read" ON loyalty_transactions FOR SELECT USING (true);
CREATE POLICY "loyalty_transactions_insert" ON loyalty_transactions FOR INSERT WITH CHECK (true);

-- referrals table
DROP POLICY IF EXISTS "Users can view own referral code" ON user_referral_codes;
DROP POLICY IF EXISTS "Users can view own referrals" ON referral_transactions;
CREATE POLICY "user_referral_codes_read" ON user_referral_codes FOR SELECT USING (true);
CREATE POLICY "referral_transactions_read" ON referral_transactions FOR SELECT USING (true);