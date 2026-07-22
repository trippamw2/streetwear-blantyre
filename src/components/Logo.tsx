import logo from "@/assets/streetwear-blantyre-logo.png";
import { Link } from "react-router-dom";

export const Logo = ({ className = "h-16 sm:h-20 md:h-28 lg:h-36 xl:h-44 w-auto" }: { className?: string }) => (
  <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="Streetwear Blantyre home">
    <img src={logo} alt="Streetwear Blantyre" className={`${className} object-contain`} />
  </Link>
);
