-- ---------------------------------------------------------------------------
-- Let a customer create their own empty rewards row.
--
-- Communications and the rewards screen need an email address per brand. The
-- database cannot read auth.users from a SECURITY DEFINER function that is
-- called with the service role, so the customer creates the zero balance row
-- once and every future credit updates it. The CHECK below guarantees a client
-- can only ever create a row with no points, so this cannot be used to mint a
-- balance.
-- ---------------------------------------------------------------------------

drop policy if exists "Users can create own loyalty" on public.customer_loyalty;

create policy "Users can create own loyalty"
on public.customer_loyalty
for insert
to authenticated
with check (
  auth.uid() = user_id
  and coalesce(available_points, 0) = 0
  and coalesce(total_points, 0) = 0
  and coalesce(redeemed_points, 0) = 0
);
