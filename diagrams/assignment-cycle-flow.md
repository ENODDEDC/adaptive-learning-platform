graph TD
    subgraph Instructor
        A[Start] --> B{Creates a new assignment};
        B --> C[Sets title, description, due date, and attaches files];
        C --> D{Publishes the assignment};
    end

    subgraph System
        D --> E[A new 'Assignment' document is created in the database];
        E --> F[Notifications are sent to enrolled students];
    end

    subgraph Student
        F --> G{Student receives notification and views the assignment};
        G --> H[Student works on the assignment];
        H --> I{Submits the assignment with attachments};
    end

    subgraph System
        I --> J[A new 'Submission' document is created in the database];
        J --> K[Files are uploaded to Backblaze B2];
        K --> L[Notification is sent to the instructor];
    end

    subgraph Instructor
        L --> M{Instructor receives submission notification};
        M --> N[Instructor reviews the submission];
        N --> O{Grades the submission and provides feedback};
        O --> P[Updates the 'Submission' document with the grade];
    end
    
    subgraph System
        P --> Q[Notification with grade and feedback is sent to the student];
    end

    subgraph Student
        Q --> R[Student views the grade and feedback];
        R --> S[End];
    end