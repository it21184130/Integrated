import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

const COLORS = { High: "#FF0000", Medium: "#FFA500", Low: "#00FF00" };

function ResultPage() {
  const { state } = useLocation();
  const [result, setResult] = useState(null);

  useEffect(() => {
    // Make sure we pass the correct data to the backend
    axios.post("http://127.0.0.1:5000/predict", state)
      .then((res) => setResult(res.data))
      .catch((err) => console.error("Error fetching prediction:", err));
  }, [state]);

  // Display loading state until result is available
  if (!result) return <p className="text-center mt-10">Loading...</p>;

  const { risk_probability, risk_level, description, remediation_steps } = result;
  const chartData = [
    { name: risk_level, value: risk_probability },
    { name: "Remaining", value: 100 - risk_probability }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-300">
      <h1 className="text-3xl font-bold mb-6 mt-6">Risk Prediction Dashboard</h1>
      
      <div className="bg-gray-600 p-6 rounded-lg shadow-md w-2/3 flex flex-col items-center">
        <h2 className="text-xl font-semibold">Risk Probability</h2>
        <PieChart width={350} height={350}>
           
          <Pie 
            data={chartData} 
            dataKey="value" 
            cx="50%" 
            cy="50%" 
            innerRadius={50} 
            outerRadius={80} 
            fill="#8884d8" 
            label 
          >
            <Cell key="risk" fill={COLORS[risk_level]} />
            <Cell key="remaining" fill="#e0e0e0" />
          </Pie>
          <Tooltip />
        </PieChart>
        <p className="text-lg font-semibold" style={{ color: COLORS[risk_level] }}>
          {risk_level} Risk ({(risk_probability).toFixed(2)}%)
        </p>
      </div>
  
      <div className="bg-white p-6 mt-6 rounded-lg shadow-md w-2/3">
        <h2 className="text-xl font-semibold mb-3">Remediation Steps</h2>
        <p className="text-gray-600 mb-4">{description}</p>
        <ul className="list-disc list-inside">
          {remediation_steps.map((step, index) => (
            <li key={index} className="text-gray-800">{step}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ResultPage;
