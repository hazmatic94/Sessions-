-- Shop data the app already collects.
-- Login lives in Supabase Auth. These tables are the shop, its team, and its bookings.

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  website text,
  team_size text not null check (team_size in ('just-me', '2-5', '6-10', '11+')),
  address text,
  mobile_only boolean not null default false,
  lat double precision,
  lon double precision,
  created_at timestamptz not null default now(),
  constraint businesses_address check (mobile_only or address is not null),
  constraint businesses_point check ((lat is null) = (lon is null))
);

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  email text,
  phone text,
  role text not null default 'Workspace Owner' check (role in ('Workspace Owner', 'No Access')),
  created_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  description text not null default '',
  duration_minutes integer not null check (duration_minutes > 0),
  price_type text not null default 'fixed' check (price_type in ('fixed', 'from', 'free')),
  price_cents integer not null default 0 check (price_cents >= 0),
  created_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  staff_id uuid references public.staff (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  customer_name text not null,
  walk_in boolean not null default false,
  starts_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes > 0),
  status text not null default 'booked' check (status in ('booked', 'cancelled')),
  created_at timestamptz not null default now()
);

create table public.appointment_services (
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  service_id uuid references public.services (id) on delete set null,
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price_type text not null check (price_type in ('fixed', 'from', 'free')),
  price_cents integer not null default 0 check (price_cents >= 0),
  position integer not null default 0 check (position >= 0),
  primary key (appointment_id, position)
);

create table public.blocked_times (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  staff_id uuid references public.staff (id) on delete cascade,
  starts_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes > 0),
  title text not null default '',
  created_at timestamptz not null default now()
);

create index businesses_owner_id_idx on public.businesses (owner_id);
create index staff_business_id_idx on public.staff (business_id);
create index staff_user_id_idx on public.staff (user_id);
create index clients_business_id_idx on public.clients (business_id);
create index services_business_id_idx on public.services (business_id);
create index appointments_business_starts_idx on public.appointments (business_id, starts_at);
create index blocked_times_business_starts_idx on public.blocked_times (business_id, starts_at);

create function public.can_access_business(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.businesses
    where id = target
      and owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.staff
    where business_id = target
      and user_id = auth.uid()
      and role <> 'No Access'
  );
$$;

create function public.create_shop(
  shop_name text,
  shop_website text,
  shop_team_size text,
  shop_address text,
  shop_mobile_only boolean,
  shop_lat double precision,
  shop_lon double precision
)
returns public.businesses
language plpgsql
security definer
set search_path = public
as $$
declare
  shop public.businesses;
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;

  insert into public.businesses (
    owner_id, name, website, team_size, address, mobile_only, lat, lon
  )
  values (
    auth.uid(),
    shop_name,
    nullif(btrim(shop_website), ''),
    shop_team_size,
    case when shop_mobile_only then null else nullif(btrim(shop_address), '') end,
    coalesce(shop_mobile_only, false),
    case when shop_mobile_only then null else shop_lat end,
    case when shop_mobile_only then null else shop_lon end
  )
  returning * into shop;

  insert into public.staff (business_id, user_id, name, email, role)
  values (shop.id, auth.uid(), shop.name, auth.jwt() ->> 'email', 'Workspace Owner');

  return shop;
end;
$$;

revoke all on function public.can_access_business(uuid) from public, anon;
revoke all on function public.create_shop(text, text, text, text, boolean, double precision, double precision) from public, anon;
grant execute on function public.can_access_business(uuid) to authenticated;
grant execute on function public.create_shop(text, text, text, text, boolean, double precision, double precision) to authenticated;

alter table public.businesses enable row level security;
alter table public.staff enable row level security;
alter table public.clients enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_services enable row level security;
alter table public.blocked_times enable row level security;

create policy "members read businesses"
  on public.businesses for select
  to authenticated
  using (public.can_access_business(id));

create policy "owners insert businesses"
  on public.businesses for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "owners update businesses"
  on public.businesses for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "owners delete businesses"
  on public.businesses for delete
  to authenticated
  using (owner_id = auth.uid());

create policy "members read staff"
  on public.staff for select
  to authenticated
  using (public.can_access_business(business_id));

create policy "owners manage staff"
  on public.staff for all
  to authenticated
  using (
    exists (
      select 1 from public.businesses
      where id = business_id and owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses
      where id = business_id and owner_id = auth.uid()
    )
  );

create policy "members manage clients"
  on public.clients for all
  to authenticated
  using (public.can_access_business(business_id))
  with check (public.can_access_business(business_id));

create policy "members manage services"
  on public.services for all
  to authenticated
  using (public.can_access_business(business_id))
  with check (public.can_access_business(business_id));

create policy "members manage appointments"
  on public.appointments for all
  to authenticated
  using (public.can_access_business(business_id))
  with check (public.can_access_business(business_id));

create policy "members manage appointment services"
  on public.appointment_services for all
  to authenticated
  using (
    exists (
      select 1 from public.appointments
      where id = appointment_id and public.can_access_business(business_id)
    )
  )
  with check (
    exists (
      select 1 from public.appointments
      where id = appointment_id and public.can_access_business(business_id)
    )
  );

create policy "members manage blocked time"
  on public.blocked_times for all
  to authenticated
  using (public.can_access_business(business_id))
  with check (public.can_access_business(business_id));
