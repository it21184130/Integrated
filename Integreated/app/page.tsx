import { getProducts } from "@/lib/products";
import ProductCard from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const products = await getProducts();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">E-commerce Demo</h1>
        <div className="flex gap-4">
          <Link href="/cart">
            <Button variant="outline" className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart
            </Button>
          </Link>
          <Link href="/dos-simulator">
            <Button variant="outline">DoS Simulator</Button>
          </Link>
          <Link href="/admin/login">
            <Button variant="outline">Admin</Button>
          </Link>
          <Link href="/auth/login">
            <Button>Login</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}
