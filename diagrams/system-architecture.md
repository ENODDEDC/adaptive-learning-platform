graph TD
    subgraph "Client-Side (Next.js)"
        A[Browser] --> B{Next.js Frontend};
        B --> C[React Components];
        B --> D[API Calls];
    end

    subgraph "Server-Side (Next.js API Routes)"
        D --> E{API Routes};
        E --> F[Authentication];
        E --> G[Business Logic];
        E --> H[Database Interaction];
    end

    subgraph "Database (MongoDB)"
        H --> I[MongoDB Atlas];
    end

    subgraph "External Services"
        G --> J[Backblaze B2];
        G --> K[Firebase];
    end

    style B fill:#f9f,stroke:#333,stroke-width:2px;
    style E fill:#ccf,stroke:#333,stroke-width:2px;
    style I fill:#cfc,stroke:#333,stroke-width:2px;
    style J fill:#fcf,stroke:#333,stroke-width:2px;
    style K fill:#fcf,stroke:#333,stroke-width:2px;