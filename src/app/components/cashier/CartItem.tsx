"use client";

import Image from "next/image";
import { Menu } from "@/types/Menu";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MenuCard({ item, onSelect }: { item: Menu, onSelect: () => void }) {
  return (
    <Card className="cursor-pointer hover:shadow-lg" onClick={onSelect}>
      <CardHeader className="p-0">
        <div className="relative w-full h-40 overflow-hidden rounded-t-xl">
          {item.image_url ? (
            <Image src={item.image_url} alt={item.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
              No Image
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex justify-between items-start">
          <p className="font-semibold">{item.name}</p>
          {!item.is_available && <Badge variant="destructive">Habis</Badge>}
        </div>

        <p className="text-sm text-gray-500">{item.category}</p>

        <p className="font-bold">Rp {item.price.toLocaleString("id-ID")}</p>
      </CardContent>
    </Card>
  );
}
