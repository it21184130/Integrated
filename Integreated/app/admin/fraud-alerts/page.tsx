"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface FraudAlert {
  _id: string | { $oid: string };
  trans_date_trans_time: string;
  cc_num: { $numberLong: string };
  merchant: string;
  category: string;
  amt: number;
  first: string;
  last: string;
  city: string;
  state: string;
  trans_num: string;
  is_fraud: number;
  confidence: number;
  label: string;
}

export default function FraudAlerts() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/fraud-alerts");
        if (response.status === 401) {
          // Redirect to login page if unauthorized
          window.location.href = "/admin/login";
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch fraud alerts");
        }
        const data = await response.json();
        setAlerts(data);
      } catch (err) {
        console.error("Error fetching fraud alerts:", err);
        setError("Failed to load fraud alerts");
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to get a unique key for each alert
  const getAlertKey = (alert: FraudAlert, index: number) => {
    if (typeof alert._id === "string") return alert._id;
    if (alert._id && alert._id.$oid) return alert._id.$oid;
    if (alert.trans_num) return alert.trans_num;
    return `alert-${index}`;
  };

  if (loading) {
    return <div>Loading fraud alerts...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Fraud Alerts</h1>
        <span className="text-sm text-gray-500">
          Auto-refreshes every 30 seconds
        </span>
      </div>

      <div className="space-y-4">
        {alerts.map((alert, index) => (
          <Card
            key={getAlertKey(alert, index)}
            className={`border-l-4 ${
              alert.is_fraud ? "border-l-red-500" : "border-l-green-500"
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-medium">
                  Transaction {alert.trans_num.slice(-8)}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-sm rounded-full ${
                      alert.is_fraud
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {alert.label}
                  </span>
                  <span className="text-sm text-gray-500">
                    Confidence: {alert.confidence.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Customer: </span>
                    {alert.first} {alert.last}
                  </div>
                  <div>
                    <span className="font-medium">Card: </span>
                    ****{alert.cc_num.$numberLong.slice(-4)}
                  </div>
                  <div>
                    <span className="font-medium">Amount: </span>$
                    {alert.amt.toFixed(2)}
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Merchant: </span>
                    {alert.merchant}
                  </div>
                  <div>
                    <span className="font-medium">Location: </span>
                    {alert.city}, {alert.state}
                  </div>
                  <div>
                    <span className="font-medium">Date: </span>
                    {format(new Date(alert.trans_date_trans_time), "PPpp")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {alerts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No fraud alerts found
          </div>
        )}
      </div>
    </div>
  );
}
