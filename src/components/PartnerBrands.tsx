import { motion } from "framer-motion";

interface Brand {
  id: string;
  name: string;
  website: string;
}

const BRANDS: Brand[] = [
  {
    id: "sb-original",
    name: "SB Original",
    website: "#",
  },
  {
    id: "sb-street",
    name: "SB Street",
    website: "#",
  },
];

export const PartnerBrands = ({ className }: { className?: string }) => {
  return (
    <section className={`py-12 bg-gray-50 ${className}`}>
      <div className="container">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-teal-600 uppercase tracking-widest">Our Collections</p>
          <h2 className="font-display font-bold text-2xl sm:text-3xl mt-1">Streetwear Blantyre Collections</h2>
          <p className="text-muted-foreground mt-2">Premium streetwear fashion</p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {BRANDS.map((brand, i) => (
            <motion.a
              key={brand.id}
              href={brand.website}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2 group"
            >
              <span className="text-xl md:text-2xl font-bold text-gray-400 group-hover:text-orange-500 transition-colors">
                {brand.name}
              </span>
            </motion.a>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Our own in-house collections
        </p>
      </div>
    </section>
  );
};

export default PartnerBrands;