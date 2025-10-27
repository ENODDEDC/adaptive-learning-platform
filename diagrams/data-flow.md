graph TD
    subgraph "Student"
        A[Student fills out assignment] --> B{Submits assignment};
    end

    subgraph "System"
        B --> C[API endpoint receives submission];
        C --> D{Validate submission data};
        D -- Valid --> E[Save submission to database];
        D -- Invalid --> F[Return error to student];
        E --> G[Upload attachments to Backblaze B2];
        G --> H[Update submission with attachment URLs];
        H --> I[Notify instructor];
    end

    subgraph "Data Stores"
        E --> J(Submissions);
        G --> K(Backblaze B2);
        H --> J;
    end

    subgraph "Instructor"
        I --> L[Instructor receives notification];
    end