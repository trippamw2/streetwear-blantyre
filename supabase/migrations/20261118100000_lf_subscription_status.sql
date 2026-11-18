-- Lake Fresh: let the static storefront check a manual payment without a
-- serverless API route. The function only reports status for the LF brand and
-- the exact reference saved in the browser session.

begin;

create or replace function public.lf_public_subscription_status(
  p_subscription_id uuid,
  p_tx_ref text
)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select case
        when subscription_row.status = 'active' then 'paid'
        when latest_event.outcome in (
          'payment_failed',
          'amount_mismatch',
          'currency_mismatch',
          'subscription_not_found'
        ) then 'failed'
        else 'pending'
      end
      from public.lf_subscriptions as subscription_row
      left join lateral (
        select event_row.outcome
        from public.payment_events as event_row
        where event_row.tx_ref = p_tx_ref
        order by event_row.created_at desc
        limit 1
      ) as latest_event on true
      where subscription_row.id = p_subscription_id
        and subscription_row.brand_id = '22222222-2222-2222-2222-222222222222'::uuid
        and subscription_row.payment_reference = p_tx_ref
      limit 1
    ),
    'failed'
  );
$$;

revoke all on function public.lf_public_subscription_status(uuid, text) from public;
grant execute on function public.lf_public_subscription_status(uuid, text) to anon, authenticated;

commit;
