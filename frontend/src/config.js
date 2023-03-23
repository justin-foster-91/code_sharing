if(process.env.REACT_APP_ENVIRONMENT === "development"){
  console.log('ENDPOINT: Local host');
} else {
  console.log('ENDPOINT: Heroku');
}

export default {
  API_ENDPOINT: (process.env.REACT_APP_ENVIRONMENT === "development" ? 
    process.env.REACT_APP_DEV_API_ENDPOINT : 
    process.env.REACT_APP_PROD_API_ENDPOINT),
  SOCKET_URL: (process.env.REACT_APP_ENVIRONMENT === "development" ? 
    process.env.REACT_APP_DEV_SOCKET_URL : 
    process.env.REACT_APP_PROD_SOCKET_URL),
  TOKEN_KEY: process.env.REACT_APP_TOKEN_KEY
}
