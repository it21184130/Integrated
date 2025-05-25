import Link from "next/link"
import { CheckCircle2, ShoppingBag } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SuccessPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-center text-primary flex items-center justify-center gap-2">
            <CheckCircle2 className="h-6 w-6" />
            Order Confirmed
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <ShoppingBag className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Thank you for your purchase!</h2>
          <p className="text-muted-foreground mb-6">
            Your order has been successfully processed and will be shipped soon.
          </p>

          <div className="border rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium mb-2">Order Details:</h3>
            <p className="text-sm text-muted-foreground">
              A confirmation email with your order details has been sent to your email address.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full" asChild>
            <Link href="/">Continue Shopping</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

