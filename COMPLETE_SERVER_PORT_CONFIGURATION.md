# Complete Server Port Configuration
# Server: 209.182.236.204
# Last Updated: February 11, 2026

## SSH Access
| Service | Port | Protocol |
|---------|------|----------|
| SSH | 6150 | TCP |

## Web Services (Nginx Reverse Proxy)
| Service | Port | Protocol |
|---------|------|----------|
| Nginx HTTP | 80 | TCP |
| Nginx HTTPS | 443 | TCP |

## Application Ports (Docker Containers)

### indiaangelforum.com
| Container | Host Port | Container Port | Binding | Notes |
|-----------|-----------|---------------|---------|-------|
| iaf-app | 11160 | 3001 | 127.0.0.1 | Express API + Static frontend |
| iaf-db | 5433 | 5432 | 127.0.0.1 | PostgreSQL 16 |
| iaf-redis | — | 6379 | internal | Redis 7 (Docker network only) |

### kosansh.com
| Container | Host Port | Container Port | Binding | Notes |
|-----------|-----------|---------------|---------|-------|
| kosansh-frontend-prod | 8081 | 80 | 0.0.0.0 | Frontend |
| kosansh-backend-prod | 4003 | 4003 | 0.0.0.0 | Backend API |
| kosansh-postgres-prod | — | 5432 | internal | PostgreSQL |
| kosansh-redis-prod | — | 6379 | internal | Redis |

### donorshouse
| Container | Host Port | Container Port | Binding | Notes |
|-----------|-----------|---------------|---------|-------|
| donorshouse-frontend | 3000 | 80 | 127.0.0.1 | Frontend |
| donorshouse-backend | 8000 | 8000 | 127.0.0.1 | Backend API |
| donorshouse-postgres | — | 5432 | internal | PostgreSQL |

### bodylia
| Container | Host Port | Container Port | Binding | Notes |
|-----------|-----------|---------------|---------|-------|
| bodylia-frontend-1 | 8082 | 80 | 127.0.0.1 | Frontend |
| bodylia-backend-1 | 8083 | 8001 | 127.0.0.1 | Backend API |
| bodylia-postgres-1 | — | 5432 | internal | PostgreSQL |

### rinashah.art
| Container | Host Port | Container Port | Binding | Notes |
|-----------|-----------|---------------|---------|-------|
| rina-shah-art-1 | 11150 | 8080 | 0.0.0.0 | App |

### renovationplaza.com
| Container | Host Port | Container Port | Binding | Notes |
|-----------|-----------|---------------|---------|-------|
| renovationplaza | 11155 | 80 | 0.0.0.0 | App |

### surgeboom.com
| Container | Host Port | Container Port | Binding | Notes |
|-----------|-----------|---------------|---------|-------|
| surgeboom-app | 3001 | 3000 | 127.0.0.1 | App |

### techservices-store
| Container | Host Port | Container Port | Binding | Notes |
|-----------|-----------|---------------|---------|-------|
| techservices-store-app | 3010 | 3000 | 127.0.0.1 | App |

### tnhire
| Container | Host Port | Container Port | Binding | Notes |
|-----------|-----------|---------------|---------|-------|
| tnhire-app | 9050 | 9050 | 0.0.0.0 | App |
| tnhire-redis | 6380 | 6379 | 127.0.0.1 | Redis |
| tnhire-queue-worker | — | 9050 | internal | Worker |

### whatsmyethos
| Container | Host Port | Container Port | Binding | Notes |
|-----------|-----------|---------------|---------|-------|
| whatsmyethos-frontend | 9101 | 9101 | 127.0.0.1 | Frontend |
| whatsmyethos-api | 9100 | 9100 | 127.0.0.1 | Backend API |
| whatsmyethos-postgres | — | 5432 | internal | PostgreSQL |
| whatsmyethos-redis | — | 6379 | internal | Redis |

### bpocanada.com
| Container | Host Port | Container Port | Binding | Notes |
|-----------|-----------|---------------|---------|-------|
| bpocanada-prod | 11600 | 3000 | 0.0.0.0 | App |

### accesstech
| Container | Host Port | Container Port | Binding | Notes |
|-----------|-----------|---------------|---------|-------|
| accesstech-app | 9070 | 3000 | 0.0.0.0 | App |

### cogdina
| Container | Host Port | Container Port | Binding | Notes |
|-----------|-----------|---------------|---------|-------|
| cogdina-app | 8080 | 80 | 0.0.0.0 | App |

### gloscon
| Container | Host Port | Container Port | Binding | Notes |
|-----------|-----------|---------------|---------|-------|
| gloscon | 8095 | 8095 | 127.0.0.1 | App |

### newabilities
| Container | Host Port | Container Port | Binding | Notes |
|-----------|-----------|---------------|---------|-------|
| newabilities-app | 8090 | 8090 | 127.0.0.1 | App |

### automationstreet
| Container | Host Port | Container Port | Binding | Notes |
|-----------|-----------|---------------|---------|-------|
| automationstreet-app | 127 | 80 | 0.0.0.0 | App |

### Other Services
| Service | Port | Binding | Notes |
|---------|------|---------|-------|
| better-stack-beyla | — | — | Monitoring agent |
| PostgreSQL (system) | 5432 | 209.182.236.204 | Shared PostgreSQL |

## Port Summary (Quick Reference)
```
Used Ports: 80, 127, 443, 3000, 3001, 3010, 4003, 5432, 5433, 6150, 6379, 6380,
            8000, 8080, 8081, 8082, 8083, 8090, 8095, 9050, 9070, 9100, 9101,
            11150, 11155, 11160, 11600, 19000

Next Available: 11165, 11170, 11605, 11610
```
