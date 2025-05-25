"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface DosAlert {
  _id: string | { $oid: string };
  timestamp: string;
  source_ip: string;
  request_count: number;
  time_period: string;
  threshold_exceeded: boolean;
  attack_type: string;
  confidence: number;
  severity: string;
  status: string;
  blocked: boolean;
  details?: {
    path?: string;
    user_agent?: string;
    country?: string;
    [key: string]: any;
  };
}

export default function DosAlerts() {
  const [alerts, setAlerts] = useState<DosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/dos-alerts");
        if (response.status === 401) {
          // Redirect to login page if unauthorized
          window.location.href = "/admin/login";
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch DoS alerts");
        }
        const data = await response.json();
        setAlerts(data);
      } catch (err) {
        console.error("Error fetching DoS alerts:", err);
        setError("Failed to load DoS alerts");
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
  const getAlertKey = (alert: DosAlert, index: number) => {
    if (typeof alert._id === "string") return alert._id;
    if (alert._id && alert._id.$oid) return alert._id.$oid;
    return `alert-${index}`;
  };

  // Helper function to get severity badge color
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800";
      case "low":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  if (loading) {
    return <div>Loading DoS alerts...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">DoS Attack Alerts</h1>
        <span className="text-sm text-gray-500">
          Auto-refreshes every 30 seconds
        </span>
      </div>

      <div className="space-y-4">
        {alerts.map((alert, index) => (
          <Card
            key={getAlertKey(alert, index)}
            className={`border-l-4 ${
              alert.threshold_exceeded
                ? "border-l-red-500"
                : "border-l-yellow-500"
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-medium">
                  {alert.attack_type} Attack
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-sm rounded-full ${getSeverityColor(
                      alert.severity
                    )}`}
                  >
                    {alert.severity} Severity
                  </span>
                  <Badge variant={alert.blocked ? "destructive" : "outline"}>
                    {alert.blocked ? "Blocked" : "Detected"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Source IP: </span>
                    {alert.source_ip}
                  </div>
                  <div>
                    <span className="font-medium">Request Count: </span>
                    {alert.request_count} in {alert.time_period}
                  </div>
                  <div>
                    <span className="font-medium">Confidence: </span>
                    {alert.confidence.toFixed(1)}%
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Status: </span>
                    {alert.status}
                  </div>
                  {alert.details?.path && (
                    <div>
                      <span className="font-medium">Target Path: </span>
                      {alert.details.path}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Time: </span>
                    {format(new Date(alert.timestamp), "PPpp")}
                  </div>
                </div>
                {alert.details?.user_agent && (
                  <div className="col-span-2">
                    <span className="font-medium">User Agent: </span>
                    <span className="text-sm text-gray-600 break-all">
                      {alert.details.user_agent}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {alerts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No DoS alerts found
          </div>
        )}
      </div>
    </div>
  );
}
