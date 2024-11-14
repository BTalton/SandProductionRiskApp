// Import Firebase services from firebaseConfig.js
import { auth, db } from "./firebaseConfig.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, getDocs, collection } from "firebase/firestore";
import { getAnalytics, logEvent } from "firebase/analytics";

let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics();
}

let lastFlowRate = null;
let lastSandConcentration = null;
let lastRiskScore = null;

// Show guest mode and configure settings
function showGuestMode() {
  document.getElementById("authContainer").style.display = "none";
  document.getElementById("appContent").style.display = "block";
  document.getElementById("profileContainer").style.display = "none";
  document.getElementById("saveAssessmentButton").style.display = "none";
  document.getElementById("returnHomeButton").style.display = "block";
  resetAssessment();
}

// Show login form
function showLoginForm() {
  document.getElementById("authContainer").style.display = "none";
  document.getElementById("loginForm").style.display = "block";
}

// Hide login form
function hideLoginForm() {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("authContainer").style.display = "block";
}

// Return to Home screen from Guest mode
function returnToHome() {
  document.getElementById("appContent").style.display = "none";
  document.getElementById("authContainer").style.display = "block";
  resetAssessment();
}

// Login for registered users
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Logged in successfully!");
    showRegisteredUserMode();
    document.getElementById("usernameDisplay").textContent = email;

    if (analytics) {
      logEvent(analytics, "login", { method: "email" });
    }
  } catch (error) {
    console.error("Login error:", error.message);
    alert("Login failed: " + error.message);
  }
}

// Register new users
async function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Registration successful!");
    hideLoginForm();

    if (analytics) {
      logEvent(analytics, "sign_up", { method: "email" });
    }
  } catch (error) {
    console.error("Registration error:", error.message);
    alert("Registration failed: " + error.message);
  }
}

// Show Registered User Mode
function showRegisteredUserMode() {
  document.getElementById("authContainer").style.display = "none";
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("appContent").style.display = "block";
  document.getElementById("profileContainer").style.display = "block";
  document.getElementById("saveAssessmentButton").style.display = "inline";
  document.getElementById("returnHomeButton").style.display = "block";
}

// Reset assessment data
function resetAssessment() {
  lastFlowRate = null;
  lastSandConcentration = null;
  lastRiskScore = null;
  document.getElementById("result").innerHTML = "";
  if (window.currentChart) window.currentChart.destroy();
}

// Assess Risk function with recommendations
function assessRisk() {
  const flowRate = parseFloat(document.getElementById("flowRate").value) || 750;
  const sandConcentration = parseFloat(document.getElementById("sandConcentration").value) || 250;

  const riskScore = flowRate * 0.4 + sandConcentration * 0.3;
  lastFlowRate = flowRate;
  lastSandConcentration = sandConcentration;
  lastRiskScore = riskScore;

  const risk = determineRiskLevel(riskScore);
  document.getElementById("result").innerHTML = `
    <strong style="color:${risk.color}; font-size: 1.2em;">Risk Level: ${risk.level}</strong>
    <p>${risk.factors}</p>
    <p>${risk.recommendation}</p>
  `;

  updateGraph();
}

// Determine risk level with recommendations
function determineRiskLevel(riskScore) {
  if (riskScore > 800) {
    return { level: "High", factors: "Conditions exceed safe limits.", recommendation: "Immediate action recommended.", color: "red" };
  }
  if (riskScore > 600) {
    return { level: "Medium", factors: "Approaching critical limits.", recommendation: "Monitor closely and adjust as needed.", color: "orange" };
  }
  return { level: "Low", factors: "Within safe limits.", recommendation: "Stable conditions; continue monitoring.", color: "green" };
}

// Update graph display based on selected type
function updateGraph() {
  const ctx = document.getElementById("assessmentChart").getContext("2d");
  const graphType = document.getElementById("graphType").value;

  let chartData;
  if (graphType === "scatter") {
    chartData = {
      type: "scatter",
      data: {
        datasets: [{
          label: "Risk Assessment",
          data: [{ x: lastFlowRate, y: lastSandConcentration }],
          backgroundColor: lastRiskScore > 800 ? "red" : lastRiskScore > 600 ? "orange" : "green"
        }]
      },
      options: {
        scales: {
          x: { title: { display: true, text: "Flow Rate" } },
          y: { title: { display: true, text: "Sand Concentration" } }
        }
      }
    };
  } else if (graphType === "line") {
    chartData = {
      type: "line",
      data: {
        labels: ["Flow Rate", "Sand Concentration"],
        datasets: [{
          label: "Risk Score",
          data: [lastFlowRate, lastSandConcentration],
          borderColor: "blue",
          borderWidth: 2
        }]
      }
    };
  } else if (graphType === "radar") {
    chartData = {
      type: "radar",
      data: {
        labels: ["Flow Rate", "Sand Concentration", "Risk Score"],
        datasets: [{
          label: "Risk Factors",
          data: [lastFlowRate, lastSandConcentration, lastRiskScore],
          backgroundColor: "rgba(255, 99, 132, 0.3)",
          borderColor: "rgba(255, 99, 132, 1)"
        }]
      }
    };
  }

  if (window.currentChart) window.currentChart.destroy();
  window.currentChart = new Chart(ctx, chartData);
}

// Save assessment function for registered users
async function saveAssessment() {
  if (!auth.currentUser) {
    alert("You must be logged in to save assessments.");
    return;
  }

  const assessmentData = {
    flowRate: lastFlowRate,
    sandConcentration: lastSandConcentration,
    riskScore: lastRiskScore,
    timestamp: new Date().toISOString()
  };

  try {
    const userId = auth.currentUser.uid;
    await setDoc(doc(collection(db, `users/${userId}/assessments`)), assessmentData);
    alert("Assessment saved successfully!");

    if (analytics) {
      logEvent(analytics, "save_assessment");
    }
  } catch (error) {
    console.error("Error saving assessment:", error);
    alert("Failed to save assessment.");
  }
}

// Updated View Profile function with enhanced logging
async function viewProfile() {
  document.getElementById("appContent").style.display = "none";
  document.getElementById("profileData").style.display = "block";
  document.getElementById("savedAssessments").style.display = "block";
  
  const userId = auth.currentUser ? auth.currentUser.uid : null;
  if (!userId) {
    console.error("User not authenticated. Cannot load profile data.");
    alert("User not authenticated. Please log in again.");
    return;
  }

  console.log("Loading profile for user:", userId);

  const assessmentsRef = collection(db, `users/${userId}/assessments`);

  try {
    const querySnapshot = await getDocs(assessmentsRef);
    console.log("Fetched assessments query snapshot:", querySnapshot);

    const savedAssessmentsDiv = document.getElementById("savedAssessments");
    savedAssessmentsDiv.innerHTML = "<h3>Saved Assessments</h3>";

    if (querySnapshot.empty) {
      savedAssessmentsDiv.innerHTML += "<p>No saved assessments found.</p>";
    } else {
      querySnapshot.forEach((doc) => {
        const assessment = doc.data();
        console.log("Assessment data:", assessment);

        const assessmentDiv = document.createElement("div");
        assessmentDiv.className = "saved-assessment";
        assessmentDiv.innerHTML = `
          <p><strong>Flow Rate:</strong> ${assessment.flowRate} bbl/day</p>
          <p><strong>Sand Concentration:</strong> ${assessment.sandConcentration} ppm</p>
          <p><strong>Risk Score:</strong> ${assessment.riskScore}</p>
          <p><strong>Date:</strong> ${new Date(assessment.timestamp).toLocaleString()}</p>
        `;
        
        savedAssessmentsDiv.appendChild(assessmentDiv);
      });
    }
  } catch (error) {
    console.error("Error fetching assessments:", error);
    alert("Failed to load saved assessments. Please try again.");
  }
}

// Go back to assessment screen from profile
function goBackToAssessment() {
  document.getElementById("profileData").style.display = "none";
  document.getElementById("appContent").style.display = "block";
}

// Logout function
function signOutUser() {
  signOut(auth).then(() => {
    alert("Logged out successfully!");
    document.getElementById("appContent").style.display = "none";
    document.getElementById("authContainer").style.display = "block";
    resetAssessment();
  }).catch((error) => {
    console.error("Error signing out:", error);
  });
}

// Toggle theme
function toggleTheme() {
  const theme = document.getElementById("themeToggle").value;
  document.body.className = theme === "dark" ? "dark-mode" : "light-mode";
}

// Toggle profile menu visibility
function toggleProfileMenu() {
  const profileMenu = document.getElementById("profileMenu");
  profileMenu.style.display = profileMenu.style.display === "none" ? "block" : "none";
}

// Attach all functions to window for global access
window.showGuestMode = showGuestMode;
window.showLoginForm = showLoginForm;
window.hideLoginForm = hideLoginForm;
window.returnToHome = returnToHome;
window.login = login;
window.register = register;
window.toggleTheme = toggleTheme;
window.toggleProfileMenu = toggleProfileMenu;
window.viewProfile = viewProfile;
window.goBackToAssessment = goBackToAssessment;
window.signOutUser = signOutUser;
window.assessRisk = assessRisk;
window.resetAssessment = resetAssessment;
window.updateGraph = updateGraph;
window.saveAssessment = saveAssessment;
