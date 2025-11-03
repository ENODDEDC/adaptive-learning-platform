graph TD
    A[Start] --> B{Instructor is logged in and on a course page};
    B --> C[Clicks 'Upload Content'];
    C --> D{Selects file(s) to upload};
    D --> E[Enters title and description for the content];
    E --> F{Submits the upload form};
    F --> G[API endpoint receives the request];
    G --> H{System processes the file};
    H --> I[File is uploaded to Backblaze B2];
    I --> J[A new 'Content' document is created in the database];
    J --> K[Thumbnail is generated for the content];
    K --> L[System links the content to the course];
    L --> M[Success message is displayed];
    M --> N[End];
    H -- Upload Fails --> O[Error message is displayed];
    O --> C;