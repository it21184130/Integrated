"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface NetworkPacket {
  id: string;
  timestamp: string;
  source: string;
  destination: string;
  protocol: string;
  size: number;
  status: "normal" | "suspicious" | "blocked";
  details?: {
    url?: string;
    userAgent?: string;
    referer?: string;
    requestCount?: number;
  };
}

interface TrafficStats {
  timestamp: number;
  packetsPerSecond: number;
  bytesPerSecond: number;
}

export default function NetworkMonitor() {
  const [packets, setPackets] = useState<NetworkPacket[]>([]);
  const [stats, setStats] = useState<TrafficStats[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trafficStats, setTrafficStats] = useState<any>(null);
  const [hideInternalRequests, setHideInternalRequests] = useState(true);

  useEffect(() => {
    // This effect initializes and manages real-time data updates
    let interval: NodeJS.Timeout;

    const fetchNetworkData = async () => {
      try {
        const response = await fetch("/api/network-monitor");
        if (!response.ok) throw new Error("Failed to fetch network data");

        const data = await response.json();

        // Update capturing state if it changed on the server
        if (data.isCapturing !== isCapturing) {
          setIsCapturing(data.isCapturing);
        }

        // Process packets
        if (data.packets && data.packets.length > 0) {
          setPackets(data.packets);
        }

        // Process time series data for charts
        if (data.timeSeriesData && data.timeSeriesData.length > 0) {
          setStats(data.timeSeriesData);
        }

        // Process traffic statistics
        if (data.stats) {
          setTrafficStats(data.stats);
        }
      } catch (err) {
        console.error("Error fetching network data:", err);
      }
    };

    // Always fetch real data regardless of capturing state
    // Fetch immediately on mount
    fetchNetworkData();

    // Set up polling interval - we'll poll more frequently when actively capturing
    interval = setInterval(fetchNetworkData, isCapturing ? 1000 : 5000);

    // Clean up interval on unmount or when capturing state changes
    return () => clearInterval(interval);
  }, [isCapturing]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "suspicious":
        return "bg-yellow-100 text-yellow-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const handleStartCapture = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/network-monitor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "start" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to start network capture");
      }

      setIsCapturing(true);
    } catch (err) {
      console.error("Error starting capture:", err);
      setError(
        typeof err === "object" && err !== null && "message" in err
          ? (err as Error).message
          : "Failed to start network monitoring"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStopCapture = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/network-monitor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "stop" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to stop network capture");
      }

      setIsCapturing(false);
    } catch (err) {
      console.error("Error stopping capture:", err);
      setError(
        typeof err === "object" && err !== null && "message" in err
          ? (err as Error).message
          : "Failed to stop network monitoring"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const renderPacketDetails = (packet: NetworkPacket) => {
    if (!packet.details) return null;

    return (
      <div className="mt-4 space-y-2 text-sm bg-gray-50 p-3 rounded-md">
        {packet.details.url && (
          <div>
            <span className="font-medium">URL: </span>
            <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
              {packet.details.url}
            </code>
          </div>
        )}
        {packet.details.requestCount && (
          <div>
            <span className="font-medium">Request Count: </span>
            <span
              className={
                packet.details.requestCount > 50 ? "text-red-600 font-bold" : ""
              }
            >
              {packet.details.requestCount} requests/min
            </span>
          </div>
        )}
        {packet.details.referer && (
          <div>
            <span className="font-medium">Referer: </span>
            <span className="text-gray-600">{packet.details.referer}</span>
          </div>
        )}
        {packet.details.userAgent && (
          <div>
            <span className="font-medium">User Agent: </span>
            <span className="text-gray-600 break-all">
              {packet.details.userAgent}
            </span>
          </div>
        )}
      </div>
    );
  };

  const getFilteredPackets = () => {
    if (!hideInternalRequests) {
      return packets;
    }

    return packets.filter((packet) => {
      const url = packet.details?.url || "";
      // Filter out internal API calls and monitoring endpoints
      return (
        !url.includes("/api/network-monitor") &&
        !url.includes("/api/log-request") &&
        !url.startsWith("/_next/")
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Network Traffic Monitor</h1>
        <div>
          {!isCapturing ? (
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              onClick={handleStartCapture}
              disabled={loading}
            >
              {loading ? "Starting..." : "Start Monitoring"}
            </button>
          ) : (
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              onClick={handleStopCapture}
              disabled={loading}
            >
              {loading ? "Stopping..." : "Stop Monitoring"}
            </button>
          )}
        </div>
      </div>

      {error && <div className="text-red-500 font-medium">{error}</div>}

      <Tabs defaultValue="traffic">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="traffic">Traffic Overview</TabsTrigger>
          <TabsTrigger value="packets">HTTP Requests</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        {/* Traffic chart tab */}
        <TabsContent value="traffic">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Traffic Rate</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={formatTimestamp}
                      label={{
                        value: "Time",
                        position: "insideBottomRight",
                        offset: 0,
                      }}
                    />
                    <YAxis
                      yAxisId="left"
                      label={{
                        value: "Requests/s",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      label={{
                        value: "Bytes/s",
                        angle: 90,
                        position: "insideRight",
                      }}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        value,
                        name === "packetsPerSecond" ? "Requests/s" : "Bytes/s",
                      ]}
                      labelFormatter={(label) =>
                        new Date(label).toLocaleTimeString()
                      }
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="packetsPerSecond"
                      stroke="#8884d8"
                      name="Requests/s"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="bytesPerSecond"
                      stroke="#82ca9d"
                      name="Bytes/s"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Network Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Status
                    </h3>
                    <p className="text-2xl font-bold">
                      {isCapturing ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-gray-600">Inactive</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Current Traffic
                    </h3>
                    <p className="text-2xl font-bold">
                      {stats.length > 0
                        ? `${stats[stats.length - 1].packetsPerSecond.toFixed(
                            2
                          )} req/s`
                        : "0 req/s"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Bandwidth
                    </h3>
                    <p className="text-2xl font-bold">
                      {stats.length > 0
                        ? `${Math.round(
                            stats[stats.length - 1].bytesPerSecond / 1024
                          )} KB/s`
                        : "0 KB/s"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Alerts
                    </h3>
                    <p className="text-2xl font-bold">
                      {packets.filter((p) => p.status !== "normal").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* HTTP requests tab */}
        <TabsContent value="packets">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Recent HTTP Requests</CardTitle>
              <div className="flex items-center space-x-2">
                <Switch
                  id="hide-internal"
                  checked={hideInternalRequests}
                  onCheckedChange={setHideInternalRequests}
                />
                <Label htmlFor="hide-internal">Hide Internal Requests</Label>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {getFilteredPackets().map((packet) => (
                    <Card
                      key={packet.id}
                      className={`border-l-4 ${
                        packet.status === "blocked"
                          ? "border-l-red-500"
                          : packet.status === "suspicious"
                          ? "border-l-yellow-500"
                          : "border-l-green-500"
                      }`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-sm font-medium">
                            {packet.details?.url || "HTTP Request"}
                          </CardTitle>
                          <Badge className={getStatusColor(packet.status)}>
                            {packet.status.charAt(0).toUpperCase() +
                              packet.status.slice(1)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="py-2 text-sm">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div>
                            <span className="font-medium">Source: </span>
                            {packet.source}
                          </div>
                          <div>
                            <span className="font-medium">Destination: </span>
                            {packet.destination}
                          </div>
                          <div>
                            <span className="font-medium">Protocol: </span>
                            {packet.protocol}
                          </div>
                          <div>
                            <span className="font-medium">Time: </span>
                            {new Date(packet.timestamp).toLocaleString()}
                          </div>
                        </div>
                        {renderPacketDetails(packet)}
                      </CardContent>
                    </Card>
                  ))}

                  {getFilteredPackets().length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {packets.length > 0
                        ? "All requests are filtered out. Disable the filter to see internal requests."
                        : "No HTTP requests captured yet. Start monitoring to see network traffic."}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats tab */}
        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Requested URLs</CardTitle>
              </CardHeader>
              <CardContent>
                {trafficStats?.topEndpoints?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>URL</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trafficStats.topEndpoints.map((endpoint: any) => (
                        <TableRow key={endpoint._id}>
                          <TableCell className="font-medium">
                            {endpoint._id}
                          </TableCell>
                          <TableCell className="text-right">
                            {endpoint.count}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Client IPs</CardTitle>
              </CardHeader>
              <CardContent>
                {trafficStats?.topIps?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP Address</TableHead>
                        <TableHead className="text-right">Requests</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trafficStats.topIps.map((ip: any) => (
                        <TableRow key={ip._id}>
                          <TableCell className="font-medium">
                            {ip._id}
                          </TableCell>
                          <TableCell className="text-right">
                            {ip.count}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Traffic Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-green-800 font-medium">Normal</h3>
                    <p className="text-2xl font-bold">
                      {trafficStats?.statusCounts?.normal || 0}
                    </p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h3 className="text-yellow-800 font-medium">Suspicious</h3>
                    <p className="text-2xl font-bold">
                      {trafficStats?.statusCounts?.suspicious || 0}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <h3 className="text-red-800 font-medium">Blocked</h3>
                    <p className="text-2xl font-bold">
                      {trafficStats?.statusCounts?.blocked || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
