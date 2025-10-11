## To build the image
docker build -t vite-react-dev -f Dockerfile.dev .  

## To run the container and also to recreate the image
docker compose up -d --build