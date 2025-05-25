"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function FraudDetectionPage() {
  const searchParams = useSearchParams()
  const confidence = searchParams.get("confidence") || "Unknown"
  const reason = searchParams.get("reason") || "Unknown"

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card className="border-destructive">
        <CardHeader className="bg-destructive/10">
          <CardTitle className="text-center text-destructive flex items-center justify-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Fraud Detected
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Transaction Blocked</AlertTitle>
            <AlertDescription>
              Our fraud detection system has flagged this transaction as potentially fraudulent.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h3 className="font-semibold">Detection Details:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">Confidence:</div>
              <div>{confidence}</div>
              <div className="font-medium">Reason:</div>
              <div>{reason}</div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            For your security, this transaction has been blocked. If you believe this is an error, please contact
            customer support.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/checkout">Try Again</Link>
          </Button>
          <Button className="w-full" asChild>
            <Link href="/">Return to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

