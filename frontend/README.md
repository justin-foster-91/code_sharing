## Installation

# The Docker Way

Use this `.env` file:

```
REACT_APP_API_ENDPOINT='http://localhost:8000'
REACT_APP_TOKEN_KEY='token-storage-key'
```

Build the image:

```
docker build . -t code_sharing-frontend
```


# The Not-Docker Way

Clone the repo

`npm install`

Put the following into your .env file on the root level
```
REACT_APP_API_ENDPOINT='http://localhost:8000'
REACT_APP_TOKEN_KEY='token-storage-key'
```
  
`npm start`



Node 12
