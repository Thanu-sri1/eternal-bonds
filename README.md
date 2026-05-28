# Matrimony Microservices Application

A premium, responsive, and animated matrimony web application structured as **4 separate microservices** sharing a single **MongoDB** database. Designed for easy deployment to **Azure App Service**.

## Folder Structure

```
matrimony/
├── package.json               # Root coordinator
├── README.md                  # Deployment & setup documentation
├── frontend-service/          # Serves HTML, CSS, client-side JS & dynamic backend configs
├── user-service/              # Manages user accounts, authentication (mock), & profiles
├── match-service/             # Manages matchmaking recommendations & search queries
└── connection-service/        # Manages sending, accepting, and tracking match requests
```

---

## Local Setup

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB running locally (default: `mongodb://localhost:27017/matrimony`) or MongoDB Atlas URI

### Installation
From the root folder, run:
```bash
npm run install:all
```
This runs `npm install` in the root and in all 4 microservices directories.

### Running Locally
To run all 4 microservices simultaneously for local development:
```bash
npm run dev
```

The services will start on the following ports:
- **Frontend / UI Service:** `http://localhost:3000`
- **User Service:** `http://localhost:5001`
- **Match Service:** `http://localhost:5002`
- **Connection Service:** `http://localhost:5003`

Open `http://localhost:3000` in your web browser. The application will automatically seed the database with sample profiles on the first run.

---

## Azure App Service Deployment

Since this application is built with a microservice architecture, each of the four directories is deployed to a separate **Azure App Service** instance.

### Step 1: Create the Web Apps in Azure
Create four different Web Apps in Azure with the **Node.js 18+ (Linux)** runtime:
1. `matrimony-frontend`
2. `matrimony-user-service`
3. `matrimony-match-service`
4. `matrimony-connection-service`

### Step 2: Configure Environment Variables in Azure

#### For the Backend Services (`user-service`, `match-service`, `connection-service`):
Go to **Settings > Configuration > Application settings** in each App Service and add:
- `MONGO_URI`: The connection string to your MongoDB Database (e.g., MongoDB Atlas or Azure Cosmos DB MongoDB API).
- `PORT`: (Managed automatically by Azure, but defaults internally to process-level bindings).

#### For the Frontend Service (`frontend-service`):
Add the following Application settings to let the web UI communicate with the backends:
- `USER_SERVICE_URL`: The URL of your deployed User Service (e.g., `https://matrimony-user-service.azurewebsites.net`)
- `MATCH_SERVICE_URL`: The URL of your deployed Match Service (e.g., `https://matrimony-match-service.azurewebsites.net`)
- `CONNECTION_SERVICE_URL`: The URL of your deployed Connection Service (e.g., `https://matrimony-connection-service.azurewebsites.net`)

### Step 3: Deploy the Code
You can deploy using GitHub Actions, Azure CLI, or VS Code.

#### Deploying via GitHub Actions (Monorepo setup):
In your GitHub workflow file for each App Service, specify the respective directory using the `package.json` location:

For Frontend Service:
```yaml
- name: 'Deploy Web App'
  uses: azure/webapps-deploy@v2
  with:
    app-name: 'matrimony-frontend'
    package: 'frontend-service'
```
*(Repeat similarly for `user-service`, `match-service`, and `connection-service` paths).*
