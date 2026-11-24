import logoSb from "@/assets/streetwear-blantyre-logo.png";
import { Link } from "react-router-dom";

interface LogoProps {
  className?: string;
  /** Brand the mark belongs to. Defaults to SB for backwards compatibility. */
  brand?: "sb" | "lf";
}

export const Logo = ({ className = "h-10 sm:h-12 md:h-14 w-auto", brand = "sb" }: LogoProps) => {
  const isLf = brand === "lf";
  const src = isLf ? "/brand/lake-fresh/logo.png" : logoSb;
  const alt = isLf ? "Lake Fresh Fish Mart" : "SB";
  const home = isLf ? "/lf" : "/";

  return (
    <Link to={home} className="flex items-center gap-2 shrink-0" aria-label={`${alt} home`}>
      <img src={src} alt={alt} className={`${className} object-contain`} />
    </Link>
  );
};
