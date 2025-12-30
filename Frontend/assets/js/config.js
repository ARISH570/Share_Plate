// Only change THIS when switching prod backends
const PROD_BACKEND = "ec2"; // "ec2" | "render"

let API_BASE_URL;

if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
  // Local dev → automatic
  API_BASE_URL = "http://localhost:5500";
} else if (PROD_BACKEND === "ec2") {
  API_BASE_URL = "http://13.60.22.181:5500";
} else {
  API_BASE_URL = "https://share-plate-j9m4.onrender.com";
}

window.API_BASE_URL = API_BASE_URL;
