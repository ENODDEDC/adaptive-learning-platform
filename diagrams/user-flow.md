graph TD
    A[Start] --> B{User visits login page};
    B --> C{Has an account?};
    C -- Yes --> D[Enters credentials];
    C -- No --> E[Clicks 'Register'];
    
    E --> F[Fills registration form];
    F --> G{Submits form};
    G --> H[Server validates data];
    H -- Valid --> I[Creates new user];
    H -- Invalid --> F;
    I --> J[Sends verification email];
    J --> K[User verifies email];
    K --> D;
    
    D --> L{Submits credentials};
    L --> M[Server authenticates];
    M -- Success --> N[Redirects to dashboard];
    M -- Failure --> D;
    N --> O[End];