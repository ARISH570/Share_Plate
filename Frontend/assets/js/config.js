let API_BASE_URL;

const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const isNetlify =
  window.location.hostname.includes("netlify.app");

if (isLocal) {
  API_BASE_URL = "http://localhost:5500";
} else if (isNetlify) {
  API_BASE_URL = "https://share-plate-j9m4.onrender.com";
} else {
  // AWS-hosted frontend
  API_BASE_URL = "https://13.60.17.20/5500";
}

window.API_BASE_URL = API_BASE_URL;
