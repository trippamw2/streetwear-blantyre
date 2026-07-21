import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart, DELIVERY_FEE_MWK, FREE_DELIVERY_THRESHOLD_MWK } from "@/contexts/CartContext";
import { formatMWK } from "@/data/products";
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useState } from "react";

export const CartDrawer = ({ children }: { children: React.ReactNode }) => {
  const { items, subtotal, deliveryFee, total, count, setQuantity, remove } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-display text-xl flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Cart ({count})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 py-10">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="font-semibold">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">Add products to get started</p>
            </div>
            <Button asChild variant="hero" onClick={() => setOpen(false)}>
              <Link to="/shop">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 space-y-3">
              {items.map((i) => (
                <div key={i.productKey} className="flex gap-3 p-3 bg-secondary/10 rounded-xl">
                  <div className="h-16 w-16 rounded-lg overflow-hidden shrink-0">
                    <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-tight">{i.name}</p>
                      <button
                        onClick={() => remove(i.productKey)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatMWK(i.price)}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setQuantity(i.productKey, i.quantity - 1)}
                          className="h-8 w-8 rounded-lg bg-secondary/50 hover:bg-secondary flex items-center justify-center"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{i.quantity}</span>
                        <button
                          onClick={() => setQuantity(i.productKey, i.quantity + 1)}
                          className="h-8 w-8 rounded-lg bg-secondary/50 hover:bg-secondary flex items-center justify-center"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-sm font-bold">{formatMWK(i.price * i.quantity)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border/60 pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatMWK(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className={deliveryFee === 0 ? "text-green-500 font-semibold" : ""}>
                  {deliveryFee === 0 ? "FREE" : formatMWK(deliveryFee)}
                </span>
              </div>
              {deliveryFee > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Free delivery on orders over {formatMWK(FREE_DELIVERY_THRESHOLD_MWK)}
                </p>
              )}
              <div className="flex items-center justify-between font-bold text-lg border-t border-border/60 pt-3">
                <span>Total</span>
                <span className="text-gradient">{formatMWK(total)}</span>
              </div>

              <Button
                asChild
                variant="hero"
                size="lg"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                <Link to="/checkout" className="flex items-center justify-center gap-2">
                  Checkout <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};