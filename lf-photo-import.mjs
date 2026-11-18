import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const LF_BRAND = "22222222-2222-2222-2222-222222222222";
const BUCKET = "product-images";
const TMP = path.join(process.cwd(), ".lf-photo-import");
const RAW = path.join(TMP, "raw");
const OUT = path.join(TMP, "out");
fs.mkdirSync(RAW, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const C = {
  "by-sa-4": "https://creativecommons.org/licenses/by-sa/4.0/",
  "by-sa-3": "https://creativecommons.org/licenses/by-sa/3.0/",
  "by-sa-2": "https://creativecommons.org/licenses/by-sa/2.0/",
  "by-4": "https://creativecommons.org/licenses/by/4.0/",
  "by-2": "https://creativecommons.org/licenses/by/2.0/",
  zero: "https://creativecommons.org/publicdomain/zero/1.0/",
  pd: "https://commons.wikimedia.org/wiki/Commons:Public_domain",
};

const credits = [
  {
    id: "chambo-market",
    group: "Catch",
    label: "Chambo at Blantyre market",
    creator: "Michaelphoya",
    license: "Creative Commons Attribution Share Alike 4.0",
    licenseUrl: C["by-sa-4"],
    source: "https://commons.wikimedia.org/wiki/File:Chambo_(tilapia)_fish,_Blantyre_market,_Malawi.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/8/86/Chambo_%28tilapia%29_fish%2C_Blantyre_market%2C_Malawi.jpg",
  },
  {
    id: "chambo-malawi",
    group: "Catch",
    label: "Malawi chambo",
    creator: "Peter Lungile Chidothe",
    license: "Creative Commons Attribution Share Alike 4.0",
    licenseUrl: C["by-sa-4"],
    source: "https://commons.wikimedia.org/wiki/File:Malawi%27s_Chambo.JPG",
    file: "https://upload.wikimedia.org/wikipedia/commons/d/d7/Malawi%27s_Chambo.JPG",
  },
  {
    id: "fresh-fish-zomba",
    group: "Catch",
    label: "Fresh fish in Zomba",
    creator: "Michaelphoya",
    license: "Creative Commons Attribution Share Alike 4.0",
    licenseUrl: C["by-sa-4"],
    source: "https://commons.wikimedia.org/wiki/File:Fresh_fish,_Zomba,_Malawi.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/2/27/Fresh_fish%2C_Zomba%2C_Malawi.jpg",
  },
  {
    id: "tilapia-fda-352",
    group: "Catch",
    label: "Nile tilapia specimen",
    creator: "The U.S. Food and Drug Administration",
    license: "Public domain",
    licenseUrl: C.pd,
    source: "https://commons.wikimedia.org/wiki/File:Oreochromis_niloticus_(RFEIMG-0352).jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/6/66/Oreochromis_niloticus_%28RFEIMG-0352%29.jpg",
  },
  {
    id: "tilapia-fda-354",
    group: "Catch",
    label: "Nile tilapia specimen detail",
    creator: "The U.S. Food and Drug Administration",
    license: "Public domain",
    licenseUrl: C.pd,
    source: "https://commons.wikimedia.org/wiki/File:Oreochromis_niloticus_(RFEIMG-0354).jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/9/98/Oreochromis_niloticus_%28RFEIMG-0354%29.jpg",
  },
  {
    id: "tilapia-usfws",
    group: "Catch",
    label: "Tilapia specimen",
    creator: "Raver Duane, U.S. Fish and Wildlife Service",
    license: "Public domain",
    licenseUrl: C.pd,
    source: "https://commons.wikimedia.org/wiki/File:Tilapia_oreochromis_niloticus_fish.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/5/57/Tilapia_oreochromis_niloticus_fish.jpg",
  },
  {
    id: "tilapia-flower",
    group: "Catch",
    label: "Nile tilapia study",
    creator: "W H Flower",
    license: "Public domain",
    licenseUrl: C.pd,
    source: "https://commons.wikimedia.org/wiki/File:ChromisNiloticus.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/2/2b/ChromisNiloticus.jpg",
  },
  {
    id: "tilapia-ice",
    group: "Catch",
    label: "Fish packed in ice",
    creator: "Wolf Dieter",
    license: "Public domain",
    licenseUrl: C.pd,
    source: "https://commons.wikimedia.org/wiki/File:Fish_food_Udonthani_WD2.JPG",
    file: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Fish_food_Udonthani_WD2.JPG",
  },
  {
    id: "mossambicus-fda",
    group: "Catch",
    label: "Mozambique tilapia specimen",
    creator: "The U.S. Food and Drug Administration",
    license: "Public domain",
    licenseUrl: C.pd,
    source: "https://commons.wikimedia.org/wiki/File:Oreochromis_mossambicus_(RFEIMG-0308).jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/a/af/Oreochromis_mossambicus_%28RFEIMG-0308%29.jpg",
  },
  {
    id: "rhamphochromis-likoma",
    group: "Catch",
    label: "Rhamphochromis at Likoma Island",
    creator: "Alexandra Tyers",
    license: "Creative Commons Attribution Share Alike 2.0",
    licenseUrl: C["by-sa-2"],
    source: "https://commons.wikimedia.org/wiki/File:%22ncheni%22_(Rhamphochromis).jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/9/9b/%22ncheni%22_%28Rhamphochromis%29.jpg",
  },
  {
    id: "rhamphochromis-chilingali",
    group: "Catch",
    label: "Rhamphochromis from Chilingali",
    creator: "Alexandra Tyers",
    license: "Creative Commons Attribution Share Alike 2.0",
    licenseUrl: C["by-sa-2"],
    source: "https://commons.wikimedia.org/wiki/File:Rhamphochromis_sp._%22Chilingali%22.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/d/d9/Rhamphochromis_sp._%22Chilingali%22.jpg",
  },
  {
    id: "rhamphochromis-esox",
    group: "Catch",
    label: "Rhamphochromis esox study",
    creator: "George Albert Boulenger",
    license: "Public domain",
    licenseUrl: C.pd,
    source: "https://commons.wikimedia.org/wiki/File:Rhamphochromis_esox.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/7/74/Rhamphochromis_esox.jpg",
  },
  {
    id: "rhamphochromis-longiceps",
    group: "Catch",
    label: "Rhamphochromis longiceps study",
    creator: "George Albert Boulenger",
    license: "Public domain",
    licenseUrl: C.pd,
    source: "https://commons.wikimedia.org/wiki/File:Rhamphochromis_longiceps.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Rhamphochromis_longiceps.jpg",
  },
  {
    id: "rhamphochromis-macrophthalmus",
    group: "Catch",
    label: "Rhamphochromis macrophthalmus study",
    creator: "Charles Tate Regan",
    license: "Public domain",
    licenseUrl: C.pd,
    source: "https://commons.wikimedia.org/wiki/File:Rhamphochromis_macrophthalmus.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Rhamphochromis_macrophthalmus.jpg",
  },
  {
    id: "usipa-pao",
    group: "Catch",
    label: "Usipa and pao",
    creator: "TimCowley",
    license: "Creative Commons Attribution Share Alike 4.0",
    licenseUrl: C["by-sa-4"],
    source: "https://commons.wikimedia.org/wiki/File:Usipa_and_Pao.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/8/87/Usipa_and_Pao.jpg",
  },
  {
    id: "usipa-ugali",
    group: "Catch",
    label: "Usipa with ugali",
    creator: "TimCowley",
    license: "Creative Commons Attribution Share Alike 4.0",
    licenseUrl: C["by-sa-4"],
    source: "https://commons.wikimedia.org/wiki/File:Yawo_food_staples_-_ugali_and_usipa.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Yawo_food_staples_-_ugali_and_usipa.jpg",
  },
  {
    id: "usipa-nonhla",
    group: "Catch",
    label: "Usipa dish",
    creator: "Thomas Taimu",
    license: "Creative Commons Attribution Share Alike 4.0",
    licenseUrl: C["by-sa-4"],
    source: "https://commons.wikimedia.org/wiki/File:Nonhla_special_usipa.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/7/78/Nonhla_special_usipa.jpg",
  },
  {
    id: "lake-malawi-drying",
    group: "Catch",
    label: "Fish drying at Lake Malawi",
    creator: "Gigi sorrentino",
    license: "Creative Commons Attribution Share Alike 4.0",
    licenseUrl: C["by-sa-4"],
    source: "https://commons.wikimedia.org/wiki/File:Pesce_ad_essiccare_sulla_riva_del_lago_malawi.JPG",
    file: "https://upload.wikimedia.org/wikipedia/commons/e/ea/Pesce_ad_essiccare_sulla_riva_del_lago_malawi.JPG",
  },
  {
    id: "dry-fish-blantyre",
    group: "Catch",
    label: "Dry fish at Blantyre market",
    creator: "Michaelphoya",
    license: "Creative Commons Attribution Share Alike 4.0",
    licenseUrl: C["by-sa-4"],
    source: "https://commons.wikimedia.org/wiki/File:Assorted_dry_fish,_Blantyre_market,_Blantyre_-_Malawi.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/3/3a/Assorted_dry_fish%2C_Blantyre_market%2C_Blantyre_-_Malawi.jpg",
  },
  {
    id: "dry-fish-blantyre-two",
    group: "Catch",
    label: "Dry fish at Blantyre market",
    creator: "Michaelphoya",
    license: "Creative Commons Attribution Share Alike 4.0",
    licenseUrl: C["by-sa-4"],
    source: "https://commons.wikimedia.org/wiki/File:Assorted_dry_fish,_Blantyre_market,_Blantyre_Malawi.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/5/5d/Assorted_dry_fish%2C_Blantyre_market%2C_Blantyre_Malawi.jpg",
  },
  {
    id: "dry-fish-zomba",
    group: "Catch",
    label: "Dry fish for sale in Zomba",
    creator: "Michaelphoya",
    license: "Creative Commons Attribution Share Alike 4.0",
    licenseUrl: C["by-sa-4"],
    source: "https://commons.wikimedia.org/wiki/File:Dried_fish_for_sale,_Zomba_Malawi.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Dried_fish_for_sale%2C_Zomba_Malawi.jpg",
  },
  {
    id: "dry-fish-line",
    group: "Catch",
    label: "Dried fish in a line",
    creator: "Michaelphoya",
    license: "Creative Commons Attribution Share Alike 4.0",
    licenseUrl: C["by-sa-4"],
    source: "https://commons.wikimedia.org/wiki/File:Dried_fish_in_a_line,_Zomba_Malawi.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Dried_fish_in_a_line%2C_Zomba_Malawi.jpg",
  },
  {
    id: "chilli-valencia",
    group: "Seasoning",
    label: "Chilli powder at a market",
    creator: "Panormo commonswiki",
    license: "Public domain",
    licenseUrl: C.pd,
    source: "https://commons.wikimedia.org/wiki/File:Chili_powder_at_Valencia_Market.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Chili_powder_at_Valencia_Market.jpg",
  },
  {
    id: "cayenne-powders",
    group: "Seasoning",
    label: "Cayenne and chilli powders",
    creator: "Andrew Dalby",
    license: "CC0",
    licenseUrl: C.zero,
    source: "https://commons.wikimedia.org/wiki/File:Cayenne_and_other_chilli_powders.JPG",
    file: "https://upload.wikimedia.org/wikipedia/commons/c/c2/Cayenne_and_other_chilli_powders.JPG",
  },
  {
    id: "paprika-flakes",
    group: "Seasoning",
    label: "Paprika flakes",
    creator: "Georg Pik",
    license: "CC0",
    licenseUrl: C.zero,
    source: "https://commons.wikimedia.org/wiki/File:Paprika_flakes_(red_and_green).jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/9/9e/Paprika_flakes_%28red_and_green%29.jpg",
  },
  {
    id: "byadgi-chilli",
    group: "Seasoning",
    label: "Byadgi chilli powder",
    creator: "GI tagged products",
    license: "Creative Commons Attribution Share Alike 4.0",
    licenseUrl: C["by-sa-4"],
    source: "https://commons.wikimedia.org/wiki/File:Byadgi_chili_powder.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/d/db/Byadgi_chili_powder.jpg",
  },
  {
    id: "red-chilli",
    group: "Seasoning",
    label: "Red chilli powder",
    creator: "Ajay Suresh",
    license: "Creative Commons Attribution 2.0",
    licenseUrl: C["by-2"],
    source: "https://commons.wikimedia.org/wiki/File:Red_Chili_Powder_(Lall_Mirch)_(49695826571).jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/d/d4/Red_Chili_Powder_%28Lall_Mirch%29_%2849695826571%29.jpg",
  },
  {
    id: "ancho-chilli",
    group: "Seasoning",
    label: "Ancho chilli powder",
    creator: "Badagnani",
    license: "Creative Commons Attribution Share Alike 3.0",
    licenseUrl: C["by-sa-3"],
    source: "https://commons.wikimedia.org/wiki/File:Anchochilipowder.JPG",
    file: "https://upload.wikimedia.org/wikipedia/commons/0/09/Anchochilipowder.JPG",
  },
  {
    id: "curry-powder",
    group: "Seasoning",
    label: "Curry powder",
    creator: "Miansari66",
    license: "Public domain",
    licenseUrl: C.pd,
    source: "https://commons.wikimedia.org/wiki/File:Curry_Powder.JPG",
    file: "https://upload.wikimedia.org/wikipedia/commons/4/49/Curry_Powder.JPG",
  },
  {
    id: "curry-closeup",
    group: "Seasoning",
    label: "Curry powder closeup",
    creator: "Slick",
    license: "CC0",
    licenseUrl: C.zero,
    source: "https://commons.wikimedia.org/wiki/File:Nahrungsmittel_2012-07-08-9517.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/3/3a/Nahrungsmittel_2012-07-08-9517.jpg",
  },
  {
    id: "chickpea-curry",
    group: "Seasoning",
    label: "Curry with chickpeas",
    creator: "Daderot",
    license: "CC0",
    licenseUrl: C.zero,
    source: "https://commons.wikimedia.org/wiki/File:Chickpea_curry_on_rotini,_with_corn,_hot_mixed_Indian_pickles,_peanuts,_curry_powder,_and_black_pepper_-_Massachusetts.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/c/ce/Chickpea_curry_on_rotini%2C_with_corn%2C_hot_mixed_Indian_pickles%2C_peanuts%2C_curry_powder%2C_and_black_pepper_-_Massachusetts.jpg",
  },
  {
    id: "split-pea-curry",
    group: "Seasoning",
    label: "Curry in split pea soup",
    creator: "Daderot",
    license: "CC0",
    licenseUrl: C.zero,
    source: "https://commons.wikimedia.org/wiki/File:Split_pea_soup_with_peanuts,_curry_powder,_and_black_pepper_-_Massachusetts.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/0/03/Split_pea_soup_with_peanuts%2C_curry_powder%2C_and_black_pepper_-_Massachusetts.jpg",
  },
  {
    id: "sauerkraut-curry",
    group: "Seasoning",
    label: "Curry with sauerkraut",
    creator: "Daderot",
    license: "CC0",
    licenseUrl: C.zero,
    source: "https://commons.wikimedia.org/wiki/File:Sauerkraut_with_juniper_berries,_curry_powder,_and_black_pepper_-_Massachusetts.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/5/58/Sauerkraut_with_juniper_berries%2C_curry_powder%2C_and_black_pepper_-_Massachusetts.jpg",
  },
  {
    id: "garlic-powder-plain",
    group: "Seasoning",
    label: "Garlic powder",
    creator: "Ibu",
    license: "CC0",
    licenseUrl: C.zero,
    source: "https://commons.wikimedia.org/wiki/File:Knoflookpoeder.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Knoflookpoeder.jpg",
  },
  {
    id: "garlic-powder-jar",
    group: "Seasoning",
    label: "Garlic powder jar",
    creator: "John Phelan",
    license: "Creative Commons Attribution Share Alike 3.0",
    licenseUrl: C["by-sa-3"],
    source: "https://commons.wikimedia.org/wiki/File:Garlic_Powder,_Penzeys_Spices,_Arlington_Heights_MA.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Garlic_Powder%2C_Penzeys_Spices%2C_Arlington_Heights_MA.jpg",
  },
  {
    id: "garlic-eggs",
    group: "Seasoning",
    label: "Garlic salt with eggs",
    creator: "Daderot",
    license: "CC0",
    licenseUrl: C.zero,
    source: "https://commons.wikimedia.org/wiki/File:Eggs,_hard-boiled_with_garlic_sea_salt_and_chili_powder_-_Massachusetts.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/b/b4/Eggs%2C_hard-boiled_with_garlic_sea_salt_and_chili_powder_-_Massachusetts.jpg",
  },
  {
    id: "garlic-oysters",
    group: "Seasoning",
    label: "Garlic powder with oysters",
    creator: "Daderot",
    license: "CC0",
    licenseUrl: C.zero,
    source: "https://commons.wikimedia.org/wiki/File:Smoked_oysters_and_avacado,_with_garlic_powder,_on_toasted_Boston_brown_bread_-_Massachusetts.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/8/86/Smoked_oysters_and_avacado%2C_with_garlic_powder%2C_on_toasted_Boston_brown_bread_-_Massachusetts.jpg",
  },
  {
    id: "garlic-potatoes",
    group: "Seasoning",
    label: "Garlic powder on potatoes",
    creator: "Goose Green Photography",
    license: "Creative Commons Attribution 4.0",
    licenseUrl: C["by-4"],
    source: "https://commons.wikimedia.org/wiki/File:Putting_garlic_powder_on_some_cooked_potatoes.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/1/1c/Putting_garlic_powder_on_some_cooked_potatoes.jpg",
  },
  {
    id: "lemon-zest",
    group: "Seasoning",
    label: "Lemon zest",
    creator: "Rebecca Siegel",
    license: "Creative Commons Attribution 2.0",
    licenseUrl: C["by-2"],
    source: "https://commons.wikimedia.org/wiki/File:Lemon_zest.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/6/65/Lemon_zest.jpg",
  },
  {
    id: "lemon-pepper",
    group: "Seasoning",
    label: "Lemon pepper blend",
    creator: "Krzysztof Blachnicki",
    license: "Creative Commons Attribution 4.0",
    licenseUrl: C["by-4"],
    source: "https://commons.wikimedia.org/wiki/File:Homemade_lemon_pepper.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Homemade_lemon_pepper.jpg",
  },
  {
    id: "lemon-oil",
    group: "Seasoning",
    label: "Lemon oil",
    creator: "Itineranttrader",
    license: "Public domain",
    licenseUrl: C.pd,
    source: "https://commons.wikimedia.org/wiki/File:LemonEssentialOil.png",
    file: "https://upload.wikimedia.org/wikipedia/commons/3/36/LemonEssentialOil.png",
  },
  {
    id: "lemon-hummus",
    group: "Seasoning",
    label: "Lemon and garlic blend",
    creator: "Daderot",
    license: "CC0",
    licenseUrl: C.zero,
    source: "https://commons.wikimedia.org/wiki/File:Chicken_sauteed_in_olive_oil_and_soy_sauce_atop_rotini_mixed_with_lemon-garlic_hummus,_with_black_pepper_and_curry_powder_-_Massachusetts.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/3/34/Chicken_sauteed_in_olive_oil_and_soy_sauce_atop_rotini_mixed_with_lemon-garlic_hummus%2C_with_black_pepper_and_curry_powder_-_Massachusetts.jpg",
  },
  {
    id: "ginger-powder",
    group: "Seasoning",
    label: "Ginger powder",
    creator: "Fumikas Sagisavas",
    license: "CC0",
    licenseUrl: C.zero,
    source: "https://commons.wikimedia.org/wiki/File:Ginger_powder_(1).jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/1/16/Ginger_powder_%281%29.jpg",
  },
  {
    id: "ginger-sachet",
    group: "Seasoning",
    label: "Ginger powder sachet",
    creator: "Obsidian Soul",
    license: "Public domain",
    licenseUrl: C.pd,
    source: "https://commons.wikimedia.org/wiki/File:Ginger_powder.JPG",
    file: "https://upload.wikimedia.org/wikipedia/commons/c/c4/Ginger_powder.JPG",
  },
  {
    id: "dry-ginger",
    group: "Seasoning",
    label: "Dry ginger and powder",
    creator: "Piyush Kothari",
    license: "Creative Commons Attribution Share Alike 4.0",
    licenseUrl: C["by-sa-4"],
    source: "https://commons.wikimedia.org/wiki/File:Dry_Ginger_1.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Dry_Ginger_1.jpg",
  },
  {
    id: "turmeric-bowl",
    group: "Seasoning",
    label: "Turmeric powder",
    creator: "Trinity Saioo",
    license: "CC0",
    licenseUrl: C.zero,
    source: "https://commons.wikimedia.org/wiki/File:Lakadong_Turmeric_Powder_final_product.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Lakadong_Turmeric_Powder_final_product.jpg",
  },
  {
    id: "turmeric-spoon",
    group: "Seasoning",
    label: "Turmeric powder on a spoon",
    creator: "formulatehealth",
    license: "Creative Commons Attribution 2.0",
    licenseUrl: C["by-2"],
    source: "https://commons.wikimedia.org/wiki/File:Turmeric_Powder_on_a_Spoon_-_Black_Background.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Turmeric_Powder_on_a_Spoon_-_Black_Background.jpg",
  },
  {
    id: "turmeric-root",
    group: "Seasoning",
    label: "Turmeric root and powder",
    creator: "Simon A. Eugster",
    license: "Creative Commons Attribution Share Alike 3.0",
    licenseUrl: C["by-sa-3"],
    source: "https://commons.wikimedia.org/wiki/File:Curcuma_longa_roots.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/5/5b/Curcuma_longa_roots.jpg",
  },
  {
    id: "mixed-powders",
    group: "Seasoning",
    label: "Turmeric, coriander and cumin powders",
    creator: "Businesses247",
    license: "Creative Commons Attribution Share Alike 4.0",
    licenseUrl: C["by-sa-4"],
    source: "https://commons.wikimedia.org/wiki/File:Chlorofeel_Spices_Turmeric,_Coriander_and_Cumin_Powder.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/e/ed/Chlorofeel_Spices_Turmeric%2C_Coriander_and_Cumin_Powder.jpg",
  },
  {
    id: "mixed-spices",
    group: "Seasoning",
    label: "Mixed spices",
    creator: "Galeri ega",
    license: "Creative Commons Attribution Share Alike 4.0",
    licenseUrl: C["by-sa-4"],
    source: "https://commons.wikimedia.org/wiki/File:Bumbu_dan_Rempah_-_rempah.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/f/fc/Bumbu_dan_Rempah_-_rempah.jpg",
  },
  {
    id: "paprika-ad",
    group: "Seasoning",
    label: "Paprika powder poster",
    creator: "Unknown author",
    license: "Public domain",
    licenseUrl: C.pd,
    source: "https://commons.wikimedia.org/wiki/File:Paprik%C3%A1s_Kot%C3%A1nyi.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/9/93/Paprik%C3%A1s_Kot%C3%A1nyi.jpg",
  },
  {
    id: "smoked-paprika",
    group: "Seasoning",
    label: "Smoked paprika",
    creator: "Eslayter",
    license: "Creative Commons Attribution Share Alike 3.0",
    licenseUrl: C["by-sa-3"],
    source: "https://commons.wikimedia.org/wiki/File:Smoked_paprika_in_lemon_juice.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/e/e8/Smoked_paprika_in_lemon_juice.jpg",
  },
  {
    id: "chilli-closeup",
    group: "Seasoning",
    label: "Chilli powder closeup",
    creator: "Kurinjikathambam",
    license: "Creative Commons Attribution Share Alike 4.0",
    licenseUrl: C["by-sa-4"],
    source: "https://commons.wikimedia.org/wiki/File:Chilli_Powder2_edited.png",
    file: "https://upload.wikimedia.org/wikipedia/commons/e/e8/Chilli_Powder2_edited.png",
  },
  {
    id: "salt-sugar-chilli",
    group: "Seasoning",
    label: "Salt, sugar and chilli powder",
    creator: "Doug Beckers",
    license: "Creative Commons Attribution Share Alike 2.0",
    licenseUrl: C["by-sa-2"],
    source: "https://commons.wikimedia.org/wiki/File:Salt,_Sugar,_Chili_Powder_and_Tumeric.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/c/cd/Salt%2C_Sugar%2C_Chili_Powder_and_Tumeric.jpg",
  },
  {
    id: "ginger-rice",
    group: "Seasoning",
    label: "Ginger powder with rice",
    creator: "Daderot",
    license: "CC0",
    licenseUrl: C.zero,
    source: "https://commons.wikimedia.org/wiki/File:Rice_with_beef,_broccoli,_stock,_ginger_powder,_and_black_pepper_-_Massachusetts.jpg",
    file: "https://upload.wikimedia.org/wikipedia/commons/4/42/Rice_with_beef%2C_broccoli%2C_stock%2C_ginger_powder%2C_and_black_pepper_-_Massachusetts.jpg",
  },
];

const creditById = new Map(credits.map((credit) => [credit.id, credit]));

const fishGalleries = [
  {
    id: "523ba36f-2c5c-49ca-ab35-7b9773563bd7",
    folder: "chambo",
    items: [
      { credit: "chambo-market" },
      { credit: "chambo-malawi" },
      { credit: "fresh-fish-zomba" },
      { credit: "tilapia-fda-352" },
      { credit: "tilapia-fda-354" },
      { credit: "tilapia-usfws" },
      { credit: "tilapia-flower" },
      { credit: "tilapia-ice" },
    ],
  },
  {
    id: "d3c33585-2c68-4278-b9f9-9406d85411be",
    folder: "micheni",
    items: [
      { credit: "rhamphochromis-likoma", name: "micheni-01" },
      { credit: "rhamphochromis-chilingali", name: "micheni-02" },
      { credit: "rhamphochromis-likoma", name: "micheni-03", crop: { left: 0, top: 80, width: 600, height: 600 } },
      { credit: "rhamphochromis-likoma", name: "micheni-04", crop: { left: 424, top: 80, width: 600, height: 600 } },
      { credit: "rhamphochromis-likoma", name: "micheni-05", crop: { left: 170, top: 130, width: 700, height: 540 } },
      { credit: "rhamphochromis-esox" },
      { credit: "rhamphochromis-longiceps" },
      { credit: "rhamphochromis-macrophthalmus" },
    ],
  },
  {
    id: "25305467-b9ed-4173-a942-8da103bc3916",
    folder: "usipa",
    items: [
      { credit: "usipa-pao" },
      { credit: "usipa-ugali" },
      { credit: "usipa-nonhla" },
      { credit: "lake-malawi-drying" },
      { credit: "dry-fish-blantyre" },
      { credit: "dry-fish-blantyre-two" },
      { credit: "dry-fish-zomba" },
      { credit: "dry-fish-line" },
    ],
  },
];

const spiceGalleries = [
  {
    id: "0900e10c-3172-4207-b4b7-8681972af20f",
    folder: "original",
    items: ["mixed-spices", "cayenne-powders", "ginger-powder", "ginger-sachet", "dry-ginger", "garlic-powder-plain", "turmeric-bowl", "ginger-rice"].map((credit) => ({ credit })),
  },
  {
    id: "9aab8d67-289a-4c29-b3f7-16e782f59549",
    folder: "hot-spicy",
    items: ["red-chilli", "chilli-valencia", "cayenne-powders", "paprika-flakes", "byadgi-chilli", "ancho-chilli", "chilli-closeup", "salt-sugar-chilli"].map((credit) => ({ credit })),
  },
  {
    id: "3a617178-4839-4988-90cb-799a59a468be",
    folder: "lemon-garlic",
    items: ["lemon-zest", "lemon-pepper", "lemon-oil", "garlic-powder-plain", "garlic-powder-jar", "garlic-eggs", "garlic-oysters", "lemon-hummus"].map((credit) => ({ credit })),
  },
  {
    id: "727ab71e-8d2d-4b1a-b673-1bfdd67950fb",
    folder: "bbq",
    items: ["smoked-paprika", "paprika-flakes", "paprika-ad", "red-chilli", "cayenne-powders", "garlic-potatoes", "chilli-closeup", "salt-sugar-chilli"].map((credit) => ({ credit })),
  },
  {
    id: "af2eff38-0777-4ccf-97e3-dcfcfdf1c7bb",
    folder: "curry",
    items: ["curry-powder", "curry-closeup", "chickpea-curry", "split-pea-curry", "sauerkraut-curry", "turmeric-spoon", "turmeric-root", "mixed-powders"].map((credit) => ({ credit })),
  },
];

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const rawCache = new Map();
let lastDownloadAt = 0;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function downloadSource(credit) {
  if (rawCache.has(credit.id)) return rawCache.get(credit.id);
  const target = path.join(RAW, `${credit.id}-source.img`);
  if (!fs.existsSync(target) || fs.statSync(target).size < 1024) {
    let downloaded = false;
    let lastError = "";
    for (let attempt = 0; attempt < 6 && !downloaded; attempt += 1) {
      const gap = Date.now() - lastDownloadAt;
      if (gap < 1200) await wait(1200 - gap);
      lastDownloadAt = Date.now();
      const response = await fetch(credit.file, {
        headers: { "User-Agent": "LakeFreshPhotoImport/1.0 (https://lakefresh.vercel.app) Node/26" },
      });
      const contentType = response.headers.get("content-type") || "";
      if (response.ok && contentType.startsWith("image/")) {
        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length > 1024) {
          fs.writeFileSync(target, buffer);
          downloaded = true;
          break;
        }
      }
      lastError = `status ${response.status}, type ${contentType}`;
      await wait(Math.min(2500 * 2 ** attempt, 20000));
    }
    if (!downloaded) throw new Error(`Download failed for ${credit.id}: ${lastError}`);
  }
  rawCache.set(credit.id, target);
  return target;
}

async function processItem(item, destination) {
  const credit = creditById.get(item.credit);
  if (!credit) throw new Error(`Unknown credit id: ${item.credit}`);
  const source = await downloadSource(credit);
  let pipeline = sharp(source).rotate();
  if (item.crop) pipeline = pipeline.extract(item.crop);
  const buffer = await pipeline
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  if (buffer.length > 5 * 1024 * 1024) throw new Error(`Processed image too large: ${destination}`);
  fs.writeFileSync(path.join(OUT, path.basename(destination)), buffer);
  return buffer;
}

async function uploadGallery(gallery, kind) {
  const urls = [];
  for (let index = 0; index < gallery.items.length; index += 1) {
    const item = gallery.items[index];
    const fileName = item.name || `${gallery.folder}-${String(index + 1).padStart(2, "0")}.jpg`;
    const objectPath = `lf/${kind}/${gallery.folder}/${fileName}`;
    const buffer = await processItem(item, fileName);
    const { error } = await supabase.storage.from(BUCKET).upload(objectPath, buffer, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (error) throw new Error(`Upload failed for ${objectPath}: ${error.message}`);
    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
    urls.push(publicUrl);
  }
  return urls;
}

async function updateFish(gallery) {
  const urls = await uploadGallery(gallery, "fish");
  const { error } = await supabase
    .from("fish_products")
    .update({ image: urls[0], images: urls })
    .eq("id", gallery.id)
    .eq("brand_id", LF_BRAND);
  if (error) throw new Error(`Fish update failed for ${gallery.id}: ${error.message}`);
  return urls;
}

async function updateSpice(gallery) {
  const urls = await uploadGallery(gallery, "spices");
  const { error } = await supabase
    .from("lf_spices")
    .update({ image: urls[0], images: urls })
    .eq("id", gallery.id)
    .eq("brand_id", LF_BRAND);
  if (error) throw new Error(`Spice update failed for ${gallery.id}: ${error.message}`);
  return urls;
}

function writeCreditsFile(usedIds) {
  const used = credits
    .filter((credit) => usedIds.has(credit.id))
    .map(({ id, group, label, creator, license, licenseUrl, source }) => ({
      id,
      group,
      label,
      creator,
      license,
      licenseUrl,
      source,
    }));
  const body = `export interface LFPhotoCredit {
  id: string;
  group: "Catch" | "Seasoning";
  label: string;
  creator: string;
  license: string;
  licenseUrl: string;
  source: string;
}

export const lfPhotoCredits: LFPhotoCredit[] = ${JSON.stringify(used, null, 2)};
`;
  fs.mkdirSync(path.join(process.cwd(), "src", "data"), { recursive: true });
  fs.writeFileSync(path.join(process.cwd(), "src", "data", "lfPhotoCredits.ts"), body);
}

async function main() {
  console.log(`Preparing ${credits.length} licensed source photos...`);
  for (const credit of credits) await downloadSource(credit);
  console.log("Source photos ready. Uploading galleries...");

  const map = { fish: {}, spices: {} };
  for (const gallery of fishGalleries) map.fish[gallery.id] = await updateFish(gallery);
  for (const gallery of spiceGalleries) map.spices[gallery.id] = await updateSpice(gallery);

  const usedIds = new Set();
  for (const gallery of [...fishGalleries, ...spiceGalleries]) {
    for (const item of gallery.items) usedIds.add(item.credit);
  }
  writeCreditsFile(usedIds);
  fs.writeFileSync(path.join(TMP, "photo-map.json"), JSON.stringify(map, null, 2));

  const count = Object.values(map).reduce((total, group) => total + Object.values(group).reduce((sum, urls) => sum + urls.length, 0), 0);
  console.log(`Imported ${count} photos across ${fishGalleries.length} catch products and ${spiceGalleries.length} seasonings.`);
  console.log(`Wrote ${usedIds.size} attribution records.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
