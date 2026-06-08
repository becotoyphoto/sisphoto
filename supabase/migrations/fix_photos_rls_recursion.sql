drop policy if exists "Users can access original photos they purchased" on public.photos;

create or replace function public.user_has_paid_order_for_photo(_photo_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.order_items oi
    join public.orders o
      on o.id = oi.order_id
    where oi.photo_id = _photo_id
      and o.user_id = auth.uid()
      and o.status = 'paid'
  );
$$;

create policy "Users can access original photos they purchased"
on public.photos
for select
using (
  public.user_has_paid_order_for_photo(id)
);
