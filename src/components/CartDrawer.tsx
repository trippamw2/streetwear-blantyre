import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useDeliverySettings } from "@/hooks/useDeliverySettings";
import { formatMWK } from "@/data/products";
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight, X } from "lucide-react";
import { useState } from "react";

export const CartDrawer = ({ children }: { children: React.ReactNode }) => {
  const { items, subtotal, deliveryFee, total, count, setQuantity, remove } = useCart();
  const { settings } = useDeliverySettings();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-border/60 flex items-center justify-between shrink-0">
          <SheetTitle className="font-display text-lg sm:text-xl flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Cart ({count})
          </SheetTitle>
          <button
            onClick={() => setOpen(false)}
            className="p-2 -mr-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 px-6 py-16">
            <div className="h-20 w-20 rounded-full bg-gray-50 flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-gray-300" />
            </div>
            <div>
              <p className="font-semibold text-lg">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-1">Add items to get started</p>
            </div>
            <Button asChild variant="hero" size="lg" onClick={() => setOpen(false)}>
              <Link to="/shop">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Scrollable Items */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
              {items.map((i) => (
                <div key={i.productKey} className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl">
                  <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg overflow-hidden shrink-0 bg-white">
                    <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-tight line-clamp-2">{i.name}</p>
                      <button
                        onClick={() => remove(i.productKey)}
                        className="p-2 -mt-1 -mr-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setQuantity(i.productKey, i.quantity - 1)}
                          className="h-10 w-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-10 text-center text-sm font-bold">{i.quantity}</span>
                        <button
                          onClick={() => setQuantity(i.productKey, i.quantity + 1)}
                          className="h-10 w-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-bold">{formatMWK(i.price * i.quantity)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer - Pinned at bottom */}
            <div className="border-t border-border/60 px-4 sm:px-6 py-4 space-y-3 bg-white shrink-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{formatMWK(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className={deliveryFee === 0 ? "text-green-600 font-semibold" : ""}>
                    {deliveryFee === 0 ? "FREE" : formatMWK(deliveryFee)}
                  </span>
                </div>
                {deliveryFee > 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Free delivery on orders over {formatMWK(settings.freeDeliveryThreshold)}
                  </p>
                )}
                <div className="flex items-center justify-between font-bold text-lg border-t border-border/60 pt-2">
                  <span>Total</span>
                  <span>{formatMWK(total)}</span>
                </div>
              </div>

              <Button
                asChild
                variant="hero"
                size="lg"
                className="w-full h-12 text-base"
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