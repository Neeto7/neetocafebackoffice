"use client";

import { Button } from "@/components/ui/button";

type CartButtonProps = {
  itemCount: number;
  total: number;
  onOpen: () => void;
};

export const CartButton = ({ itemCount, total, onOpen }: CartButtonProps) => {
  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white text-black px-4 py-3 shadow-lg">
      <div className="flex justify-between items-center">
        <p className="font-semibold">
          {itemCount} item • Rp {total.toLocaleString()}
        </p>
        <Button
          className="bg-[#0C2B4E] hover:bg-[#1D546C] text-white"
          onClick={onOpen}
        >
          Lihat Keranjang
        </Button>
      </div>
    </div>
  );
};