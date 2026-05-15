# WonderLust (AirBNB Clone) — System Flow Diagrams

## 1. High-Level System Architecture

```mermaid
flowchart TB
    subgraph CLIENT["🖥️ Client (Browser)"]
        A["User Browser"]
    end

    subgraph SERVER["⚙️ Backend (Node.js + Express)"]
        B["app.js (Entry Point)"]
        C["Routes"]
        D["Middleware"]
        E["Controllers"]
        F["Models (Mongoose)"]
    end

    subgraph EXTERNAL["☁️ External Services"]
        G["MongoDB Atlas (Database)"]
        H["Cloudinary (Image Storage)"]
        I["Mapbox (Geocoding + Maps)"]
    end

    A -- "HTTP Request" --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F <--> G
    E -- "Upload Image" --> H
    E -- "Geocode Location" --> I
    E -- "Render EJS Template" --> A
```

---

## 2. Request-Response Lifecycle

```mermaid
sequenceDiagram
    participant B as Browser
    participant R as Routes
    participant M as Middleware
    participant C as Controllers
    participant DB as MongoDB Atlas
    participant CL as Cloudinary
    participant MB as Mapbox

    B->>R: HTTP Request (GET/POST/PUT/DELETE)
    R->>M: Pass through middleware chain
    
    alt Auth Required
        M->>M: isLoggedIn check
        M-->>B: Redirect to /login (if not authenticated)
    end

    alt Ownership Check
        M->>DB: Fetch listing/review
        M->>M: isOwner / isReviewAuthor check
        M-->>B: Flash error + redirect (if not authorized)
    end

    alt Validation
        M->>M: Joi schema validation
        M-->>B: 400 Error (if invalid data)
    end

    M->>C: Call controller function

    alt Image Upload
        C->>CL: Upload image via Multer
        CL-->>C: Return image URL + filename
    end

    alt Geocoding
        C->>MB: Forward geocode (location string)
        MB-->>C: Return coordinates [lng, lat]
    end

    C->>DB: CRUD operation via Mongoose
    DB-->>C: Return data
    C->>B: Render EJS template with data
```

---

## 3. User Authentication Flow

```mermaid
flowchart TD
    A["User visits protected page"] --> B{"isLoggedIn?"}
    B -- "No" --> C["Save original URL to session"]
    C --> D["Redirect to /login"]
    D --> E["User submits login form"]
    E --> F["passport.authenticate (LocalStrategy)"]
    F --> G{"Valid credentials?"}
    G -- "No" --> H["Flash error, redirect to /login"]
    G -- "Yes" --> I["saveRedirectUrl middleware"]
    I --> J["Restore original URL from session"]
    J --> K["Redirect to original page"]
    
    B -- "Yes" --> L["Proceed to controller"]

    style A fill:#4a90d9,color:#fff
    style K fill:#27ae60,color:#fff
    style H fill:#e74c3c,color:#fff
```

---

## 4. Signup Flow

```mermaid
flowchart TD
    A["GET /signup"] --> B["Render signup.ejs form"]
    B --> C["User submits (username, email, password)"]
    C --> D["POST /signup"]
    D --> E["User.register (passport-local-mongoose)"]
    E --> F{"Registration successful?"}
    F -- "Yes" --> G["Auto-login via req.login"]
    G --> H["Flash: Welcome to WonderLust!"]
    H --> I["Redirect to /listings"]
    F -- "No (duplicate email/username)" --> J["Flash error message"]
    J --> K["Redirect to /signup"]

    style I fill:#27ae60,color:#fff
    style K fill:#e74c3c,color:#fff
```

---

## 5. Listing CRUD Flow

```mermaid
flowchart TD
    subgraph INDEX["View All Listings"]
        A1["GET /listings"] --> A2["Fetch all listings from DB"]
        A2 --> A3["Render index.ejs (card grid)"]
    end

    subgraph CREATE["Create Listing"]
        B1["GET /listings/new"] --> B2{"isLoggedIn?"}
        B2 -- "Yes" --> B3["Render new.ejs form"]
        B3 --> B4["POST /listings (with image)"]
        B4 --> B5["Multer uploads image to Cloudinary"]
        B5 --> B6["Mapbox geocodes location → coordinates"]
        B6 --> B7["Save listing to MongoDB"]
        B7 --> B8["Flash success, redirect to /listings"]
    end

    subgraph SHOW["View Single Listing"]
        C1["GET /listings/:id"] --> C2["Fetch listing + populate reviews + owner"]
        C2 --> C3["Render show.ejs (details + map + reviews)"]
    end

    subgraph UPDATE["Edit Listing"]
        D1["GET /listings/:id/edit"] --> D2{"isLoggedIn + isOwner?"}
        D2 -- "Yes" --> D3["Render edit.ejs (prefilled form)"]
        D3 --> D4["PUT /listings/:id"]
        D4 --> D5["Update listing in DB"]
        D5 --> D6["Flash success, redirect to show page"]
    end

    subgraph DELETE["Delete Listing"]
        E1["DELETE /listings/:id"] --> E2{"isLoggedIn + isOwner?"}
        E2 -- "Yes" --> E3["Delete listing from DB"]
        E3 --> E4["Cascade: delete all associated reviews"]
        E4 --> E5["Flash success, redirect to /listings"]
    end
```

---

## 6. Review Flow

```mermaid
flowchart LR
    subgraph CREATE_REVIEW["Create Review"]
        A["POST /listings/:id/reviews"] --> B{"isLoggedIn?"}
        B -- "Yes" --> C["Validate with Joi"]
        C --> D["Create Review document"]
        D --> E["Set review.author = current user"]
        E --> F["Push review ID into listing.reviews"]
        F --> G["Save both to DB"]
        G --> H["Redirect to listing show page"]
    end

    subgraph DELETE_REVIEW["Delete Review"]
        I["DELETE /listings/:id/reviews/:reviewId"] --> J{"isLoggedIn + isReviewAuthor?"}
        J -- "Yes" --> K["Pull review ID from listing.reviews"]
        K --> L["Delete review from DB"]
        L --> M["Redirect to listing show page"]
    end
```

---

## 7. Image Upload Flow

```mermaid
flowchart LR
    A["User selects image in form"] --> B["Multer middleware intercepts"]
    B --> C["multer-storage-cloudinary"]
    C --> D["Upload to Cloudinary (wanderlust_DEV folder)"]
    D --> E["Returns: { url, filename }"]
    E --> F["Stored in listing.image field in MongoDB"]
    F --> G["Displayed in EJS templates via image.url"]
```

---

## 8. Geocoding + Map Flow

```mermaid
flowchart LR
    A["User enters location (e.g. 'Mumbai, India')"] --> B["Controller calls Mapbox forwardGeocode"]
    B --> C["Mapbox API returns GeoJSON coordinates"]
    C --> D["Stored as listing.geometry = { type: 'Point', coordinates: [lng, lat] }"]
    D --> E["show.ejs loads Mapbox GL JS"]
    E --> F["Map rendered with marker at listing coordinates"]
```

---

## 9. Data Model Relationships

```mermaid
erDiagram
    USER {
        ObjectId _id
        String username
        String email
        String hash
        String salt
    }
    LISTING {
        ObjectId _id
        String title
        String description
        Number price
        String location
        String country
        Object image
        Object geometry
        ObjectId owner
    }
    REVIEW {
        ObjectId _id
        String comment
        Number rating
        Date createdAt
        ObjectId author
    }

    USER ||--o{ LISTING : "owns"
    USER ||--o{ REVIEW : "authors"
    LISTING ||--o{ REVIEW : "has many"
```

---

## 10. Middleware Pipeline

```mermaid
flowchart LR
    A["Incoming Request"] --> B["express.urlencoded"]
    B --> C["method-override"]
    C --> D["express-session"]
    D --> E["connect-flash"]
    E --> F["passport.initialize"]
    F --> G["passport.session"]
    G --> H["Set res.locals (currUser, flash msgs)"]
    H --> I["Route-specific middleware"]
    
    subgraph ROUTE_MW["Route Middleware (as needed)"]
        I --> J["isLoggedIn"]
        J --> K["isOwner / isReviewAuthor"]
        K --> L["validateListing / validateReview"]
        L --> M["multer (image upload)"]
    end
    
    M --> N["Controller"]
```
