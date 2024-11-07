function assessRisk() {
    const formationStrength = parseFloat(document.getElementById("formationStrength").value);
    const wellDepth = parseFloat(document.getElementById("wellDepth").value);
    const flowRate = parseFloat(document.getElementById("flowRate").value);
    const reservoirPressure = document.getElementById("reservoirPressure").value;
    const bottomholePressure = document.getElementById("bottomholePressure").value;
  
    let riskLevel;
    let explanation = "";
  
    // Check if advanced parameters are provided
    if (reservoirPressure && bottomholePressure) {
      // Convert inputs to numbers for advanced calculations
      const reservoirPressureVal = parseFloat(reservoirPressure);
      const bottomholePressureVal = parseFloat(bottomholePressure);
  
      // Critical Drawdown Pressure (CDP) calculation
      const effectiveStress = 0.8 * formationStrength; // Example approximation
      const CDP = formationStrength - effectiveStress;
  
      // Mohr-Coulomb failure criterion for a basic rock stability assessment
      const cohesion = 1000; // Example cohesion value, can be user-defined
      const internalFrictionAngle = 30; // Example friction angle in degrees
      const shearStress = cohesion + formationStrength * Math.tan(internalFrictionAngle * Math.PI / 180);
  
      // Risk Factor based on Flow Rate and Pressure
      const riskFactor = ((reservoirPressureVal - bottomholePressureVal) * flowRate) / formationStrength;
  
      // Advanced assessment with detailed explanations
      if (CDP < (reservoirPressureVal - bottomholePressureVal)) {
        riskLevel = "High (Advanced)";
        explanation = `High risk: CDP < pressure differential, indicating potential formation instability.`;
      } else if (riskFactor > 1) {
        riskLevel = "Medium (Advanced)";
        explanation = `Moderate risk due to flow rate and pressure conditions.`;
      } else {
        riskLevel = "Low (Advanced)";
        explanation = `Low risk: formation strength and current conditions suggest stability.`;
      }
  
      // Plot risk level on the chart
      plotRiskChart(riskFactor, shearStress);
  
    } else {
      // Basic assessment
      if (formationStrength < 3000 && wellDepth > 8000 && flowRate > 500) {
        riskLevel = "High (Basic)";
        explanation = `High risk: low formation strength, deep well, high flow rate.`;
      } else if (formationStrength < 5000 && wellDepth > 5000) {
        riskLevel = "Medium (Basic)";
        explanation = `Moderate risk: formation strength and depth conditions.`;
      } else {
        riskLevel = "Low (Basic)";
        explanation = `Low risk: stable conditions given the formation strength.`;
      }
  
      // Plot basic risk on the chart
      plotRiskChart(flowRate, formationStrength);
    }
  
    // Display the result with an explanation
    document.getElementById("result").innerHTML = `<strong>Sand Production Risk Level:</strong> ${riskLevel}<br><p>${explanation}</p>`;
  }
  
  // Function to plot the risk level chart
  function plotRiskChart(xValue, yValue) {
    const ctx = document.getElementById('riskChart').getContext('2d');
  
    // Chart.js configuration
    new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Current Risk',
          data: [{ x: xValue, y: yValue }],
          backgroundColor: 'red',
          pointRadius: 6,
        }, {
          label: 'Risk Threshold',
          data: [{ x: 1, y: 3000 }, { x: 500, y: 1000 }, { x: 1000, y: 5000 }],
          backgroundColor: 'rgba(0, 123, 255, 0.2)',
          borderColor: 'rgba(0, 123, 255, 0.8)',
          showLine: true,
          fill: false,
          pointRadius: 0,
        }],
      },
      options: {
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: 'Risk Factor / Flow Rate' },
            beginAtZero: true,
          },
          y: {
            title: { display: true, text: 'Shear Stress / Formation Strength' },
            beginAtZero: true,
          },
        },
        plugins: {
          legend: { display: true },
        },
      }
    });
  }
  