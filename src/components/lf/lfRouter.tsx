import { forwardRef } from "react";
import {
  Link,
  NavLink,
  useNavigate,
  type LinkProps,
  type NavLinkProps,
  type NavigateOptions,
  type To,
} from "react-router-dom";
import { lfPath } from "@/lib/brandSite";

const resolveTo = (to: To): To => {
  if (typeof to === "string") return lfPath(to);
  if (to && typeof to === "object" && typeof to.pathname === "string") {
    return { ...to, pathname: lfPath(to.pathname) };
  }
  return to;
};

/**
 * `<Link>` that keeps canonical `/lf/...` source paths working on both the
 * dedicated Lake Fresh domain (root paths) and the shared/dev host (`/lf/...`).
 */
export const LFLink = forwardRef<HTMLAnchorElement, LinkProps>(({ to, ...props }, ref) => (
  <Link ref={ref} to={resolveTo(to)} {...props} />
));
LFLink.displayName = "LFLink";

/** Brand-aware `<NavLink>` counterpart to {@link LFLink}. */
export const LFNavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(({ to, ...props }, ref) => (
  <NavLink ref={ref} to={resolveTo(to)} {...props} />
));
LFNavLink.displayName = "LFNavLink";

/** `useNavigate` that translates canonical LF paths for the active host. */
export const useLFNavigate = () => {
  const navigate = useNavigate();
  return (to: number | To, options?: NavigateOptions) => {
    if (typeof to === "number") return navigate(to);
    return navigate(resolveTo(to), options);
  };
};
