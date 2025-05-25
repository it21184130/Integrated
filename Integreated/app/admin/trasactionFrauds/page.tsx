"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import axios from "axios";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

interface FraudAlert {
  _id: string;
  timestamp: string;
  confidence: number;
  threshold_exceeded: boolean;
  attack_type: string;
  status: string;
  blocked: boolean;
  severity: string;
  prediction?: string;
  details: {
    card_number: string;
    merchant: string;
    category: string;
    amount: number;
    customer_name: string;
    gender: string;
    city: string;
    state: string;
    zip: string;
    street: string;
    lat: number;
    long: number;
    city_pop: number;
    job: string;
    dob: string;
    user_lat: number;
    user_lon: number;
  };
}

export default function FraudAlerts() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riskLevels, setRiskLevels] = useState({ High: 0, Medium: 0, Low: 0 });

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (value: number) => value * Math.PI / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  const COLORS = { High: "#FF0000", Medium: "#FFA500", Low: "#00FF00" };

  const fetchPrediction = async (alert: FraudAlert): Promise<string> => {
    try {
      const hour = new Date(alert.timestamp).getHours();
      const distance_km = calculateDistance(
        alert.details.lat,
        alert.details.long,
        alert.details.user_lat,
        alert.details.user_lon
      );
      const data = {
        amt: alert.details.amount,
        city_pop: alert.details.city_pop,
        hour,
        distance_km,
        category: 'category_'+alert.details.category,
      };

      console.log("Sending data for prediction:", data);
      const response = await axios.post("http://127.0.0.1:5000/predict", data);
      return JSON.stringify(response.data) || "Unknown";
    } catch (error) {
      console.error("Prediction error:", error);
      return "Prediction failed";
    }
  };

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/trasactionFraud");
        if (!response.ok) throw new Error("Failed to fetch fraud alerts");

        const data: FraudAlert[] = await response.json();

        const alertsWithPrediction = await Promise.all(
          data.map(async (alert) => {
            const prediction = await fetchPrediction(alert);
            return { ...alert, prediction };
          })
        );

        setAlerts(alertsWithPrediction);

        // Count risk levels
        const riskLevelCounts = alertsWithPrediction.reduce(
          (acc, alert) => {
            try {
              const prediction = JSON.parse(alert.prediction || "{}");
              const level = prediction.risk_level as keyof typeof acc || "Unknown";
              if (["High", "Medium", "Low"].includes(level)) {
                acc[level]++;
              }
            } catch {}
            return acc;
          },
          { High: 0, Medium: 0, Low: 0 }
        );

        setRiskLevels(riskLevelCounts);
      } catch (err) {
        console.error("Error fetching fraud alerts:", err);
        setError("Failed to load fraud transaction alerts");
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  if (loading) return <div>Loading fraud alerts...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Transaction Fraud Alerts</h1>
        <span className="text-sm text-gray-500">Fetched once on load</span>
      </div>

      {/* Bar chart for risk levels */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Transaction Risk Level Distribution</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={[
              { name: "High", count: riskLevels.High },
              { name: "Medium", count: riskLevels.Medium },
              { name: "Low", count: riskLevels.Low },
            ]}
          >
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count">
              <Cell fill="#ef4444" /> {/* High */}
              <Cell fill="#facc15" /> {/* Medium */}
              <Cell fill="#34d399" /> {/* Low */}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Fraud alerts list */}
      <div className="space-y-4">
        {alerts
        .filter((alert) => alert.attack_type === "Fraud")
        .map((alert, index) => (
          <Card
            key={alert._id}
            className={`border-l-4 ${alert.threshold_exceeded ? "border-l-red-500" : "border-l-green-500"}`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-medium">
                  Transaction {alert._id.slice(-8)}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-sm rounded-full ${
                      alert.threshold_exceeded ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                    }`}
                  >
                    {alert.attack_type}
                  </span>
                  {alert.prediction &&
                    (() => {
                      try {
                        const prediction = JSON.parse(alert.prediction);
                        return (
                          <div className="text-m text-black-600">
                            <span
                            className={`px-2 py-1 text-m rounded-full ${
                              alert.threshold_exceeded ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                            }`}
                          >
                              
                              Risk Probability: {prediction.risk_probability} %
                              </span>
                          </div>
                        );
                      } catch (e) {
                        return <div className="text-sm text-red-600">Invalid prediction format</div>;
                      }
                    })()}

                    {alert.prediction &&
                    (() => {
                      try {
                        const prediction = JSON.parse(alert.prediction);
                        return (
                          <div className="text-m text-black-600">
                               <span
                            className={`px-2 py-1 text-m rounded-full ${
                              alert.threshold_exceeded ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                            }`}
                          >
                              
                              Risk Level:
                              
                              
                              {prediction.risk_level}
                              
                              </span> 
                          </div>
                        );
                      } catch (e) {
                        return <div className="text-sm text-red-600">Invalid prediction format</div>;
                      }
                    })()}

                </div>
              </div>
            </CardHeader>

            {/* Donut chart for first transaction */}
            {index === 0 &&
              alert.prediction &&
              (() => {
                try {
                  const prediction = JSON.parse(alert.prediction);
                  console.log("Parsed prediction:", prediction);
                  const riskProbability = prediction.risk_probability || 0;
                  const safeProbability = 100 - riskProbability;

                  const chartData = [
                    { name: "Risk", value: riskProbability },
                    { name: "Safe", value: safeProbability },
                  ];

                  return (
                    <div className="mb-4 flex justify-center">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            innerRadius={40}
                            label
                          >
                            <Cell key="risk" fill={COLORS[prediction.risk_level as keyof typeof COLORS]} />
                            <Cell key="Safe" fill="#8E8E8E" />
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>

                      
                       {prediction.remediation_steps[0]}<br></br>
                       {prediction.remediation_steps[1]}<br></br>
                       {prediction.remediation_steps[2]}<br></br>

                    </div>
                  );
                } catch (e) {
                  return null;
                }
              })()}

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Customer: </span>
                    {alert.details.customer_name}
                  </div>

                  {alert.prediction &&
                    (() => {
                      try {
                        const prediction = JSON.parse(alert.prediction);
                        return (
                         <div className="text-sm text-blue-600">
                        <span className="font-medium">Model Prediction:</span>
                        <ol className="list-decimal list-inside mt-1">
                          {prediction.description
                            ?.split(/\d+\.\s+/)
                            .filter(Boolean)
                            .map((item: string, idx: number) => (
                              <li key={idx}>{item.trim()}</li>
                            ))}
                        </ol>
                      </div>
                        );
                      } catch (e) {
                        return <div className="text-sm text-red-600">Invalid prediction format</div>;
                      }
                    })()}

                  <div>
                    <span className="font-medium">Amount: </span>${alert.details.amount.toFixed(2)}
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Merchant: </span>
                    {alert.details.merchant}
                  </div>
                  <div>
                    <span className="font-medium">Location: </span>
                    {alert.details.city}, {alert.details.state}
                  </div>
                 
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {alerts.length === 0 && (
          <div className="text-center py-8 text-gray-500">No fraud alerts found</div>
        )}
      </div>
    </div>
  );
}
