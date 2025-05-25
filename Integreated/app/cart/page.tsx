"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Trash2, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { getCart, updateCartItem, removeCartItem } from "@/lib/cart-actions"

export default function CartPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [cart, setCart] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const cartData = await getCart()
        setCart(cartData)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load cart. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchCart()
  }, [toast])

  const handleQuantityChange = async (productId, quantity) => {
    try {
      await updateCartItem(productId, quantity)
      setCart((prevCart) => ({
        ...prevCart,
        items: prevCart.items.map((item) => (item.product._id === productId ? { ...item, quantity } : item)),
        total: prevCart.items.reduce(
          (sum, item) =>
            sum + (item.product._id === productId ? item.product.price * quantity : item.product.price * item.quantity),
          0,
        ),
      }))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update cart. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveItem = async (productId) => {
    try {
      await removeCartItem(productId)
      setCart((prevCart) => ({
        ...prevCart,
        items: prevCart.items.filter((item) => item.product._id !== productId),
        total: prevCart.items
          .filter((item) => item.product._id !== productId)
          .reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      }))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
        <p>Loading cart...</p>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
        <Card className="text-center p-8">
          <CardContent className="pt-6">
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Looks like you haven't added anything to your cart yet.</p>
            <Button asChild>
              <Link href="/">Continue Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Cart Items</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {cart.items.map((item) => (
                <div key={item.product._id} className="py-4 flex items-center">
                  <div className="relative h-20 w-20 rounded overflow-hidden">
                    <Image
                      src={item.product.image || `/placeholder.svg?height=80&width=80`}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <p className="text-muted-foreground text-sm">${item.product.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-20">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.product._id, Number.parseInt(e.target.value))}
                        className="text-center"
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.product._id)}>
                      <Trash2 className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${cart.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${cart.total.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" asChild>
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

