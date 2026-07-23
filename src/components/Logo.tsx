import logo from "@/assets/streetwear-blantyre-logo.png";
import { Link } from "react-router-dom";

export const Logo = ({ className = "h-20 sm:h-24 md:h-32 lg:h-40 w-auto" }: { className?: string }) => (
  <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="Streetwear Blantyre home">
    <img src={logo} alt="Streetwear Blantyre" className={`${className} object-contain`} />
  </Link>
);
