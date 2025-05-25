"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DosSimulatorPage() {
  const [simulationResult, setSimulationResult] = useState<{
    confidence: string;
    label: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState({
    "No.": 1,
    Time: "2025-03-16 10:00:54",
    Source: "192.168.97.22",
    Destination: "192.168.188.213",
    Protocol: "DNS",
    Length: 29000, // Initial value
    Host: null,
    Info: "",
  });

  // Loop-related state
  const [isLooping, setIsLooping] = useState(false);
  const [loopInterval, setLoopInterval] = useState(2000); // Default interval in ms
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [loopCount, setLoopCount] = useState(0);

  // Generate a random length value between 29,000 and 30,200
  const generateRandomLength = () => {
    return Math.floor(Math.random() * (30200 - 29000 + 1)) + 29000;
  };

  // Start the loop
  const startLoop = () => {
    if (isLooping) return; // Already looping

    setIsLooping(true);
    setLoopCount(0);

    // Run immediately first
    runDosSimulation();

    // Then set up the interval
    intervalRef.current = setInterval(() => {
      runDosSimulation();
      setLoopCount((prev) => prev + 1);
    }, loopInterval);
  };

  // Stop the loop
  const stopLoop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsLooping(false);
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Update packet length before each simulation
  useEffect(() => {
    if (isLoading) {
      setPayload((prev) => ({
        ...prev,
        Length: generateRandomLength(),
      }));
    }
  }, [isLoading]);

  // Simplified payload for display
  const displayPayload = {
    Time: payload.Time,
    Source: payload.Source,
    Destination: payload.Destination,
    Length: payload.Length,
  };

  const runDosSimulation = async () => {
    // Don't set loading if we're in a loop to avoid UI flashing
    if (!isLooping) {
      setIsLoading(true);
    }
    setError("");

    // Generate a new random length before simulation
    const newLength = generateRandomLength();
    const updatedPayload = {
      ...payload,
      Length: newLength,
    };
    setPayload(updatedPayload);

    try {
      const response = await fetch("http://localhost:5001/dos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedPayload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setSimulationResult(data);

      console.log("DoS simulation complete with result:", data);
    } catch (err) {
      console.error("Error during simulation:", err);
      setError(
        "Failed to run simulation. Please check if the DoS detection server is running."
      );

      // Stop the loop if there's an error
      if (isLooping) {
        stopLoop();
      }
    } finally {
      if (!isLooping) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">DoS Simulator</h1>
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>

      <Tabs defaultValue="single">
        <TabsList className="mb-4">
          <TabsTrigger value="single">Single Simulation</TabsTrigger>
          <TabsTrigger value="loop">Loop Simulation</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>DoS Attack Simulation</CardTitle>
                <CardDescription>
                  Simulate a DoS attack to test detection capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Click the button below to simulate a DoS attack. This will
                    send a request to the detection API with simulated traffic
                    characteristics of a DoS attack. Each simulation uses a
                    random packet length between 29,000 and 30,200 bytes.
                  </p>
                  <div className="p-4 bg-gray-100 rounded-md">
                    <h3 className="font-medium mb-2">Simulation Payload:</h3>
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(displayPayload, null, 2)}
                    </pre>
                  </div>
                  {error && <div className="text-red-500 text-sm">{error}</div>}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={runDosSimulation}
                  disabled={isLoading || isLooping}
                >
                  {isLoading ? "Simulating..." : "Simulate DoS Attack"}
                </Button>
              </CardFooter>
            </Card>

            <SimulationResultCard
              simulationResult={simulationResult}
              packetLength={payload.Length}
            />
          </div>
        </TabsContent>

        <TabsContent value="loop">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Automated DoS Simulation</CardTitle>
                <CardDescription>
                  Repeatedly simulate DoS attacks on a loop
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    This mode automatically sends simulated DoS attacks in a
                    loop with the specified time interval. This can be useful
                    for stress testing or demonstration purposes.
                  </p>

                  <div className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="loop-interval">Interval (ms)</Label>
                      <Input
                        id="loop-interval"
                        type="number"
                        value={loopInterval}
                        onChange={(e) =>
                          setLoopInterval(
                            Math.max(500, parseInt(e.target.value) || 2000)
                          )
                        }
                        min={500}
                        disabled={isLooping}
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum interval: 500ms
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-100 rounded-md">
                    <h3 className="font-medium mb-2">Loop Status:</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span
                          className={
                            isLooping
                              ? "text-green-600 font-medium"
                              : "text-gray-600"
                          }
                        >
                          {isLooping ? "Running" : "Stopped"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Simulations run:</span>
                        <span>{loopCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current packet length:</span>
                        <span>{payload.Length} bytes</span>
                      </div>
                    </div>
                  </div>

                  {error && <div className="text-red-500 text-sm">{error}</div>}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between space-x-4">
                <Button
                  onClick={startLoop}
                  disabled={isLooping || isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Start Loop
                </Button>
                <Button
                  onClick={stopLoop}
                  disabled={!isLooping}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Stop Loop
                </Button>
              </CardFooter>
            </Card>

            <SimulationResultCard
              simulationResult={simulationResult}
              packetLength={payload.Length}
              loopCount={loopCount}
              isLooping={isLooping}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Extracted component for result display
function SimulationResultCard({
  simulationResult,
  packetLength,
  loopCount,
  isLooping,
}: {
  simulationResult: any;
  packetLength: number;
  loopCount?: number;
  isLooping?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation Result</CardTitle>
        <CardDescription>
          Detection result from the simulated attack
          {isLooping && loopCount !== undefined && ` (loop #${loopCount})`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {simulationResult ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Confidence:</span>
              <span className="text-right">{simulationResult.confidence}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Classification:</span>
              <span
                className={`text-right font-semibold ${
                  simulationResult.label === "Normal"
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {simulationResult.label}
              </span>
            </div>
            {simulationResult.label === "Attack" && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm">
                <strong>Alert:</strong> A DoS attack was detected with packet
                length of {packetLength} bytes.
              </div>
            )}
            {isLooping && (
              <div className="mt-2 text-xs text-gray-500">
                Automatically running simulations...
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No simulation results available. Run a simulation to see results.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
