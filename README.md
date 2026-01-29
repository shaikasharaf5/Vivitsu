# Vivitsu - Data Analysis Framework

## ANALYSIS FRAMEWORK: STEP-BY-STEP DATA FLOWS

### 1. Data Input & Validation Flow
**Source → Validation → Storage**

- **Entry Points**: Manual input forms, CSV imports, API endpoints
- **Validation Layer**: Data type checking, required field validation, business rule validation
- **Storage**: Normalized database tables with proper indexing
- **Error Handling**: Validation errors returned to user with specific field-level feedback

### 2. Data Transformation Pipeline
**Raw Data → Cleaning → Enrichment → Aggregation**

- **Cleaning**: Remove duplicates, handle null values, standardize formats
- **Enrichment**: Calculate derived fields, apply business logic transformations
- **Aggregation**: Group data by relevant dimensions (time, category, region, etc.)
- **Output**: Transformed datasets ready for analysis

### 3. Analysis & Computation Flow
**Transformed Data → Business Logic → Metrics Calculation**

- **Business Rules Engine**: Apply domain-specific rules and calculations
- **Metrics Calculation**: KPIs, trends, ratios, percentages
- **Statistical Analysis**: Averages, distributions, correlations
- **Performance Indicators**: Compare against targets and benchmarks

### 4. Visualization & Reporting Flow
**Computed Metrics → Formatting → Presentation Layer**

- **Data Formatting**: Round numbers, apply currency/percentage formats
- **Chart Generation**: Time series, bar charts, pie charts, heatmaps
- **Dashboard Assembly**: Combine multiple visualizations with filters
- **Export Options**: PDF reports, Excel exports, CSV downloads

### 5. User Interaction Flow
**User Request → Query Processing → Response Delivery**

- **Authentication**: Verify user permissions and access levels
- **Query Parsing**: Extract filters, date ranges, grouping parameters
- **Data Retrieval**: Execute optimized database queries
- **Response Rendering**: Format and return results to UI

### 6. Audit & Logging Flow
**Action → Log Entry → Audit Trail**

- **Activity Tracking**: Log all data modifications and user actions
- **Change History**: Maintain version history of critical records
- **Compliance Reporting**: Generate audit reports for compliance requirements
- **System Monitoring**: Track performance metrics and error rates

---

---

## CORRECTED DATA MODEL SCHEMA (Addressing 5 Critical Issues)

### FIX #1: Single Primary Keys + Indexed City_ID

**Principle:** Use UUID as single PRIMARY KEY. Add UNIQUE INDEX on (city_id, entity_id) for fast city-scoped queries.

**Benefits:**
- Simpler ORM mappings
- Cleaner foreign keys
- Easier migration to separate DBs per city later
- No performance penalty for multi-city queries

**Pattern:**
```sql
-- Instead of: PRIMARY KEY (entity_id, city_id)
-- Use:
CREATE TABLE issues (
  issue_id UUID PRIMARY KEY,
  city_id UUID NOT NULL,
  ...
  FOREIGN KEY (city_id) REFERENCES cities(city_id),
  UNIQUE INDEX idx_city_issue (city_id, issue_id)
);

-- Query pattern (always include city_id):
SELECT * FROM issues WHERE issue_id = ? AND city_id = ?
```

---

### FIX #2: Global Users + City-Scoped Roles

**Principle:** One user account can have different roles in different cities. Separates identity from authorization.

**Tables:**

```sql
-- GLOBAL: Users table (one per person globally)
CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  phone VARCHAR,
  password_hash VARCHAR NOT NULL,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  avatar_url VARCHAR,
  global_status ENUM ('ACTIVE', 'SUSPENDED', 'DELETED'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- GLOBAL: Global roles (fixed list)
CREATE TABLE global_roles (
  global_role_id UUID PRIMARY KEY,
  role_name VARCHAR UNIQUE NOT NULL,  -- 'CITIZEN', 'WORKER', 'CONTRACTOR', 'ADMIN'
  description VARCHAR,
  created_at TIMESTAMP
);

-- PER-CITY: User's roles in each city
CREATE TABLE user_city_roles (
  user_city_role_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  city_id UUID NOT NULL,
  global_role_id UUID NOT NULL,
  city_role_name VARCHAR NOT NULL,  -- 'CITIZEN', 'WORKER', 'SUPERVISOR', 'INSPECTOR', 'CONTRACTOR', 'ADMIN'
  status ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED'),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by UUID,  -- admin user_id
  UNIQUE KEY unique_user_city_role (user_id, city_id, global_role_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (city_id) REFERENCES cities(city_id),
  FOREIGN KEY (global_role_id) REFERENCES global_roles(global_role_id),
  INDEX idx_city_role (city_id, city_role_name)
);

-- Example: John (user_123) in multiple cities
-- INSERT INTO user_city_roles VALUES
--   (uuid1, user_123, city_A, role_worker, 'WORKER', 'ACTIVE', ...),
--   (uuid2, user_123, city_B, role_contractor, 'CONTRACTOR', 'ACTIVE', ...),
--   (uuid3, user_123, city_C, role_supervisor, 'SUPERVISOR', 'ACTIVE', ...);

-- Query: "What cities can user_123 access?"
SELECT city_id, city_role_name FROM user_city_roles 
  WHERE user_id = user_123 AND status = 'ACTIVE';

-- Query: "Who are the workers in City A?"
SELECT u.* FROM users u
  JOIN user_city_roles ucr ON u.user_id = ucr.user_id
  WHERE ucr.city_id = city_A AND ucr.city_role_name = 'WORKER' AND ucr.status = 'ACTIVE';
```

**Benefits:**
- ✅ Contractors can work in multiple cities
- ✅ Platform admins can manage globally
- ✅ City admins can manage their city only
- ✅ Clear audit trail of role assignments
- ✅ Role revocation is instant (no data deletion needed)

---

### FIX #3: One Primary Category + Secondary Tags

**Principle:** Every issue has ONE primary category (for assignment routing). Optional secondary tags for filtering/analysis.

**Tables:**

```sql
-- Categories (per city)
CREATE TABLE categories (
  category_id UUID PRIMARY KEY,
  city_id UUID NOT NULL,
  name VARCHAR NOT NULL,
  parent_category_id UUID,  -- for hierarchy
  description VARCHAR,
  icon_url VARCHAR,
  color VARCHAR,  -- hex color for map
  assigned_department VARCHAR,
  estimated_resolution_hours INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE KEY unique_city_category (city_id, name),
  FOREIGN KEY (city_id) REFERENCES cities(city_id),
  FOREIGN KEY (parent_category_id) REFERENCES categories(category_id),
  INDEX idx_city_department (city_id, assigned_department)
);

-- Issue categorization (one primary per issue)
CREATE TABLE issue_categorizations (
  categorization_id UUID PRIMARY KEY,
  issue_id UUID NOT NULL,
  city_id UUID NOT NULL,
  category_id UUID NOT NULL,
  is_primary BOOLEAN DEFAULT TRUE,  -- only one can be true per issue
  ai_suggested BOOLEAN DEFAULT FALSE,
  ai_confidence DECIMAL(3,0),  -- 0-100
  reviewed_by UUID,  -- supervisor
  review_status ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'OVERRIDE'),
  review_notes TEXT,
  created_at TIMESTAMP,
  finalized_at TIMESTAMP,
  UNIQUE KEY unique_primary_category (issue_id, is_primary),  -- only one primary
  FOREIGN KEY (issue_id) REFERENCES issues(issue_id),
  FOREIGN KEY (city_id) REFERENCES cities(city_id),
  FOREIGN KEY (category_id) REFERENCES categories(category_id),
  INDEX idx_review_status (city_id, review_status)
);

-- Optional secondary tags (for analysis)
CREATE TABLE issue_tags (
  tag_id UUID PRIMARY KEY,
  issue_id UUID NOT NULL,
  city_id UUID NOT NULL,
  tag_name VARCHAR NOT NULL,  -- 'traffic_hazard', 'seasonal_issue', 'health_risk'
  created_at TIMESTAMP,
  FOREIGN KEY (issue_id) REFERENCES issues(issue_id),
  FOREIGN KEY (city_id) REFERENCES cities(city_id),
  INDEX idx_city_tag (city_id, tag_name)
);

-- Query: Get primary category for assignment routing
SELECT c.* FROM categories c
  JOIN issue_categorizations ic ON c.category_id = ic.category_id
  WHERE ic.issue_id = ? AND ic.is_primary = TRUE AND ic.review_status = 'APPROVED';

-- Query: Dashboard - count issues by category (no double-counting)
SELECT c.name, COUNT(DISTINCT ic.issue_id) as count
  FROM categories c
  JOIN issue_categorizations ic ON c.category_id = ic.category_id
  WHERE ic.city_id = ? AND ic.is_primary = TRUE
  GROUP BY c.category_id;

-- Query: Find issues with traffic hazard tag
SELECT i.* FROM issues i
  JOIN issue_tags it ON i.issue_id = it.issue_id
  WHERE i.city_id = ? AND it.tag_name = 'traffic_hazard';
```

**Benefits:**
- ✅ Assignment routing always finds exactly one category
- ✅ Dashboard metrics are accurate (no double-counting)
- ✅ Can track category change history
- ✅ Secondary tags for flexible filtering without routing complexity

---

### FIX #4: Assignment is Source of Truth for Status

**Principle:** Assignment.status is the canonical state. Issue.status is derived (computed on-demand or cached).

**Tables:**

```sql
-- ISSUES: Minimal status (derived from assignment)
CREATE TABLE issues (
  issue_id UUID PRIMARY KEY,
  city_id UUID NOT NULL,
  citizen_id UUID NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  location_address VARCHAR,
  priority ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
  is_duplicate_of UUID,  -- if merged
  duplicate_confidence DECIMAL(3,0),  -- AI confidence 0-100
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  resolved_at TIMESTAMP,
  deleted_at TIMESTAMP,
  FOREIGN KEY (city_id) REFERENCES cities(city_id),
  FOREIGN KEY (citizen_id) REFERENCES citizens(citizen_id),
  FOREIGN KEY (is_duplicate_of) REFERENCES issues(issue_id),
  INDEX idx_city_created (city_id, created_at),
  INDEX idx_city_priority (city_id, priority)
);

-- Do NOT store issue.status in the table
-- Instead, compute it on-demand:

-- ASSIGNMENTS: Source of truth for work status
CREATE TABLE assignments (
  assignment_id UUID PRIMARY KEY,
  issue_id UUID NOT NULL,
  city_id UUID NOT NULL,
  assigned_to_worker_id UUID,  -- nullable if contractor
  assigned_to_contractor_id UUID,  -- nullable if worker
  assigned_by UUID NOT NULL,  -- supervisor
  assignment_type ENUM ('DIRECT', 'CONTRACTOR_BID', 'AUTO_ASSIGNED'),
  status ENUM ('PENDING_ACCEPTANCE', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'REASSIGNED'),
  priority ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
  sla_target_minutes INT,
  assigned_at TIMESTAMP,
  accepted_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  estimated_completion_time TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (issue_id) REFERENCES issues(issue_id),
  FOREIGN KEY (city_id) REFERENCES cities(city_id),
  FOREIGN KEY (assigned_to_worker_id) REFERENCES workers(worker_id),
  FOREIGN KEY (assigned_to_contractor_id) REFERENCES contractors(contractor_id),
  FOREIGN KEY (assigned_by) REFERENCES users(user_id),
  INDEX idx_worker_status (assigned_to_worker_id, status),
  INDEX idx_city_status (city_id, status),
  INDEX idx_sla_deadline (estimated_completion_time)
);

-- COMPUTED ISSUE STATUS (not stored, derived on-demand):
-- CREATE VIEW issue_status_view AS
-- SELECT 
--   i.issue_id,
--   CASE 
--     WHEN a.status IS NULL THEN 'CATEGORIZED'
--     WHEN a.status = 'PENDING_ACCEPTANCE' THEN 'ASSIGNED'
--     WHEN a.status = 'ACCEPTED' OR a.status = 'IN_PROGRESS' THEN 'IN_PROGRESS'
--     WHEN a.status = 'COMPLETED' AND qv.verification_status = 'APPROVED' THEN 'RESOLVED'
--     WHEN a.status = 'COMPLETED' AND qv.verification_status IS NULL THEN 'COMPLETED'
--     WHEN a.status = 'REJECTED' THEN 'CATEGORIZED'  -- back to assignment queue
--     WHEN a.status = 'REASSIGNED' THEN 'ASSIGNED'
--   END as computed_status
-- FROM issues i
-- LEFT JOIN assignments a ON i.issue_id = a.issue_id AND a.status != 'REASSIGNED'
-- LEFT JOIN quality_verifications qv ON a.assignment_id = qv.assignment_id;

-- Application query (in code):
-- function getIssueStatus(issue_id, city_id):
--   assignment = query("SELECT * FROM assignments WHERE issue_id = ? AND status != 'REASSIGNED'")
--   if not assignment:
--     return 'CATEGORIZED'
--   if assignment.status in ['COMPLETED']:
--     qv = query("SELECT * FROM quality_verifications WHERE assignment_id = ?")
--     if qv.verification_status == 'APPROVED':
--       return 'RESOLVED'
--     else:
--       return 'COMPLETED'  -- pending verification
--   return assignment.status.toIssueStatus()  -- map assignment status to issue display status

-- AUDIT TRAIL: Track all status changes
CREATE TABLE assignment_status_history (
  history_id UUID PRIMARY KEY,
  assignment_id UUID NOT NULL,
  city_id UUID NOT NULL,
  old_status VARCHAR,
  new_status VARCHAR,
  changed_by UUID,
  reason VARCHAR,
  notes TEXT,
  created_at TIMESTAMP,
  FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id),
  FOREIGN KEY (city_id) REFERENCES cities(city_id),
  INDEX idx_assignment_history (assignment_id, created_at)
);

-- WORK LOGS: Detailed progress tracking
CREATE TABLE work_logs (
  log_id UUID PRIMARY KEY,
  assignment_id UUID NOT NULL,
  city_id UUID NOT NULL,
  worker_id UUID NOT NULL,
  status_update VARCHAR,  -- 'On site', 'Assessing', 'In progress', 'Completed'
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  duration_minutes INT,
  notes TEXT,
  created_at TIMESTAMP,
  FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id),
  FOREIGN KEY (city_id) REFERENCES cities(city_id),
  FOREIGN KEY (worker_id) REFERENCES workers(worker_id),
  INDEX idx_assignment_timeline (assignment_id, created_at),
  INDEX idx_worker_log (worker_id, created_at)
);
```

**Benefits:**
- ✅ Single source of truth (assignment.status)
- ✅ No sync issues between tables
- ✅ Rejection auto-re-opens issue (no state mismatch)
- ✅ Clear state machine for assignments
- ✅ Audit trail is complete and accurate

**State Transition Diagram:**
```
NEW ISSUE
  ↓
CATEGORIZED (no assignment)
  ↓
PENDING_ACCEPTANCE (assignment created) ← map to ASSIGNED
  ↓
ACCEPTED (worker accepts)
  ↓
IN_PROGRESS (worker updates status) ← map to IN_PROGRESS
  ↓
COMPLETED (worker claims done)
  ↓
QA VERIFICATION:
  ├─ APPROVED → RESOLVED (issue.status)
  └─ REJECTED → CATEGORIZED (back to assignment queue, new assignment created)
```

---

### FIX #5: Database = Source of Truth + Idempotent Event Handling

**Principle:** Database state is authoritative. Events are notifications. Subscribers are idempotent (don't process same event twice).

**Tables:**

```sql
-- OUTBOX: All domain events (per service database)
CREATE TABLE outbox (
  outbox_id UUID PRIMARY KEY,
  aggregate_id UUID NOT NULL,  -- issue_id, assignment_id, etc.
  aggregate_type VARCHAR NOT NULL,  -- 'Issue', 'Assignment', 'QA'
  event_type VARCHAR NOT NULL,  -- 'Created', 'StatusUpdated', 'Verified'
  payload JSON NOT NULL,  -- full event data
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_unpublished (published, created_at)
);

-- EVENT DELIVERY LOG: Track which subscribers processed which events
CREATE TABLE event_delivery (
  delivery_id UUID PRIMARY KEY,
  event_id UUID NOT NULL,
  subscriber_service VARCHAR NOT NULL,  -- 'notification_service', 'analytics_pipeline', etc.
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  error_message TEXT,
  attempt_count INT DEFAULT 0,
  created_at TIMESTAMP,
  UNIQUE KEY unique_event_subscriber (event_id, subscriber_service),
  FOREIGN KEY (event_id) REFERENCES outbox(outbox_id),
  INDEX idx_pending (processed, created_at)
);

-- AUDIT LOG: Final record of all changes
CREATE TABLE audit_log (
  audit_id UUID PRIMARY KEY,
  city_id UUID NOT NULL,
  entity_type VARCHAR NOT NULL,  -- 'Issue', 'Assignment', 'Worker'
  entity_id UUID NOT NULL,
  action VARCHAR NOT NULL,  -- 'CREATE', 'UPDATE', 'DELETE'
  performed_by UUID,
  old_values JSON,
  new_values JSON,
  timestamp TIMESTAMP,
  FOREIGN KEY (city_id) REFERENCES cities(city_id),
  INDEX idx_entity_audit (entity_type, entity_id, timestamp),
  INDEX idx_city_audit (city_id, timestamp)
);
```

**Workflow: Creating an Assignment (Transactional)**

```sql
BEGIN TRANSACTION;

-- 1. Create assignment in database (source of truth)
INSERT INTO assignments (assignment_id, issue_id, assigned_to_worker_id, status, assigned_at, ...)
  VALUES (uuid_asg, uuid_issue, uuid_worker, 'PENDING_ACCEPTANCE', NOW(), ...);

-- 2. Log to audit trail
INSERT INTO audit_log (audit_id, entity_type, entity_id, action, new_values, ...)
  VALUES (uuid_audit, 'Assignment', uuid_asg, 'CREATE', {...}, NOW());

-- 3. Add to outbox (for async delivery)
INSERT INTO outbox (outbox_id, aggregate_id, aggregate_type, event_type, payload, published)
  VALUES (uuid_event, uuid_asg, 'Assignment', 'Created', {...}, FALSE);

COMMIT;  -- All or nothing
```

**Workflow: Publishing Events (Background Job, Separate Transaction)**

```sql
-- Background job runs every 5 seconds in SEPARATE process

SELECT * FROM outbox WHERE published = FALSE ORDER BY created_at ASC LIMIT 100;

FOR EACH event:
  BEGIN TRANSACTION;
    
    -- Publish to message broker (external, unreliable)
    TRY:
      publish_to_broker(event.payload);  -- might fail
    CATCH:
      ROLLBACK;
      CONTINUE;  -- try again next interval
    
    -- Mark as published only after successful broker publish
    UPDATE outbox SET published = TRUE, published_at = NOW() WHERE outbox_id = event.outbox_id;
    
    -- Initialize subscriber tracking (for idempotency)
    INSERT INTO event_delivery (delivery_id, event_id, subscriber_service, processed)
      VALUES (uuid, event.outbox_id, 'notification_service', FALSE),
             (uuid, event.outbox_id, 'analytics_pipeline', FALSE),
             (uuid, event.outbox_id, 'contractor_service', FALSE);
    
  COMMIT;
```

**Workflow: Subscriber Processing (Idempotent)**

```python
# NotificationService (pseudocode)

def process_assignment_created_event(event):
    # Step 1: Check if already processed (idempotency check)
    delivery = DB.select_one("""
        SELECT * FROM event_delivery 
        WHERE event_id = ? AND subscriber_service = 'notification_service'
    """, (event.event_id,))
    
    if delivery.processed:
        logger.info(f"Event {event.event_id} already processed, skipping")
        return  # Idempotent: safe to skip
    
    # Step 2: Process the event
    try:
        assignment = DB.select_one("SELECT * FROM assignments WHERE assignment_id = ?", (event.aggregate_id,))
        worker = DB.select_one("SELECT * FROM workers WHERE worker_id = ?", (assignment.worker_id,))
        
        send_notification_to_worker(worker.user_id, f"New assignment: {event.payload.issue.title}")
        
        # Step 3: Mark as processed (idempotency marker)
        DB.execute("""
            UPDATE event_delivery 
            SET processed = TRUE, processed_at = NOW() 
            WHERE event_id = ? AND subscriber_service = 'notification_service'
        """, (event.event_id,))
        
    except Exception as e:
        logger.error(f"Failed to process event {event.event_id}: {str(e)}")
        DB.execute("""
            UPDATE event_delivery 
            SET error_message = ?, attempt_count = attempt_count + 1 
            WHERE event_id = ? AND subscriber_service = 'notification_service'
        """, (str(e), event.event_id))
        # Don't raise; let background job retry later
```

**Benefits:**
- ✅ Database is ALWAYS authoritative (single source of truth)
- ✅ Events are just notifications (can be lost/delayed without corruption)
- ✅ Idempotent processing prevents double-processing
- ✅ No payment duplicates, no duplicate notifications
- ✅ Complete audit trail for compliance
- ✅ If service crashes mid-processing, state is consistent
- ✅ No distributed transaction issues

**Failure Scenarios Handled:**

| Failure | Without Fix | With Fix |
|---------|-----------|----------|
| Message broker down | Event lost | Event waits in outbox, retry later |
| Notification service crashes | Notification lost | Re-process from outbox |
| Service processes event twice | Double notification, double payment | Idempotency check prevents processing |
| Database and broker out-of-sync | Inconsistency | Database is truth, broker is just notification |

---

## SUMMARY: FIX IMPACT ON CODEBASE

| Fix | Lines Changed | Complexity | Development Impact |
|-----|---------------|-----------|-------------------|
| #1: Single PKs | -20% boilerplate | Lower | Faster development |
| #2: User Roles | +15 tables/views | Slightly higher | Cleaner authorization logic |
| #3: Category Primary | -5% schema complexity | Lower | Simpler routing rules |
| #4: Assignment Status | -10% state management code | Lower | Fewer data consistency bugs |
| #5: Idempotent Events | +~500 lines (outbox, delivery tracking) | Higher | Prevents catastrophic bugs |

**Total:** Well worth the investment. Prevents major bugs and makes code cleaner.

---

---

## HACKATHON MVP SPECIFICATION (24 Hours)

### STRATEGY: All Features, Lightweight Implementation

**Goal**: Impress judges with complete product vision, but MVP-quality code.

**Philosophy**: Every feature exists, but in simplest possible form:
- No ML libraries → use string similarity
- No email/SMS → use in-app notifications + Socket.io
- No complex queues → use simple Node.js async
- No micro-services → single Node.js app with logical modules
- No PostgreSQL complexity → MongoDB with simple schema

---

## TECH STACK: HACKATHON VERSION

```
FRONTEND:
  - React (Vite for fast build)
  - TypeScript
  - TailwindCSS (pre-built components)
  - Leaflet.js (free map library)
  - Socket.io-client (real-time)
  - React Router (navigation)

BACKEND:
  - Node.js + Express
  - MongoDB (single collection per entity)
  - Socket.io (WebSockets)
  - JWT (authentication)
  - Multer (file uploads to local /uploads)
  - bcrypt (password hashing)

DEPLOYMENT:
  - Frontend: Vercel (free, auto-deploy from GitHub)
  - Backend: Railway or Heroku (free tier)
  - Database: MongoDB Atlas (free tier)
  - Storage: Local filesystem (backend /uploads)

TOOLS:
  - Postman (API testing)
  - VS Code (IDE)
  - GitHub (version control)
  - Discord (team communication)
```

---

## COMPLETE HACKATHON WORKFLOWS

### WORKFLOW 1: CITIZEN REPORTS ISSUE

```
ACTOR: Citizen (mobile or web)

STEP 1: Open App
  - See landing page with:
    * Map view (issues as landmarks)
    * Feed view (all issues)
    * "Report Issue" button
    * Login/Signup link

STEP 2: Login (if not already)
  - Enter email + password
  - JWT token stored in localStorage
  - Redirected to app dashboard

STEP 3: Click "Report Issue"
  - Modal/page opens with form:
    * Title (required): "Pothole on Main Street"
    * Description (required): "Large hole in road, unsafe"
    * Category (dropdown): Roads, Utilities, Parks, Traffic, Sanitation, Health, Other
    * Priority (auto-set based on category): LOW, MEDIUM, HIGH
    * Location: 
      - Click on map → pin placed → lat/lon captured
      - OR type address → geocoded
    * Photo (optional): Upload image (Multer saves to /uploads)
    * Submit

STEP 4: Backend Processing
  - API: POST /api/issues
  - Validate: title, description, category, location required
  - Check duplicates: Simple string similarity
    * If title + description 80% similar to existing recent issue → FLAG
    * Show: "This issue might already exist. Continue anyway?"
  - Save to MongoDB:
    {
      _id: ObjectId,
      reportedBy: userId,
      city: "Bangalore", // or from user context
      title: string,
      description: string,
      category: string,
      priority: string,
      latitude: number,
      longitude: number,
      address: string,
      photos: [url],
      status: "REPORTED",
      upvotes: number,
      upvotedBy: [userId],
      comments: [],
      createdAt: timestamp,
      updatedAt: timestamp
    }
  - Emit Socket.io event: "issueCreated" → broadcast to all connected clients
  - Create notification for municipality admin: "New issue reported"

STEP 5: Response to Citizen
  - Show: "Issue reported successfully!"
  - Show issue details
  - Issue appears on map (red pin) + feed instantly (real-time via Socket.io)
  - Citizen can upvote their own issue
```

**Lightweight Features:**
- ✅ Simple form validation (required fields)
- ✅ String similarity for duplicates (use library: `string-similarity` npm)
- ✅ Local file storage for photos
- ✅ Real-time broadcast via Socket.io (no message queue needed)

**Time to Implement**: ~2 hours (form + backend + Socket.io)

---

### WORKFLOW 2: CITIZEN VIEWS FEED & UPVOTES

```
ACTOR: Citizen

STEP 1: Open "Feed" Tab
  - See list of all issues, sorted by:
    * Trending (most upvotes)
    * Recent (newest)
    * By category filter (checkbox)

STEP 2: See Issue Card
  Each card shows:
  - Category badge (color-coded)
  - Issue title
  - Reporter avatar + name
  - Description (truncated)
  - Upvote count + heart button
  - Comment count
  - "View Details" button
  - Status badge (REPORTED, ASSIGNED, IN_PROGRESS, COMPLETED, RESOLVED)

STEP 3: Upvote an Issue
  - Click heart icon
  - If not logged in → prompt to login
  - Add citizen to issue.upvotedBy array
  - Increment upvotes count
  - Heart fills red (becomes solid)
  - Real-time update (Socket.io): all clients see upvote count increase

STEP 4: Click "View Details"
  - See full issue page:
    * Full description
    * All photos
    * Upvote count + list of upvoters (avatars)
    * Comments section (expandable)
    * "Status Timeline" showing:
      - When reported
      - When assigned (if applicable)
      - When completed (if applicable)
    * Map embedded showing issue location
  - Can add comment (if citizen)

STEP 5: Add Comment (Bonus)
  - Type comment in text field
  - Submit
  - Comment appears in list (real-time Socket.io)
  - Notification sent to issue reporter

DATABASE QUERY:
  GET /api/issues?sort=trending&city=Bangalore
  Returns:
  [
    {
      _id, title, description, category, upvotes, comments: count,
      status, photos: [urls], reportedBy: {avatar, name}
    }
  ]
```

**Lightweight Features:**
- ✅ No pagination (load all issues, handle <1000)
- ✅ In-memory sorting (no complex indexes)
- ✅ Comments in same collection (MongoDB embedded array)
- ✅ Real-time via Socket.io (no message queue)

**Time to Implement**: ~2 hours (list component + API + Socket.io emit)

---

### WORKFLOW 3: CITIZEN VIEWS MAP

```
ACTOR: Citizen

STEP 1: Open "Map" Tab
  - Leaflet map loads with city view
  - Example city: Bangalore (center: 12.9716, 77.5946)

STEP 2: See Issue Landmarks
  Map shows issue pins:
  - Each pin is a marker with:
    * Category icon (SVG icon based on category)
    * Color ring (red=HIGH, yellow=MEDIUM, blue=LOW)
    * Tooltip showing: "Title - X upvotes"

STEP 3: Zoom/Pan
  - Pan around map
  - Zoom in/out
  - Issue pins stay visible and responsive

STEP 4: Click Issue Pin
  - Popup appears showing:
    * Issue title
    * Category + priority badge
    * Upvote count
    * "View Details" link
  - Click "View Details" → navigate to full issue page

STEP 5: Filter by Category
  - Checkbox: "Roads", "Utilities", "Parks", etc.
  - Unchecked categories fade out
  - Map re-renders showing only selected categories
  - Counts update (e.g., "Roads (23 issues)")

STEP 6: Real-time Updates
  - Someone reports new issue
  - New pin appears on map instantly (Socket.io broadcast)
  - Someone upvotes → marker color might change (if threshold hit)

FRONTEND CODE STRUCTURE:
  <Map>
    {issues.map(issue => (
      <Marker 
        key={issue._id}
        position={[issue.latitude, issue.longitude]}
        icon={getCategoryIcon(issue.category)}
        onClick={() => showPopup(issue)}
      >
        <Popup>
          <h3>{issue.title}</h3>
          <p>Upvotes: {issue.upvotes}</p>
          <button onClick={() => navigate(`/issue/${issue._id}`)}>
            View Details
          </button>
        </Popup>
      </Marker>
    ))}
  </Map>

DATABASE QUERY:
  GET /api/issues/map?city=Bangalore&category=Roads,Parks
  Returns:
  [
    {
      _id, title, latitude, longitude, category, priority, upvotes, status
    }
  ]
```

**Lightweight Features:**
- ✅ Leaflet (free, lightweight map library)
- ✅ No clustering algorithm (show all markers <100 issues)
- ✅ Basic filtering (client-side, re-filter in browser)
- ✅ Real-time via Socket.io

**Time to Implement**: ~3 hours (map component + markers + filters)

---

### WORKFLOW 4: WORKER RECEIVES & COMPLETES ASSIGNMENT

```
ACTOR: Worker (municipality employee)

STEP 1: Worker Opens App
  - Different UI than citizen:
    * "My Assignments" tab (primary)
    * "Available Issues" tab
    * Map view
    * Profile

STEP 2: Admin (Supervisor) Assigns Issue to Worker
  - Admin sees new issue report
  - Clicks "Assign" → dropdown shows workers by department
  - Selects worker (auto-matched by category)
  - Worker gets notification (in-app + optional email mock)
  - Issue status changes to "ASSIGNED"

STEP 3: Worker Sees Assignment
  - Opens "My Assignments" tab
  - Sees card:
    * Issue title
    * Location (address + map pin)
    * Category + priority
    * Time assigned
    * "Accept" / "Decline" buttons
    * SLA timer (e.g., "Complete by 4:00 PM - 3 hours left")

STEP 4: Worker Accepts Assignment
  - Clicks "Accept"
  - Status changes to "ACCEPTED"
  - Worker can now:
    * Update progress
    * Add completion evidence (photos)
    * Mark as complete

STEP 5: Worker Updates Progress (In-Field)
  - Opens assignment
  - Button: "Update Status"
  - Options: "On site", "Assessing", "In progress", "Completed"
  - Select status
  - Optional: Add location, notes, time spent
  - Submit

STEP 6: Worker Marks Complete
  - Clicks "Mark Complete"
  - Form appears:
    * Before/After photos (required)
    * Notes (optional): "Filled pothole with asphalt"
    * Duration: auto-calculated
  - Upload photos (Multer)
  - Submit

STEP 7: Backend Processing
  - API: PATCH /api/assignments/:id/complete
  - Validate: worker is assigned, photos provided
  - Create verification task (for QA)
  - Issue status → "COMPLETED"
  - Emit event: "IssueCompleted" (broadcast)
  - Notification to citizen: "Your issue is being verified"
  - Notification to QA inspector: "New issue to verify"

STEP 8: Response
  - Show: "Issue marked as complete! Awaiting verification."
  - Worker can move to next assignment

DATABASE SCHEMA (Lightweight):
  assignments collection:
  {
    _id: ObjectId,
    issueId: ObjectId,
    assignedTo: userId,
    assignedBy: userId,
    status: "ASSIGNED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED",
    priority: string,
    assignedAt: timestamp,
    acceptedAt: timestamp,
    completedAt: timestamp,
    completionPhotos: [urls],
    completionNotes: string,
    estimatedCompletionTime: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp
  }

  work_logs collection:
  {
    _id: ObjectId,
    assignmentId: ObjectId,
    workerId: ObjectId,
    status: "ON_SITE" | "ASSESSING" | "IN_PROGRESS",
    notes: string,
    location: {lat, lng},
    timestamp: timestamp
  }
```

**Lightweight Features:**
- ✅ No complex SLA logic (just show deadline, check if past)
- ✅ Simple status machine (no complex state transitions)
- ✅ Work logs as simple array (no separate database optimizations)
- ✅ Auto-assignment logic: match by category + availability (hardcoded for demo)

**Time to Implement**: ~3 hours (worker app UI + assignment logic)

---

### WORKFLOW 5: QA INSPECTOR VERIFIES COMPLETION

```
ACTOR: QA Inspector (municipality quality assurance)

STEP 1: Inspector Logs In
  - Sees different dashboard
  - "Pending Verification" tab (primary)
  - Shows count: "5 issues awaiting your review"

STEP 2: See Verification Queue
  - List of completed issues:
    * Issue title
    * Category
    * Worker name
    * Completion photos (thumbnails)
    * Completion notes
    * "Review" button

STEP 3: Click "Review"
  - Full issue details page:
    * Issue description + original photos
    * Category checklist (auto-generated per category)
      - For POTHOLE: "No visible holes?", "Surface level?", "Safe to drive?"
    * Worker's before/after photos (large)
    * Worker's notes
    * Inspector notes field (textarea)

STEP 4: Inspector Approves or Rejects
  - Checklist: check boxes for each item
  - Decision: "Approve" or "Reject"
  
  IF APPROVE:
    - Click "Approve"
    - Issue status → "RESOLVED"
    - Issue disappears from map (or changes to green/resolved color)
    - Notification to worker: "Issue approved"
    - Notification to citizen: "Your issue has been resolved"
    - Add approval record to verification collection
  
  IF REJECT:
    - Click "Reject"
    - Form appears:
      * Reason (dropdown): "Incomplete work", "Doesn't match description", "Safety issue", "Other"
      * Notes (required): "Pothole partially filled, still visible"
    - Submit
    - Assignment status → back to "ASSIGNED"
    - Create new task for worker: "Issue rejected, please re-work"
    - Notification to worker with rejection reason
    - Issue status → "REJECTED"
    - Back on map + worker's assignment list

STEP 5: View Statistics (Bonus)
  - Quick stats:
    * Approved: 42
    * Rejected: 3
    * Pending: 5
    * Approval rate: 93%

DATABASE SCHEMA (Lightweight):
  verification collection:
  {
    _id: ObjectId,
    assignmentId: ObjectId,
    issueId: ObjectId,
    status: "PENDING" | "APPROVED" | "REJECTED",
    inspectorId: userId,
    inspectorNotes: string,
    rejectionReason: string,
    checklistItems: {
      "No visible holes": true,
      "Surface level": true,
      "Safe to drive": false
    },
    verdict: "APPROVED" | "REJECTED",
    verifiedAt: timestamp,
    createdAt: timestamp
  }
```

**Lightweight Features:**
- ✅ Simple checklist (hardcoded per category, not AI)
- ✅ No photo analysis AI (human eye only)
- ✅ Rejection auto-creates new assignment (simple logic)
- ✅ Stats computed on-the-fly (no aggregation pipeline)

**Time to Implement**: ~2.5 hours (QA UI + verification logic)

---

### WORKFLOW 6: AI DUPLICATE DETECTION (LIGHTWEIGHT)

```
LIGHTWEIGHT APPROACH: String Similarity (NOT ML)

When citizen reports issue:
  - Backend receives: title, description, category
  - Query recent issues (last 7 days) in same category
  - Calculate similarity score using string-similarity library:
    * Title similarity
    * Description similarity
    * Combined score = (title_sim * 0.3 + desc_sim * 0.7)
  
  IF score > 0.75 (75% similar):
    - FLAG as potential duplicate
    - Show to citizen: "This issue might already be reported. View similar issue?"
    - Citizen can:
      * "Continue reporting anyway" (new issue created)
      * "Upvote existing instead" (adds upvote to existing, doesn't create new)
  
  ELSE:
    - Create new issue normally

IMPLEMENTATION (pseudocode):
  const stringSimilarity = require('string-similarity');
  
  async function checkDuplicates(title, description, category) {
    const recentIssues = await Issue.find({
      category: category,
      createdAt: { $gte: Date.now() - 7*24*60*60*1000 }
    });
    
    const duplicates = recentIssues.map(issue => ({
      issue,
      score: (
        stringSimilarity.compareTwoStrings(title, issue.title) * 0.3 +
        stringSimilarity.compareTwoStrings(description, issue.description) * 0.7
      )
    })).filter(d => d.score > 0.75);
    
    return duplicates;
  }

DATABASE TRACKING:
  issues collection has:
  - isDuplicateOf: ObjectId (links to original if merged)
  - duplicateConfidence: number (0-100)
  - mergedAt: timestamp

FRONTEND:
  IF duplicates found:
    <Modal>
      <h2>Similar Issue Found</h2>
      <p>"{existingIssue.title}"</p>
      <p>Upvotes: {existingIssue.upvotes}</p>
      <button onClick={upvoteExisting}>Upvote Instead</button>
      <button onClick={reportAnyway}>Report New Issue</button>
    </Modal>
```

**Lightweight Features:**
- ✅ String similarity library (npm: `string-similarity`)
- ✅ No ML model training
- ✅ Fast execution (milliseconds)
- ✅ Human decision: citizen chooses, not auto-merged

**Time to Implement**: ~1 hour (duplicate check logic + UI modal)

---

### WORKFLOW 7: NOTIFICATIONS (LIGHTWEIGHT, IN-APP ONLY)

```
LIGHTWEIGHT APPROACH: In-App Notifications via Socket.io
(Skip email/SMS for hackathon, mock with console logs)

NOTIFICATION TYPES:
1. "Issue Assigned" → Worker
2. "Issue Upvoted" → Reporter
3. "Issue Assigned to Me" → Worker
4. "Issue Rejected" → Worker (re-work needed)
5. "Issue Approved" → Worker + Reporter
6. "New Comment" → Issue participants
7. "Assignment Waiting" → Supervisor (if SLA approaching)

IMPLEMENTATION:
  Backend sends Socket.io event:
    socket.emit('notification', {
      type: 'ISSUE_ASSIGNED',
      recipient: workerId,
      message: 'New issue: Pothole on Main Street',
      issueId: ObjectId,
      actionUrl: '/assignments/123'
    })
  
  Frontend receives:
    socket.on('notification', (notif) => {
      showToast(notif.message);  // Toast notification
      addToNotificationCenter(notif);  // Bell icon in header
    })
  
  Notification Center UI:
    - Bell icon (header) with unread count
    - Click bell → sidebar opens
    - List of notifications (newest first)
    - Click notification → navigate to relevant page
    - Mark as read / Delete

DATABASE (Simple):
  notifications collection:
  {
    _id: ObjectId,
    recipientId: userId,
    type: string,
    message: string,
    relatedId: ObjectId,
    actionUrl: string,
    read: boolean,
    createdAt: timestamp
  }

EMAIL MOCK (for demo):
  Instead of sending real email:
    console.log(`EMAIL TO ${worker.email}: New issue assigned`);
  
  Show in UI: "Notification sent to worker"

REAL-TIME BROADCAST:
  When new issue created:
    io.emit('issueCreated', issueData);  // All citizens
    io.to('workers').emit('newAssignment', {...});  // Only workers
```

**Lightweight Features:**
- ✅ In-app notifications only (Socket.io)
- ✅ No email/SMS integrations (mocked with console.log)
- ✅ Simple toast + notification center
- ✅ Real-time via Socket.io (same as issue feed)

**Time to Implement**: ~2 hours (notification toast + center + Socket.io events)

---

### WORKFLOW 8: CONTRACTOR BIDDING (LIGHTWEIGHT)

```
LIGHTWEIGHT APPROACH: Simple Bidding System
(No payment processing, just demo bids)

ACTOR: Contractor (external service provider)

STEP 1: Contractor Logs In
  - Contractor role set during registration
  - Sees "Available Issues" tab
  - Shows issues flagged as "Can accept bids"

STEP 2: See Available Issues
  List shows:
  - Issue title + description
  - Category + priority
  - Expected budget (auto-calculated by municipality)
  - "Place Bid" button

STEP 3: Place Bid
  - Clicks "Place Bid"
  - Form appears:
    * Quoted amount (currency)
    * Quoted hours (how long to complete)
    * Notes (optional): "Will use premium materials"
    * "Submit Bid"

STEP 4: Backend Processing
  - API: POST /api/issues/:id/bids
  - Create bid document:
    {
      _id: ObjectId,
      issueId: ObjectId,
      contractorId: userId,
      quotedAmount: number,
      quotedHours: number,
      notes: string,
      status: "PENDING" | "ACCEPTED" | "REJECTED",
      createdAt: timestamp
    }
  - Notify supervisor: "New bid from ContractorName: $500"

STEP 5: Supervisor Reviews Bids
  - Admin dashboard shows:
    * All bids for each issue
    * Contractor name + rating (if tracked)
    * Quoted amount + hours
    * "Accept" / "Reject" buttons

STEP 6: Supervisor Accepts Bid
  - Clicks "Accept"
  - Assignment created:
    {
      issueId,
      assignedTo: contractorId,
      status: "ACCEPTED",
      contractType: "CONTRACTOR",
      quotedAmount,
      quotedHours
    }
  - All other bids rejected automatically
  - Notification to selected contractor: "Bid accepted for 'Pothole on Main Street'"
  - Notification to rejected contractors: "Your bid was not accepted"

DATABASE:
  bids collection:
  {
    _id: ObjectId,
    issueId: ObjectId,
    contractorId: userId,
    quotedAmount: number,
    quotedHours: number,
    notes: string,
    status: "PENDING" | "ACCEPTED" | "REJECTED",
    createdAt: timestamp
  }

FRONTEND (Contractor View):
  <BidForm>
    <input placeholder="Amount ($)" />
    <input placeholder="Hours" />
    <textarea placeholder="Notes" />
    <button>Submit Bid</button>
  </BidForm>

WORKFLOW ENDS SAME AS WORKER:
  Contractor accepts → updates progress → completes → QA verifies
```

**Lightweight Features:**
- ✅ Simple bid form (amount + hours)
- ✅ No payment integration (just track amounts)
- ✅ Supervisor selects winning bid manually
- ✅ Reuses assignment + completion workflow

**Time to Implement**: ~2 hours (contractor UI + bidding logic)

---

### WORKFLOW 9: ANALYTICS DASHBOARD (LIGHTWEIGHT)

```
LIGHTWEIGHT APPROACH: Pre-computed Stats Dashboard

ACTOR: Municipality Admin / City Planner

STEP 1: Open "Analytics" Dashboard
  - Shows real-time stats computed on-demand:
    * Total issues reported (this month)
    * Open issues (not yet completed)
    * Completed issues (with %)
    * Average resolution time (days)
    * Issues by category (bar chart)
    * Hotspots (top 10 locations with most issues)
    * Trending issues (most upvotes)
    * SLA compliance (% within target)

STEP 2: See Key Metrics
  Cards display:
    | Total Issues      | 247     |
    | Open              | 43      |
    | Resolved          | 204 (83%)
    | Avg. Time         | 2.3 days|
    | SLA Compliance    | 87%     |

STEP 3: Charts
  - Category breakdown (pie or bar)
    * Roads: 85 issues (34%)
    * Utilities: 62 (25%)
    * Parks: 40 (16%)
    * Traffic: 35 (14%)
    * Other: 25 (10%)
  
  - Issues by status (stacked bar)
    * REPORTED, ASSIGNED, IN_PROGRESS, COMPLETED, RESOLVED
  
  - Hotspots (interactive map)
    * Heat map overlay showing issue density
    * Red zones = high density
    * Click zone → see all issues in that area

STEP 4: Filters (Bonus)
  - Date range: "Last 7 days" / "Last month" / "Custom"
  - Category: multiselect
  - Status: multiselect
  - Update charts on filter change

IMPLEMENTATION:
  API endpoint: GET /api/analytics?dateRange=30days&category=Roads
  
  Compute on-the-fly:
    const stats = {
      totalIssues: await Issue.countDocuments({dateFilter}),
      openIssues: await Issue.countDocuments({status: {$nin: ['COMPLETED', 'RESOLVED']}}),
      resolvedIssues: await Issue.countDocuments({status: 'RESOLVED'}),
      avgResolutionTime: await calculateAvgTime(),
      byCategory: await Issue.aggregate([
        {$group: {_id: '$category', count: {$sum: 1}}}
      ]),
      topIssues: await Issue.find().sort({upvotes: -1}).limit(10)
    };

FRONTEND:
  <Dashboard>
    <StatCard title="Total Issues" value={247} />
    <StatCard title="Open" value={43} />
    <BarChart data={byCategoryData} />
    <MapWithHeatmap data={hotspotsData} />
  </Dashboard>

DATABASE:
  No additional collection needed. Query from:
  - issues collection (main data source)
  - assignments collection (completion tracking)
  - verification collection (QA status)
```

**Lightweight Features:**
- ✅ Aggregation queries (MongoDB aggregation pipeline)
- ✅ No separate analytics database
- ✅ Charts using Chart.js or Recharts (simple React library)
- ✅ Heat map using Leaflet plugins (free)
- ✅ Stats computed on-demand (cache with Redis if needed)

**Time to Implement**: ~2.5 hours (dashboard UI + aggregation queries + charts)

---

## 24-HOUR HACKATHON TIMELINE

```
HOUR 0-1: Setup (1 student leading)
  - Create React Vite project
  - Create Node/Express app
  - Setup MongoDB Atlas free account
  - Create GitHub repo
  - Setup .env files (API keys, DB connection)
  - Test: Frontend and Backend start successfully

HOUR 1-3: Database Schema + Auth (Student 2)
  - Create MongoDB collections:
    * users (email, password_hash, role, avatar)
    * issues
    * assignments
    * bids
    * verifications
    * notifications
    * work_logs
  - Implement JWT auth:
    * POST /auth/register
    * POST /auth/login
    * POST /auth/logout
    * Middleware: verifyToken
  - Password hashing with bcrypt
  - Test: Can register, login, get JWT token

HOUR 3-6: Core Backend APIs (Student 2)
  - Issues API:
    * POST /api/issues (create)
    * GET /api/issues (list, filter, sort)
    * GET /api/issues/:id (detail)
    * PATCH /api/issues/:id/upvote
    * POST /api/issues/:id/comments
  - Implement duplicate detection (string similarity)
  - Test: Can create, list, upvote issues

HOUR 6-9: Frontend - Reporting + Feed (Student 1)
  - Layout: Header (nav), Sidebar (user profile), Main content
  - Pages:
    * Login/Signup (forms, validation)
    * Report Issue (form, file upload, location picker)
    * Issue Feed (list, sort, filter, upvote button)
  - Components:
    * IssueCard (reusable)
    * ReportForm (reusable)
    * AuthGuard (redirect if not logged in)
  - Styling: TailwindCSS pre-built buttons/cards
  - Test: Can report issue, see it in feed, upvote

HOUR 9-12: Frontend - Map View (Student 1)
  - Pages:
    * Map view with Leaflet
    * Category filter sidebar
  - Components:
    * MapContainer (Leaflet setup)
    * IssueMarker (custom icon per category)
    * MarkerPopup (click to see details)
  - Real-time: Socket.io integration
    * New issue appears on map
    * Upvote count updates
  - Test: Can see issues on map, click to view details

HOUR 12-14: Worker App (Student 3)
  - Pages:
    * Worker login
    * My Assignments (list of assigned issues)
    * Assignment detail (map, description, accept/decline)
    * Completion form (photos, notes)
  - Components:
    * AssignmentCard
    * CompletionForm (file upload)
  - Test: Can accept assignment, upload completion photos

HOUR 14-16: Assignment Logic (Student 2 + 3)
  - Assignment APIs:
    * POST /api/assignments (create, auto-match worker)
    * PATCH /api/assignments/:id/accept
    * PATCH /api/assignments/:id/complete
    * GET /api/assignments/worker/:id
  - Verification APIs:
    * GET /api/verifications (pending for QA)
    * PATCH /api/verifications/:id (approve/reject)
  - Auto-assignment logic (hardcoded for demo)
  - Test: Can assign, accept, complete assignment

HOUR 16-18: QA + Inspector App (Student 3)
  - Pages:
    * Inspector login
    * Pending Verification (queue of completed issues)
    * Verification detail (checklist, approve/reject form)
  - Components:
    * VerificationForm
    * IssueDetailWithPhotos
  - Test: Can approve/reject completion

HOUR 18-19: Contractor Bidding (Student 1 + 2)
  - Pages:
    * Contractor: Available Issues + Place Bid form
    * Admin: View Bids + Accept/Reject
  - APIs:
    * POST /api/issues/:id/bids
    * PATCH /api/issues/:id/bids/:bidId (accept/reject)
  - Test: Can place bid, accept bid

HOUR 19-20: Analytics Dashboard (Student 1)
  - Pages:
    * Analytics dashboard
    * Stats cards, charts, heat map
  - Components:
    * StatCard
    * BarChart (Chart.js or Recharts)
    * HeatMap (Leaflet)
  - Test: Dashboards show correct stats

HOUR 20-21: Socket.io Real-Time + Notifications (Student 2)
  - Socket.io events:
    * New issue created → broadcast to map
    * Issue upvoted → broadcast
    * Assignment created → notify worker
    * Issue completed → notify inspector
    * Issue approved/rejected → notify worker
  - Notification UI:
    * Toast notification (react-toastify)
    * Notification center (bell icon)
  - Test: Real-time updates work across all pages

HOUR 21-22: Styling + Mobile Responsive (Student 1)
  - TailwindCSS responsive classes
  - Test on mobile devices (phone size simulation)
  - Fix any layout issues
  - Ensure buttons are clickable on mobile

HOUR 22-23: Integration Testing + Bug Fixes (All students)
  - Full end-to-end workflows:
    1. Citizen reports issue
    2. Worker assigned + completes
    3. QA verifies
    4. Citizen sees resolved status
  - Test on multiple browsers (Chrome, Firefox, Safari)
  - Fix critical bugs
  - Ensure no console errors

HOUR 23-24: Demo Prep + Deployment (All students)
  - Deploy frontend to Vercel (GitHub push → auto-deploy)
  - Deploy backend to Railway/Heroku
  - Create demo account + sample data (10-15 issues)
  - Plan 5-minute demo script
  - Create slide deck (optional)
  - Practice demo together

FINAL: Demo Ready!
```

---

## DEMO SCRIPT (5 Minutes)

```
MINUTE 0-1: INTRO
"Hi, we're Team [Name]. We built FixMyCity, a civic engagement platform where citizens aren't passive—they're active participants in solving city problems.

We all know cities have problems: potholes, broken lights, blocked drains. Usually, citizens don't know who to call, and municipalities don't know what's urgent. FixMyCity solves this."

MINUTE 1-2: MAP + FEED
[Show map]
"Here's our map showing all reported civic issues as landmarks. Each pin is color-coded by priority: red for critical, yellow for medium, blue for low.

Citizens can see problems in their neighborhood. Let me click one."

[Click issue pin → show popup]
"You can see the issue title, number of upvotes, and details. This is not just a complaint system—it's a democratic voting system. Citizens decide what matters most."

[Switch to feed view]
"Here's the same data in feed format. Citizens can upvote issues they care about, like on Twitter. This creates a ranking by community priority."

MINUTE 2-3: REPORT AN ISSUE LIVE
"Now let me report a new issue live."

[Open report form]
"Title: 'Broken streetlight on 5th Street'"
"Description: 'Streetlight outside apartment complex is broken, dangerous at night'"
"Category: Street Lighting (auto-selects priority as HIGH)"
"Location: I click on the map to pin it."

[Click on map, location appears]

"Upload a photo (optional)"
"Submit!"

[Issue created → appears on map + feed instantly]

"Notice: it appeared on the map and feed immediately in real-time. Everyone sees it."

MINUTE 3-4: WORKER VIEW
[Switch to worker app]
"This is what workers see. The municipality supervisor has assigned this issue to a street maintenance worker.

The worker sees: issue details, SLA deadline, and buttons to accept or update progress.

Let me click 'Accept'."

[Worker accepts]

"Status changes to 'In Progress'. Now the worker goes to fix it in the field."

[Click "Mark Complete"]

[Worker uploads before/after photos]

"Worker uploads evidence photos and submits."

MINUTE 4-5: QUALITY ASSURANCE
[Switch to QA inspector view]

"Now a quality inspector verifies the work. Here's the checklist: 'Streetlight on?', 'Proper installation?', 'Safe?'"

[Inspector checks boxes]

"Inspector approves."

[Back to citizen view]

"The citizen now sees status as 'RESOLVED' with approval timestamp. The issue turned green on the map—it's fixed.

Plus, we have real-time analytics: how many issues open, resolved, SLA compliance rate."

[Show dashboard with stats]

"CLOSE:
FixMyCity turns civic problems into community-driven solutions. It's transparency, engagement, and efficiency combined. And it's scalable to every city globally."

[Show GitHub repo on screen]
```

---

## API CONTRACTS (All Endpoints)

### PUBLIC ENDPOINTS (No Auth Required)
```
GET /api/issues
  Query: ?sort=trending|recent&category=Roads,Parks&limit=50
  Response: [{_id, title, description, category, upvotes, status, lat, lng, photos, reportedBy}]

GET /api/issues/:id
  Response: Full issue + comments + assignment status (if any)

GET /api/issues/map
  Query: ?bounds=lat1,lng1,lat2,lng2&category=Roads
  Response: [{_id, title, lat, lng, priority, status}]

POST /auth/register
  Body: {email, password, name, role: 'citizen|worker|contractor'}
  Response: {userId, token, user: {name, email, role}}

POST /auth/login
  Body: {email, password}
  Response: {userId, token, user: {...}}
```

### AUTHENTICATED ENDPOINTS (Require JWT Token)

**CITIZEN ENDPOINTS:**
```
POST /api/issues
  Body: {title, description, category, latitude, longitude, address, photos: [files]}
  Response: {issueId, createdAt, duplicate: {similar: [...]}}

PATCH /api/issues/:id/upvote
  Response: {upvotes, upvotedBy}

POST /api/issues/:id/comments
  Body: {text}
  Response: {commentId, text, author, createdAt}

GET /api/my-issues
  Response: [{_id, title, status, upvotes, ...}]
```

**WORKER ENDPOINTS:**
```
GET /api/assignments/mine
  Response: [{assignmentId, issueId, issue: {...}, status, assignedAt, deadline}]

PATCH /api/assignments/:id/accept
  Response: {status: 'ACCEPTED', acceptedAt}

PATCH /api/assignments/:id/update-status
  Body: {status: 'ON_SITE|ASSESSING|IN_PROGRESS', notes, location}
  Response: {status, updatedAt}

PATCH /api/assignments/:id/complete
  Body: {photos: [files], notes, durationMinutes}
  Response: {status: 'COMPLETED', completedAt}
```

**QA INSPECTOR ENDPOINTS:**
```
GET /api/verifications/pending
  Response: [{verificationId, assignmentId, issue: {...}, completionPhotos, completionNotes}]

PATCH /api/verifications/:id/verify
  Body: {verdict: 'APPROVED|REJECTED', notes, rejectionReason}
  Response: {status, verifiedAt}

GET /api/verifications/stats
  Response: {approved, rejected, pending, approvalRate}
```

**CONTRACTOR ENDPOINTS:**
```
GET /api/issues/available-for-bid
  Response: [{issueId, title, budget, description, ...}]

POST /api/issues/:id/bids
  Body: {quotedAmount, quotedHours, notes}
  Response: {bidId, status: 'PENDING', createdAt}

GET /api/my-bids
  Response: [{bidId, issueId, status, quotedAmount, ...}]
```

**ADMIN ENDPOINTS:**
```
GET /api/analytics
  Query: ?dateRange=7days|30days|custom&category=Roads&status=RESOLVED
  Response: {totalIssues, open, resolved, avgTime, byCategory, topIssues, hotspots}

POST /api/assignments/:issueId/assign
  Body: {workerId|contractorId}
  Response: {assignmentId, status: 'ASSIGNED'}

GET /api/admin/overview
  Response: {totalCities, activeWorkers, pendingIssues, slaCompliance}
```

---

## DATABASE COLLECTIONS (MongoDB)

```
users
  _id, email, password_hash, name, avatar, role, city, createdAt

issues
  _id, city, title, description, category, priority, latitude, longitude,
  address, photos, reportedBy, status, upvotes, upvotedBy, comments,
  isDuplicateOf, duplicateConfidence, createdAt, updatedAt

assignments
  _id, issueId, assignedTo (workerId|contractorId), assignedBy, status,
  priority, assignedAt, acceptedAt, completedAt, completionPhotos,
  completionNotes, estimatedCompletionTime, createdAt

work_logs
  _id, assignmentId, workerId, status, notes, location, timestamp

bids
  _id, issueId, contractorId, quotedAmount, quotedHours, notes, status, createdAt

verifications
  _id, assignmentId, issueId, inspectorId, verdict, notes, checklist,
  rejectionReason, verifiedAt, createdAt

notifications
  _id, recipientId, type, message, relatedId, actionUrl, read, createdAt

comments
  _id, issueId, authorId, text, createdAt
```

---

## ESTIMATED EFFORT & TEAM ALLOCATION

| Component | Hours | Student | Difficulty |
|-----------|-------|---------|-----------|
| Setup + Auth | 3 | #2 | Easy |
| Core Issues API | 3 | #2 | Easy |
| Report + Feed UI | 3 | #1 | Medium |
| Map View | 3 | #1 | Medium |
| Worker App | 3 | #3 | Medium |
| Assignment Logic | 2 | #2+#3 | Medium |
| QA Inspector | 2 | #3 | Easy |
| Bidding System | 2 | #1+#2 | Medium |
| Analytics | 2.5 | #1 | Medium |
| Socket.io Real-Time | 2 | #2 | Hard |
| Mobile + Styling | 1.5 | #1 | Easy |
| Testing + Deploy | 2 | All | Hard |
| **TOTAL** | **~24 hours** | All 3 | - |

---

## SUCCESS CRITERIA FOR JUDGES

✅ **Complete Product Demo**
  - Citizen reports issue
  - Workers see and complete assignments
  - QA verifies quality
  - Analytics show trends
  - All in real-time

✅ **Impressive Tech**
  - Real-time WebSocket updates
  - Interactive map with Leaflet
  - MongoDB/Node.js scalability
  - Responsive mobile design
  - Deployed live (not local)

✅ **Social + Civic Impact**
  - Upvoting = community engagement
  - Transparency (citizen sees status)
  - Accountability (worker photo evidence)
  - Democratic prioritization (upvotes matter)

✅ **Team Execution**
  - No crashes during demo
  - Smooth handoff between features
  - Good UI/UX (not just backend)
  - Prepared answers to "what next?"

---

## POST-HACKATHON ROADMAP (Document This!)

```
After hackathon, evolve to full architecture:

PHASE 1.5: Migrate to Production Stack
  - Replace MongoDB → PostgreSQL (with schema from README)
  - Add proper error handling + logging
  - Add input validation + sanitization
  - Add rate limiting
  - Setup CI/CD pipeline

PHASE 2: Add Microservices (Java)
  - Split Express into microservices
  - Implement event bus (RabbitMQ)
  - Add AI duplicate detection (Python FastAPI)
  - Add real notifications (email/SMS)
  - Implement full security model

PHASE 3: Scale Intelligence
  - Add prediction models
  - Implement analytics aggregation
  - Add contractor payment system
  - Multi-city governance
  - Predictive maintenance
```

---

## Next Steps

Awaiting further instructions for implementation, code generation, or deployment guides.

## Project Information

- **Location**: `c:\Users\ashar\OneDrive\Desktop\Vivitsu`
- **Status**: Complete Hackathon MVP Specification (24 hours)
- **Target**: 5-minute demo for judges
- **Last Updated**: January 29, 2026
- **Next Phase**: Microservices + Production Stack (post-hackathon)
