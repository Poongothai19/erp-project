

// const getBaseURL = () => {
//   const hostname = window.location.hostname;

//   if (hostname === "hub.prophecytechs.com") {
//     return "https://hub.prophecytechs.com";  // Hostinger
//   } else if (hostname === "prophechyerp.duckdns.org") {
//     return "http://prophechyerp.duckdns.org"; // IONOS
//   } else {
//     return "http://localhost:5000"; // Local development
//   }
// };

// const BASE_URL = getBaseURL();

// export default BASE_URL;



// url.js
const getBaseURL = () => {
  const hostname = window.location.hostname;

  if (hostname === "hub.prophecytechs.com") {
    return "https://hub.prophecytechs.com";        // Hostinger
  } else if (hostname === "prophechyerp.duckdns.org") {
    return "https://prophechyerp.duckdns.org";     // IONOS
  } else if (hostname === "devprophecyerp.com") {
    return "https://devprophecyerp.com/api";           // New domain
  } else {
    return "http://localhost:5000";                 // Local development
  }
};

const BASE_URL = getBaseURL();

export default BASE_URL;