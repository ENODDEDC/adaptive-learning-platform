graph TD
    A[Start] --> B{Student is logged in};
    B --> C[Student navigates to 'Courses' page];
    C --> D{Chooses to join a course};
    D --> E[Enters the unique course key/code];
    E --> F{System validates the key};
    F -- Valid Key --> G[System enrolls student in the course];
    G --> H[Student is added to the course's 'enrolledUsers' list];
    H --> I[Student is redirected to the course page];
    I --> J[Success message is displayed];
    J --> K[End];
    F -- Invalid Key --> L[Error message is displayed];
    L --> E;