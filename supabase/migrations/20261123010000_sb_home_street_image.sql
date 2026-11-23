-- Use the supplied Blue Streetwear Squad image in the SB Street homepage
-- campaign slot above the footer. Brand-scoped to SB and safe to re-run.

update public.sb_campaigns
set hero_image = '/images/sb/home-street.jpg'
where brand_id = '11111111-1111-1111-1111-111111111111'::uuid
  and slug = 'sb-street';

update public.sb_editorial_placements
set image_override = '/images/sb/home-street.jpg'
where brand_id = '11111111-1111-1111-1111-111111111111'::uuid
  and section_key = 'sb_street';
