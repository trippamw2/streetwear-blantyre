-- Stage 5 fix: let Lake Fresh customers read their own preparation and
-- reconciliation rows. Admin policies already exist; these are additive and
-- scoped through the owning order, so no cross-customer or cross-brand leak.

drop policy if exists order_preparation_customer_read on public.order_preparation;
create policy order_preparation_customer_read on public.order_preparation
  for select using (
    exists (
      select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = order_preparation.order_item_id
        and o.user_id = auth.uid()
    )
  );

drop policy if exists price_reconciliation_customer_read on public.price_reconciliation;
create policy price_reconciliation_customer_read on public.price_reconciliation
  for select using (
    exists (
      select 1
      from public.orders o
      where o.id = price_reconciliation.order_id
        and o.user_id = auth.uid()
    )
  );
