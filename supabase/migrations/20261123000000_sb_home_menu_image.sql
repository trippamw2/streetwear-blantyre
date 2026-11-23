-- Use the supplied Urban Blue Style Duo image for the SB homepage hero/menu slot.
-- Brand-scoped to SB and safe to re-run.

update public.sb_campaigns
set hero_image = '/images/sb/home-menu.jpg'
where brand_id = '11111111-1111-1111-1111-111111111111'::uuid
  and slug = 'wear-what-speaks';

update public.sb_editorial_placements
set image_override = '/images/sb/home-menu.jpg'
where brand_id = '11111111-1111-1111-1111-111111111111'::uuid
  and section_key = 'home_hero';
