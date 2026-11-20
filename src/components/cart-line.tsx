"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { removeCartItem, updateCartItem } from "@/app/actions/cart";
import type { CartItem } from "@/lib/api/schemas";
import { formatPrice } from "@/lib/format";
import { clampQuantity, MAX_QUANTITY } from "@/lib/quantity";

interface CartLineProps {
  item: CartItem;
  currency: string;
}

const stepClass =
  "focus-visible:outline-foreground border-foreground/20 hover:bg-foreground/5 flex h-9 w-9 items-center justify-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

export function CartLine({ item, currency }: CartLineProps) {
  const { product } = item;
  const [image] = product.images;
  const inputId = useId();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const change = (quantity: number): void => {
    const next = clampQuantity(quantity, MAX_QUANTITY);
    if (next === item.quantity) {
      return;
    }
    startTransition(async () => {
      const result = await updateCartItem(item.productId, next);
      setMessage(result.ok ? `Quantity of ${product.name} updated to ${next}.` : result.message);
    });
  };

  const remove = (): void => {
    startTransition(async () => {
      const result = await removeCartItem(item.productId);
      setMessage(result.ok ? `${product.name} removed from your cart.` : result.message);
    });
  };

  return (
    <li
      aria-busy={pending}
      className={`border-foreground/10 flex gap-4 border-b py-5 transition-opacity ${pending ? "opacity-60" : ""}`}
    >
      <div className="bg-foreground/5 relative h-24 w-24 shrink-0 overflow-hidden rounded-lg sm:h-28 sm:w-28">
        {image !== undefined && (
          <Image src={image} alt={product.name} fill sizes="112px" className="object-cover" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-medium">
            <Link
              href={`/products/${product.slug}`}
              className="focus-visible:outline-foreground rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {product.name}
            </Link>
          </h2>
          <p className="text-foreground/70 text-sm tabular-nums">
            {formatPrice(product.price, product.currency)} each
          </p>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label={`Remove ${product.name} from cart`}
            className="focus-visible:outline-foreground text-foreground/70 hover:text-foreground rounded-sm text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed"
          >
            Remove
          </button>
        </div>
        <div className="flex items-center justify-between gap-6 sm:flex-col sm:items-end sm:justify-start">
          <div className="flex items-center gap-2">
            <label htmlFor={inputId} className="sr-only">
              {`Quantity for ${product.name}`}
            </label>
            <button
              type="button"
              className={stepClass}
              aria-label={`Decrease quantity of ${product.name}`}
              disabled={pending || item.quantity <= 1}
              onClick={() => {
                change(item.quantity - 1);
              }}
            >
              <span aria-hidden="true">&minus;</span>
            </button>
            {/* key resets the input when the server quantity changes. */}
            <input
              key={item.quantity}
              id={inputId}
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_QUANTITY}
              defaultValue={item.quantity}
              disabled={pending}
              onBlur={(event) => {
                change(Number(event.target.value));
                event.target.value = String(
                  clampQuantity(Number(event.target.value), MAX_QUANTITY),
                );
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
              className="border-foreground/20 bg-background focus-visible:outline-foreground h-9 w-16 rounded-lg border text-center tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2"
            />
            <button
              type="button"
              className={stepClass}
              aria-label={`Increase quantity of ${product.name}`}
              disabled={pending || item.quantity >= MAX_QUANTITY}
              onClick={() => {
                change(item.quantity + 1);
              }}
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>
          <p className="font-medium tabular-nums">
            <span className="sr-only">Line total: </span>
            {formatPrice(item.lineTotal, currency)}
          </p>
        </div>
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {message}
      </p>
    </li>
  );
}
