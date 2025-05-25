"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { processCheckout } from "@/lib/checkout-actions";
import { getCart } from "@/lib/cart-actions";
import { getUserProfile } from "@/lib/auth-actions";
import { getMerchants } from "@/lib/merchant-actions";

const checkoutSchema = z.object({
  cc_num: z
    .string()
    .min(13, "Card number must be at least 13 digits")
    .max(19, "Card number must not exceed 19 digits")
    .regex(/^\d+$/, "Card number must contain only digits"),
  merchant: z.string().min(1, "Please select a merchant"),
  category: z.string().min(1, "Please select a category"),
  amt: z
    .string()
    .refine(
      (val) => !isNaN(Number.parseFloat(val)) && Number.parseFloat(val) > 0,
      {
        message: "Amount must be a positive number",
      }
    ),
});

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cart, setCart] = useState(null);
  const [user, setUser] = useState(null);
  const [merchants, setMerchants] = useState([]);

  const form = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      cc_num: "",
      merchant: "",
      category: "",
      amt: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cartData, userData, merchantsData] = await Promise.all([
          getCart(),
          getUserProfile(),
          getMerchants(),
        ]);

        setCart(cartData);
        setUser(userData);
        setMerchants(merchantsData);

        // Pre-fill the amount field with the cart total
        if (cartData && cartData.total) {
          form.setValue("amt", cartData.total.toString());
        }

        // Redirect if cart is empty
        if (!cartData || cartData.items.length === 0) {
          router.push("/cart");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load checkout data. Please try again.",
          variant: "destructive",
        });
        router.push("/cart");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast, router, form]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Convert amount to number
      const formattedData = {
        ...data,
        amt: Number.parseFloat(data.amt),
      };

      const result = await processCheckout(formattedData);

      if (result.label === "Fraud") {
        router.push(
          `/checkout/fraud?confidence=${result.confidence}&reason=${result.reason}`
        );
      } else {
        router.push("/checkout/success");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to process checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        <p>Loading checkout...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        <p>Your cart is empty. Redirecting to cart page...</p>
      </div>
    );
  }

  const categories = [
    "grocery_pos",
    "grocery_net",
    "entertainment",
    "gas_transport",
    "misc_pos",
    "misc_net",
    "shopping_pos",
    "shopping_net",
    "food_dining",
    "health_fitness",
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>
                  Items (
                  {cart.items.reduce((sum, item) => sum + item.quantity, 0)})
                </span>
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
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user && (
                <>
                  <div>
                    <p className="font-medium">Name:</p>
                    <p>
                      {user.firstName} {user.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Address:</p>
                    <p>{user.street}</p>
                    <p>
                      {user.city}, {user.state} {user.zip}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>
                Enter your payment details to complete your order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="cc_num"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Credit Card Number</FormLabel>
                        <FormControl>
                          <Input placeholder="4111 1111 1111 1111" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="merchant"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Merchant</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select merchant" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {merchants.map((merchant) => (
                              <SelectItem
                                key={merchant.name}
                                value={merchant.name}
                              >
                                {merchant.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category
                                  .replace("_", " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Processing..." : "Complete Purchase"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
