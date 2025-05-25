"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format } from "date-fns";

interface Alert {
  type: "fraud" | "dos";
  timestamp: string;
  details: {
    transactionId?: string;
    amount?: number;
    merchant?: string;
    confidence: number;
    status: string;
    customer?: string;
    sourceIp?: string;
    requestCount?: number;
    severity?: string;
    attackType?: string;
  };
}

interface DashboardData {
  stats: {
    totalTransactions: number;
    fraudulentTransactions: number;
    dosAttacks: number;
  };
  recentAlerts: Alert[];
  chartData: {
    transactions: {
      name: string;
      value: number;
    }[];
  };
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/dashboard");
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        const data = await response.json();
        setData(data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    // Refresh data every minute
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Prepare data for transaction pie chart
  const transactionPieData = data?.chartData.transactions || [];

  // Prepare data for bar chart
  const barChartData = [
    {
      name: "Transactions",
      Total: data?.stats.totalTransactions || 0,
      Fraud: data?.stats.fraudulentTransactions || 0,
      "Non-Fraud":
        (data?.stats.totalTransactions || 0) -
        (data?.stats.fraudulentTransactions || 0),
    },
    {
      name: "Attacks",
      "DoS Attacks": data?.stats.dosAttacks || 0,
    },
  ];

  if (loading) {
    return <div>Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!data) {
    return <div>No dashboard data available</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stats.totalTransactions.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Fraudulent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data.stats.fraudulentTransactions.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              DoS Attacks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {data.stats.dosAttacks.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={transactionPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {transactionPieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.name === "Fraud" ? "#ef4444" : "#22c55e"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Statistics</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Total" fill="#3b82f6" />
                <Bar dataKey="Fraud" fill="#ef4444" />
                <Bar dataKey="Non-Fraud" fill="#22c55e" />
                <Bar dataKey="DoS Attacks" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Latest Alerts */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Latest Alerts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.recentAlerts.map((alert, index) => (
            <Card
              key={index}
              className={`border-l-4 ${
                alert.type === "fraud"
                  ? "border-l-red-500"
                  : "border-l-orange-500"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-medium">
                    {alert.type === "fraud"
                      ? "Latest Fraud Alert"
                      : "Latest DoS Alert"}
                  </CardTitle>
                  <span
                    className={`px-2 py-1 text-sm rounded-full ${
                      alert.type === "fraud"
                        ? "bg-red-100 text-red-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {alert.details.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alert.type === "fraud" ? (
                    <>
                      <div>
                        <span className="font-medium">Transaction: </span>
                        {alert.details.transactionId}
                      </div>
                      <div>
                        <span className="font-medium">Customer: </span>
                        {alert.details.customer}
                      </div>
                      <div>
                        <span className="font-medium">Amount: </span>$
                        {alert.details.amount?.toFixed(2)}
                      </div>
                      <div>
                        <span className="font-medium">Merchant: </span>
                        {alert.details.merchant}
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="font-medium">Source IP: </span>
                        {alert.details.sourceIp}
                      </div>
                      <div>
                        <span className="font-medium">Attack Type: </span>
                        {alert.details.attackType}
                      </div>
                      <div>
                        <span className="font-medium">Requests: </span>
                        {alert.details.requestCount}
                      </div>
                      <div>
                        <span className="font-medium">Severity: </span>
                        {alert.details.severity}
                      </div>
                    </>
                  )}
                  <div>
                    <span className="font-medium">Time: </span>
                    {format(new Date(alert.timestamp), "PPpp")}
                  </div>
                  <div>
                    <span className="font-medium">Confidence: </span>
                    {alert.details.confidence.toFixed(1)}%
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {data.recentAlerts.length === 0 && (
            <div className="col-span-2 text-center py-8 text-gray-500">
              No alerts available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
