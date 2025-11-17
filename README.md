# galeria-docker

## Cloudinary

This project can list images stored on Cloudinary. You can configure Cloudinary in one of two ways:

- Using a single URL (recommended):

	```env
	CLOUDINARY_URL=cloudinary://<your_api_key>:<your_api_secret>@<your_cloud_name>
	```

- Or using separate variables:

	```env
	CLOUDINARY_CLOUD_NAME=your_cloud_name
	CLOUDINARY_API_KEY=your_api_key
	CLOUDINARY_API_SECRET=your_api_secret
	```

After configuring environment variables, call the endpoint:

- GET /api/cloudinary/imagenes — returns a JSON array with your uploaded images (up to 100 results by default).

Filtering by folder

You can list images from a specific Cloudinary folder in two ways:

- Pass the folder name as a query parameter (URL-encoded if it contains spaces):

	```
	GET /api/cloudinary/imagenes?folder=disnep%20clone
	```

- Or set the `CLOUDINARY_FOLDER` environment variable to the folder name (`disnep clone`).

If neither form is provided the endpoint will list images from the whole account (up to 100 results) or return a 500 error if Cloudinary credentials are missing.

## Unsplash

You can also fetch 20 random images from Unsplash. To enable this, set the environment variable:

```env
UNSPLASH_ACCESS_KEY=your_unsplash_access_key
```

Endpoint:

```
GET /api/unsplash/imagenes
```

The endpoint returns a JSON array with up to 20 random photos from Unsplash (fields: id, url, thumb, alt_description, width, height, likes, user).

## Continuous Integration with Jenkins

This repository includes a `Jenkinsfile` (Declarative pipeline) with steps to build the Client and Server and to build Docker images for both services.

Quick setup notes for Jenkins:

- Create a new Multibranch Pipeline (or a Pipeline job) that points to this repository.
- Add a Secret Text credential in Jenkins named `UNSPLASH_ACCESS_KEY` containing your Unsplash access key (optional, the pipeline references it).
- If you want to push images to a Docker registry, set the job/pipeline environment variables:
	- `DOCKER_REGISTRY` (e.g. `docker.io/youruser`)
	- `DOCKER_CREDENTIALS_ID` (Jenkins credentials id that stores username/password for the registry)

What the pipeline does:

- Checkout the repository.
- Install and build the Client (`npm ci` + `npm run build` in `Client`).
- Install Server dependencies (`npm ci` in `Server`).
- Build Docker images for Server and Client, tag them with `${BUILD_NUMBER}-${GIT_COMMIT}`.
- Optionally login to your Docker registry and push images (if `DOCKER_REGISTRY` and `DOCKER_CREDENTIALS_ID` are set).

Notes and troubleshooting:

- The pipeline assumes your Jenkins agent has Docker and Node.js (with npm) installed and the agent user can run Docker commands.
- On Linux agents you may need to add the Jenkins user to the `docker` group or run the agent inside Docker-in-Docker setup.
- To run the pipeline locally for testing, you can run the same commands manually in the repo root:

```bash
# Client build
cd Client
npm ci
npm run build

# Server install
cd ../Server
npm ci

# Build images
cd ..
docker build -t galeria-server:local -f Server/Dockerfile Server
docker build -t galeria-client:local -f Client/Dockerfile Client
```

If you want, I can: add unit-test steps, add a small docker-compose for integration tests, or convert the pipeline to a scripted pipeline — tell me which you prefer.