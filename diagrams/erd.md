erDiagram
    USER ||--o{ COURSE : "creates"
    USER ||--o{ COURSE : "enrolls"
    USER ||--o{ SUBMISSION : "submits"
    USER ||--o{ ASSIGNMENT : "posts"
    USER ||--o{ ANNOUNCEMENT : "posts"
    USER ||--o{ COMMENT : "posts"
    USER ||--o{ CONTENT : "uploads"
    USER ||--o{ NOTE : "creates"
    USER ||--o{ ACTIVITY : "performs"
    USER ||--o{ ADAPTIVE_PREFERENCES : "has"
    USER ||--o{ USER_BEHAVIOR : "exhibits"
    USER ||--o{ SCHEDULED_COURSE : "schedules"
    USER ||--o{ FORM : "creates"
    USER ||--o{ FORM : "responds to"
    
    COURSE ||--|{ CONTENT : "has"
    COURSE ||--|{ ASSIGNMENT : "has"
    COURSE ||--|{ ANNOUNCEMENT : "has"
    COURSE ||--|{ FORM : "has"
    COURSE ||--o{ CLUSTER : "belongs to"
    
    ASSIGNMENT ||--|{ SUBMISSION : "receives"
    ASSIGNMENT ||--o{ CONTENT : "attaches"
    ASSIGNMENT ||--o{ COMMENT : "has"
    
    ANNOUNCEMENT ||--o{ CONTENT : "attaches"
    ANNOUNCEMENT ||--o{ COMMENT : "has"
    
    SUBMISSION ||--o{ CONTENT : "attaches"
    
    CLUSTER ||--o{ COURSE : "contains"
    
    USER {
        string name
        string middleName
        string surname
        string suffix
        string email
        string password
        string otp
        date otpExpires
        boolean isVerified
        string resetPasswordToken
        date resetPasswordExpires
        string googleId
        string photoURL
        string authProvider
        string role
    }
    
    COURSE {
        string subject
        string section
        string teacherName
        string coverColor
        string uniqueKey
        ObjectId createdBy
    }
    
    CONTENT {
        ObjectId courseId
        string title
        string description
        string filename
        string originalName
        string filePath
        string contentType
        number fileSize
        string mimeType
        ObjectId uploadedBy
        boolean isActive
        string thumbnailUrl
    }
    
    ASSIGNMENT {
        ObjectId courseId
        string title
        string description
        date dueDate
        ObjectId postedBy
        string type
        ObjectId topic
    }
    
    SUBMISSION {
        ObjectId assignmentId
        ObjectId studentId
        string content
        string status
        date submittedAt
        date lastModified
        number workSessionTime
        number progress
        number grade
        ObjectId gradedBy
        date gradedAt
        string feedback
    }
    
    ACTIVITY {
        ObjectId user
        string action
        string targetType
        ObjectId targetId
        string targetName
        string description
        object metadata
        string ipAddress
        string userAgent
        string type
        string category
    }
    
    ADAPTIVE_PREFERENCES {
        ObjectId userId
        object layoutPreferences
        object interactionPatterns
        object adaptiveSettings
        date lastAdaptation
        number version
        object syncStatus
    }
    
    ANNOUNCEMENT {
        ObjectId courseId
        string content
        ObjectId postedBy
        boolean pinned
    }
    
    CLUSTER {
        string name
        string section
        string classCode
        ObjectId createdBy
        string coverColor
        string description
        boolean isPublic
        boolean allowJoin
        boolean archived
        date archivedAt
    }
    
    COMMENT {
        string content
        ObjectId postedBy
        ObjectId onItem
        string onModel
    }
    
    FORM {
        string title
        string description
        array questions
        string type
        ObjectId courseId
        ObjectId createdBy
        boolean isActive
        object settings
    }
    
    NOTE {
        string contentId
        ObjectId courseId
        ObjectId userId
        string type
        string content
        string contextualText
        string contextualId
        object position
        object size
        object style
        boolean isShared
        string visibility
        string category
        array tags
        string priority
        boolean isArchived
        ObjectId lastEditedBy
        number version
    }
    
    NOTIFICATION {
        ObjectId recipient
        ObjectId sender
        ObjectId course
        string type
        string message
        string link
        boolean read
    }
    
    SCHEDULED_COURSE {
        ObjectId userId
        ObjectId courseId
        string day
        string timeSlot
    }
    
    USER_BEHAVIOR {
        ObjectId userId
        string sessionId
        string interactionType
        object details
        date timestamp
        object deviceInfo
        object metadata
    }