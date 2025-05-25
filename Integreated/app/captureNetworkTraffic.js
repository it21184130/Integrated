const { exec } = require("child_process");
const axios = require("axios");

// Use the environment variable if available, otherwise fall back to localhost
const DOS_DETECTION_ENDPOINT =
  process.env.DOS_DETECTION_ENDPOINT || "http://localhost:5001/dos";

function captureNetworkTraffic() {
  console.log("Network traffic capture requires elevated privileges (sudo)");
  const tsharkCommand =
    "sudo tshark -i any -T fields -e frame.number -e frame.time -e ip.src -e ip.dst -e _ws.col.Protocol -e frame.len -e http.host -e _ws.col.Info";

  const tsharkProcess = exec(tsharkCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing tshark: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`tshark stderr: ${stderr}`);
      return;
    }

    // Process the output
    const lines = stdout.split("\n");
    lines.forEach((line) => {
      const fields = line.split("\t");
      if (fields.length >= 7) {
        const data = {
          "No.": parseInt(fields[0], 10),
          Time: fields[1],
          Source: fields[2],
          Destination: fields[3],
          Protocol: fields[4],
          Length: parseInt(fields[5], 10),
          Host: fields[6] || null,
          Info: fields[7] || "",
        };

        // Send data to the endpoint
        sendDataToEndpoint(data);
      }
    });
  });
}

async function sendDataToEndpoint(data) {
  try {
    console.log(`Sending data to ${DOS_DETECTION_ENDPOINT}`);
    const response = await axios.post(DOS_DETECTION_ENDPOINT, data);
    console.log("Response:", response.data);
    // Display the response in the UI
    displayResponse(response.data);
  } catch (error) {
    console.error("Error sending data:", error);
  }
}

function displayResponse(data) {
  // Implement UI update logic here
  console.log("Displaying response:", data);
  // This function would be implemented to update the UI
  // When using Next.js with React, you would typically use a state management solution
  // or a pub/sub pattern to update the UI components
}

// Start capturing network traffic
captureNetworkTraffic();
