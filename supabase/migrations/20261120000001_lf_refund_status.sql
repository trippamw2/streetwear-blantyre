-- Add the refund state to the order status enum.
-- Apply after 20261120000000_lf_hardening.sql
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'order_status' and e.enumlabel = 'refunded'
  ) then
    alter type public.order_status add value 'refunded';
  end if;
end $$;
