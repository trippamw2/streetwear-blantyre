import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useDeliverySettings } from "@/hooks/useDeliverySettings";
import { formatMWK } from "@/data/products";
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useState } from "react";

export const CartDrawer = ({ children }: { children: React.ReactNode }) => {
  const { items, subtotal, deliveryFee, total, count, setQuantity, remove } = useCart();
  const { settings } = useDeliverySettings();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0 border-l border-black/10">
        {/* Header */}
        <div className="px-5 sm:px-6 py-5 border-b border-black/[0.08] flex items-center justify-between shrink-0">
          <SheetTitle className="font-display text-xl font-extrabold tracking-tight flex items-center gap-2.5">
            Bag <span className="text-sm font-semibold text-gray-500">({count})</span>
          </SheetTitle>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5 px-6 py-16">
            <div className="h-16 w-16 bg-[#f6f6f4] flex items-center justify-center">
              <ShoppingBag className="h-7 w-7 text-gray-400" />
            </div>
            <div>
              <p className="font-display text-xl font-bold tracking-tight">Your bag is empty</p>
              <p className="text-sm text-gray-500 mt-1.5">Add a piece to get started.</p>
            </div>
            <Button asChild variant="hero" size="lg" onClick={() => setOpen(false)}>
              <Link to="/shop">Shop all</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Scrollable Items */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
              {items.map((i) => (
                <div key={i.productKey} className="flex gap-4 p-3 bg-[#f6f6f4]">
                  <div className="h-24 w-20 sm:h-28 sm:w-24 overflow-hidden shrink-0 bg-[#eee]">
                    <img src={i.image} alt={i.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-tight line-clamp-2">{i.name}</p>
                      <button
                        onClick={() => remove(i.productKey)}
                        className="p-2 -mt-1 -mr-1 text-gray-400 hover:text-red-600 transition-colors shrink-0"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setQuantity(i.productKey, i.quantity - 1)}
                          className="h-9 w-9 border border-black/10 bg-white hover:bg-black hover:text-white flex items-center justify-center transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-9 text-center text-sm font-bold">{i.quantity}</span>
                        <button
                          onClick={() => setQuantity(i.productKey, i.quantity + 1)}
                          className="h-9 w-9 border border-black/10 bg-white hover:bg-black hover:text-white flex items-center justify-center transition-colors"
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
            <div className="border-t border-black/[0.08] px-5 sm:px-6 py-5 space-y-4 bg-white shrink-0">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold">{formatMWK(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Delivery (estimate)</span>
                  <span className={deliveryFee === 0 ? "text-green-700 font-semibold" : "font-medium"}>
                    {deliveryFee === 0 ? "FREE" : formatMWK(deliveryFee)}
                  </span>
                </div>
                {deliveryFee > 0 && (
                  <p className="text-xs text-gray-500">
                    Free delivery on orders over {formatMWK(settings.freeDeliveryThreshold)}
                  </p>
                )}
                <div className="flex items-center justify-between font-bold text-base border-t border-black/[0.08] pt-3">
                  <span className="uppercase tracking-[0.08em] text-[12px]">Total</span>
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
                  Complete Checkout <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-600">
                <div className="rounded-md bg-gray-50 px-2 py-2 text-center font-medium">Safe PayChangu</div>
                <div className="rounded-md bg-gray-50 px-2 py-2 text-center font-medium">14-day exchange</div>
                <div className="rounded-md bg-gray-50 px-2 py-2 text-center font-medium">WhatsApp help</div>
              </div>
              <p className="text-[11px] text-center text-gray-500">Airtel Money, TNM Mpamba, Visa & Mastercard · <a href="https://wa.me/265982972977" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">+265 982 972 977</a></p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};