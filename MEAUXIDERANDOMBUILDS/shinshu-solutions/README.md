# Shinshu Solutions API

Cloudflare Worker API for Shinshu Solutions business management system.

## 🚀 Deployment Status

✅ **Worker**: `https://shinshu-solutions.meauxbility.workers.dev`  
✅ **D1 Database**: `shinshu-solutions` (ID: `071a4f1b-da85-4bdb-a32a-de3e608269d3`)  
✅ **R2 Bucket**: `shinshu-solutions` (Documents storage)

## 📊 Database Schema

### Tables Created:
- ✅ `clients` - Client information
- ✅ `contacts` - Contact persons linked to clients
- ✅ `properties` - Real estate properties
- ✅ `projects` - Projects (construction, renovation, etc.)
- ✅ `services` - Services within projects
- ✅ `documents` - Document storage (linked to R2)

## 🔌 API Endpoints

### Base URL
```
https://shinshu-solutions.meauxbility.workers.dev
```

### Clients
- `GET /api/clients` - List all clients
- `GET /api/clients/{id}` - Get single client
- `POST /api/clients` - Create client
- `PUT /api/clients/{id}` - Update client
- `DELETE /api/clients/{id}` - Delete client

### Properties
- `GET /api/properties` - List all properties
- `GET /api/properties?client_id={id}` - List properties for client
- `GET /api/properties/{id}` - Get single property
- `POST /api/properties` - Create property
- `PUT /api/properties/{id}` - Update property
- `DELETE /api/properties/{id}` - Delete property

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects?client_id={id}` - List projects for client
- `GET /api/projects?property_id={id}` - List projects for property
- `GET /api/projects?status={status}` - Filter by status
- `GET /api/projects/{id}` - Get single project
- `POST /api/projects` - Create project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Services
- `GET /api/services` - List all services
- `GET /api/services?project_id={id}` - List services for project
- `GET /api/services/{id}` - Get single service
- `POST /api/services` - Create service
- `PUT /api/services/{id}` - Update service
- `DELETE /api/services/{id}` - Delete service

### Contacts
- `GET /api/contacts` - List all contacts
- `GET /api/contacts?client_id={id}` - List contacts for client
- `GET /api/contacts/{id}` - Get single contact
- `POST /api/contacts` - Create contact
- `PUT /api/contacts/{id}` - Update contact
- `DELETE /api/contacts/{id}` - Delete contact

### Documents
- `GET /api/documents` - List all documents
- `GET /api/documents?client_id={id}` - List documents for client
- `GET /api/documents?property_id={id}` - List documents for property
- `GET /api/documents?project_id={id}` - List documents for project
- `GET /api/documents/{id}` - Get document metadata
- `GET /api/documents/download/{id}` - Download document file
- `POST /api/documents` - Upload document (multipart/form-data)
- `DELETE /api/documents/{id}` - Delete document

## 📝 Example API Calls

### Create a Client
```bash
curl -X POST https://shinshu-solutions.meauxbility.workers.dev/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ABC Corporation",
    "email": "contact@abccorp.com",
    "phone": "555-1234",
    "company": "ABC Corp",
    "address": "123 Main St",
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90001"
  }'
```

### Create a Property
```bash
curl -X POST https://shinshu-solutions.meauxbility.workers.dev/api/properties \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "client-1234567890-abc123",
    "name": "Downtown Office Building",
    "address": "456 Business Ave",
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90002",
    "property_type": "commercial",
    "square_feet": 5000,
    "status": "active"
  }'
```

### Create a Project
```bash
curl -X POST https://shinshu-solutions.meauxbility.workers.dev/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "client-1234567890-abc123",
    "property_id": "prop-1234567890-xyz789",
    "name": "Office Renovation",
    "description": "Complete interior renovation",
    "project_type": "renovation",
    "status": "planning",
    "budget": 50000,
    "priority": "high"
  }'
```

### Upload a Document
```bash
curl -X POST https://shinshu-solutions.meauxbility.workers.dev/api/documents \
  -F "file=@/path/to/document.pdf" \
  -F "name=Contract Agreement" \
  -F "client_id=client-1234567890-abc123" \
  -F "category=contract"
```

## 🛠️ Development

### Local Development
```bash
cd shinshu-solutions
wrangler dev
```

### Deploy
```bash
wrangler deploy --env production
```

### Database Migrations
```bash
# Run schema
wrangler d1 execute shinshu-solutions --remote --file=src/schema.sql

# Query database
wrangler d1 execute shinshu-solutions --remote --command="SELECT * FROM clients LIMIT 10"
```

## 📦 Project Structure

```
shinshu-solutions/
├── wrangler.toml          # Cloudflare Worker configuration
├── src/
│   ├── worker.js          # Main API worker
│   └── schema.sql        # Database schema
└── README.md             # This file
```

## 🔐 Security Notes

- CORS is currently open (`*`) - restrict in production
- No authentication implemented yet - add JWT/auth as needed
- R2 documents are private - access via API only

## 🚀 Next Steps

1. Add authentication/authorization
2. Add rate limiting
3. Add input validation
4. Add pagination for list endpoints
5. Add search/filtering capabilities
6. Create frontend dashboard
