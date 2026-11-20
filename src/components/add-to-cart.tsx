"use client";

import { useActionState, useId, useState } from "react";
import { addToCart } from "@/app/actions/cart";
import { clampQuantity, maxSelectable } from "@/lib/quantity";

interface AddToCartProps {
  productId: string;
  productName: string;
  /** Live stock from the server. */
  stock: number;
}

type Status = { kind: "idle" } | { kind: "success" | "error"; message: string };

const buttonClass =
  "focus-visible:outline-foreground border-foreground/20 hover:bg-foreground/5 flex h-11 w-11 items-center justify-center rounded-full border text-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

export function AddToCart({ productId, productName, stock }: AddToCartProps) {
  const max = maxSelectable(stock);
  const outOfStock = max < 1;
  const inputId = useId();
  // String so the field can be empty while typing; clamped on blur.
  const [quantityText, setQuantityText] = useState("1");
  const quantity = clampQuantity(Number(quantityText), max);

  const [status, submit, pending] = useActionState<Status, FormData>(
    async (_previous, formData) => {
      const requested = clampQuantity(Number(formData.get("quantity")), max);
      const result = await addToCart(productId, requested);
      if (result.ok) {
        return {
          kind: "success",
          message: `Added ${requested} x ${productName} to your cart.`,
        };
      }
      return { kind: "error", message: result.message };
    },
    { kind: "idle" },
  );

  const setClamped = (value: number): void => {
    setQuantityText(String(clampQuantity(value, max)));
  };

  return (
    <form action={submit} className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <label htmlFor={inputId} className="text-sm font-medium">
          Quantity
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={buttonClass}
            aria-label="Decrease quantity"
            disabled={outOfStock || quantity <= 1}
            onClick={() => {
              setClamped(quantity - 1);
            }}
          >
            <span aria-hidden="true">&minus;</span>
          </button>
          <input
            id={inputId}
            name="quantity"
            type="number"
            inputMode="numeric"
            min={1}
            max={Math.max(max, 1)}
            step={1}
            value={outOfStock ? "" : quantityText}
            disabled={outOfStock}
            onChange={(event) => {
              setQuantityText(event.target.value);
            }}
            onBlur={() => {
              setClamped(Number(quantityText));
            }}
            className="border-foreground/20 bg-background focus-visible:outline-foreground h-11 w-20 rounded-lg border text-center tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40"
          />
          <button
            type="button"
            className={buttonClass}
            aria-label="Increase quantity"
            disabled={outOfStock || quantity >= max}
            onClick={() => {
              setClamped(quantity + 1);
            }}
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={outOfStock || pending}
        aria-busy={pending}
        className="bg-foreground text-background focus-visible:outline-foreground inline-flex h-12 w-full items-center justify-center rounded-full px-8 text-sm font-medium transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
      >
        Add to Cart
      </button>

      {/* Always rendered so screen readers announce updates. */}
      <p
        role="status"
        aria-live="polite"
        className={`min-h-5 text-sm ${status.kind === "error" ? "text-red-600 dark:text-red-400" : "text-foreground/80"}`}
      >
        {status.kind === "idle" ? "" : status.message}
      </p>
    </form>
  );
}
