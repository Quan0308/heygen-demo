# Character AI

### 1. Build the Docker Image

- Add .env in root dir

```bash
NEXT_PUBLIC_HEYGEN_API_KEY=
NEXT_PUBLIC_API_ENDPOINT=
```

- Run the following command to build the Docker image:

```bash
docker build -t my-app-image .
```

### 2. Run the Docker Container

- Run the following command to build the Docker image:

```bash
docker run -p 3000:3000 my-app-image
```

### 3. Test Character

- Open web link

```bash
http://localhost:3000
```

- Click `start session` to start the character AI
