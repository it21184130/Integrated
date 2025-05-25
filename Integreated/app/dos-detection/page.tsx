"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DoSDetectionPage() {
  const [detectionResult, setDetectionResult] = useState<{
    confidence: string;
    label: string;
  } | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState("");
  const [captureHistory, setCaptureHistory] = useState<
    Array<{ timestamp: string; result: { confidence: string; label: string } }>
  >([]);

  // Check if capture is already running when the component mounts
  useEffect(() => {
    const checkCaptureStatus = async () => {
      try {
        const response = await fetch('/api/dos-detection');
        const data = await response.json();
        setIsCapturing(data.status === 'running');
      } catch (error) {
        console.error('Failed to check capture status:', error);
      }
    };

    checkCaptureStatus();
  }, []);

  // Start capturing network traffic
  const startCapturing = async () => {
    try {
      setCaptureError("");
      setIsCapturing(true);

      // Call the API to start capturing
      const response = await fetch('/api/dos-detection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'start' }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start capturing: ${response.statusText}`);
      }

      // Set up interval to poll for results
      const intervalId = setInterval(async () => {
        try {
          // In a real implementation, you would poll an endpoint that returns the latest detection result
          // For demo purposes, we'll simulate a response
          const simulatedResult = {
            confidence: Math.floor(70 + Math.random() * 30) + "." + Math.floor(Math.random() * 100) + " %",
            label: Math.random() > 0.2 ? "Normal" : "DoS Attack"
          };
          
          setDetectionResult(simulatedResult);
          setCaptureHistory(prev => [
            { timestamp: new Date().toISOString(), result: simulatedResult },
            ...prev.slice(0, 19) // Keep only the 20 most recent entries
          ]);
        } catch (error) {
          console.error('Failed to fetch detection results:', error);
        }
      }, 5000); // Poll every 5 seconds

      // Cleanup interval on component unmount or when capturing stops
      return () => clearInterval(intervalId);
    } catch (error) {
      setCaptureError('Failed to start capturing: ' + (error instanceof Error ? error.message : String(error)));
      setIsCapturing(false);
    }
  };

  // Stop capturing network traffic
  const stopCapturing = async () => {
    try {
      // Call the API to stop capturing
      const response = await fetch('/api/dos-detection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'stop' }),
      });

      if (!response.ok) {
        throw new Error(`Failed to stop capturing: ${response.statusText}`);
      }

      setIsCapturing(false);
    } catch (error) {
      console.error('Failed to stop capturing:', error);
      setCaptureError('Failed to stop capturing: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">DoS Detection</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detection Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Network Traffic Analysis</CardTitle>
            <CardDescription>
              Capture and analyze network traffic to detect potential DoS
              attacks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Click the button below to start capturing network traffic for
                DoS detection.
              </p>

              {isCapturing ? (
                <div className="flex items-center gap-4">
                  <div className="animate-pulse h-4 w-4 rounded-full bg-red-500"></div>
                  <p>Capturing traffic...</p>
                </div>
              ) : null}

              {captureError ? (
                <div className="text-red-500 text-sm">{captureError}</div>
              ) : null}
            </div>
          </CardContent>
          <CardFooter>
            {isCapturing ? (
              <Button variant="destructive" onClick={stopCapturing}>
                Stop Capturing
              </Button>
            ) : (
              <Button onClick={startCapturing}>Start Capturing</Button>
            )}
          </CardFooter>
        </Card>

        {/* Latest Detection Result */}
        <Card>
          <CardHeader>
            <CardTitle>Detection Result</CardTitle>
            <CardDescription>
              The latest result from DoS detection analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {detectionResult ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Confidence:</span>
                  <span className="text-right">
                    {detectionResult.confidence}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Classification:</span>
                  <span
                    className={`text-right font-semibold ${
                      detectionResult.label === "Normal"
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {detectionResult.label}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No detection results available. Start capturing to analyze
                traffic.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detection History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Detection History</CardTitle>
          <CardDescription>Recent DoS detection results</CardDescription>
        </CardHeader>
        <CardContent>
          {captureHistory.length > 0 ? (
            <div className="space-y-4">
              {captureHistory.map((entry, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row justify-between border-b pb-3 last:border-0"
                >
                  <div className="text-sm text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                  <div className="flex gap-4">
                    <span>Confidence: {entry.result.confidence}</span>
                    <span
                      className={`font-semibold ${
                        entry.result.label === "Normal"
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {entry.result.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No historical data available.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
