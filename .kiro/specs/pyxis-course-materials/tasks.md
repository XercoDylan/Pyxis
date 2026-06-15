# Implementation Plan: Pyxis Course Materials

## Overview

This implementation plan breaks the Pyxis course materials platform into incremental coding tasks organized by logical phases. Each phase builds on previous work, starting with project setup and data layer, moving through authentication, core CRUD features, file operations, and finishing with UI polish and integration wiring. Property-based tests validate correctness properties from the design, and unit tests cover edge cases.

## Tasks

- [x] 1. Project scaffolding and shared infrastructure
  - [x] 1.1 Initialize monorepo structure with Vite React frontend and Express backend
    - Create root-level project with `client/` (Vite + React + TypeScript) and `server/` (Node.js + Express + TypeScript) directories
    - Configure `tsconfig.json` for both packages with strict mode
    - Install shared dev dependencies: Vitest, fast-check, Playwright, ESLint, Prettier
    - Set up Tailwind CSS in the client with the Chocolate City black and gold theme tokens in `src/styles/theme.ts`
    - _Requirements: 10.1, 10.4_

  - [x] 1.2 Define Prisma schema and database migrations
    - Create `prisma/schema.prisma` with Member, AccessListEntry, Course, Category, and File models as specified in the design
    - Add indexes for `[categoryId, uploadedAt(sort: Desc)]` and `[uploadedById]` on the File model
    - Add unique constraints: `kerberos` on Member, `kerberos` on AccessListEntry, `courseNumber` on Course, `[courseId, name]` on Category, `s3Key` on File
    - Generate and run initial migration
    - _Requirements: 4.1, 5.1, 5.4, 8.2_

  - [x] 1.3 Set up backend configuration modules
    - Create `server/src/config/database.ts` (Prisma client singleton)
    - Create `server/src/config/redis.ts` (Redis connection with ioredis)
    - Create `server/src/config/s3.ts` (AWS S3 client with @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner)
    - Create `server/src/config/saml.ts` (passport-saml strategy configuration for MIT Touchstone)
    - Use environment variables for all connection strings and secrets
    - _Requirements: 1.1, 1.4_

  - [x] 1.4 Create shared TypeScript types and API error handling
    - Define shared types in `server/src/types/index.ts`: SessionData, ApiError, pagination interfaces
    - Create `server/src/middleware/errorHandler.ts` implementing the centralized error response format from the design
    - Define typed application error classes (AppError with code, status, details)
    - _Requirements: 7.5, 6.6, 1.5_

  - [x] 1.5 Create validation utility functions
    - Implement Kerberos format validation: `^[a-z][a-z0-9_]{0,7}@mit.edu$`
    - Implement course number validation (non-empty, max 20 chars)
    - Implement course name validation (non-empty, max 100 chars)
    - Implement category name validation (non-empty, max 50 chars)
    - Implement file size validation (max 50 MB) and batch size validation (max 10 files)
    - Implement string truncation utility (truncate to N chars with ellipsis)
    - Implement content type classification (viewable vs download-only)
    - Implement ZIP filename generation functions
    - Place in `server/src/validators/` and `client/src/utils/`
    - _Requirements: 2.5, 3.3, 5.3, 7.4, 8.3, 8.5, 6.1, 6.3, 6.4_

  - [x] 1.6 Write property tests for validation and utility functions
    - **Property 4: Kerberos format validation** — strings matching `^[a-z][a-z0-9_]{0,7}@mit.edu$` accepted, all others rejected
    - **Validates: Requirements 2.5**

  - [x] 1.7 Write property tests for string truncation
    - **Property 6: String truncation preserves prefix** — returns original if length ≤ N, or N-char prefix + ellipsis if longer
    - **Validates: Requirements 3.3, 5.3**

  - [x] 1.8 Write property tests for file format classification
    - **Property 13: File format classification** — viewable iff content type is pdf, png, jpeg, gif, or svg+xml; all others download-only
    - **Validates: Requirements 6.1, 6.5**

  - [x] 1.9 Write property tests for upload validation
    - **Property 14: Upload size and batch validation** — reject files > 50 MB, reject batches > 10 files, accept valid combinations
    - **Validates: Requirements 7.2, 7.4**

  - [x] 1.10 Write property tests for course/category input validation
    - **Property 16: Course and category input validation** — reject empty or over-limit fields, accept valid inputs
    - **Validates: Requirements 8.3, 8.5**

  - [x] 1.11 Write property tests for ZIP archive naming
    - **Property 12: ZIP archive naming convention** — category ZIP named `{courseNumber}_{categoryName}.zip`, course ZIP named `{courseNumber}_all.zip`
    - **Validates: Requirements 6.3, 6.4**

- [x] 2. Authentication and session management
  - [x] 2.1 Implement SAML authentication routes
    - Create `server/src/routes/auth.routes.ts` with GET `/auth/login`, POST `/auth/callback`, POST `/auth/logout`, GET `/auth/session`
    - Configure passport-saml strategy to redirect to MIT Touchstone IdP
    - On callback: validate SAML assertion, extract kerberos/name/email attributes
    - Check kerberos against access_list table; return 403 if not found
    - Create or update Member record on successful login
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2_

  - [x] 2.2 Implement Redis session middleware
    - Configure express-session with connect-redis store
    - Set session TTL to 28800 seconds (8 hours)
    - Store SessionData (memberId, kerberos, name, isAdmin) in session
    - Create `server/src/middleware/auth.ts` to validate session on protected routes and redirect to login if expired
    - _Requirements: 1.4, 1.6_

  - [x] 2.3 Implement access list service and admin routes
    - Create `server/src/services/auth.service.ts` with checkMembership, addToAccessList, removeFromAccessList, bulkAdd
    - Create `server/src/routes/admin.routes.ts` with GET/POST/DELETE for access list management
    - Create `server/src/middleware/adminOnly.ts` to restrict admin routes to Academic Chair users
    - Implement bulk parsing (comma/newline separated, max 50 per operation)
    - On removal: invalidate active sessions for the removed kerberos via Redis scan
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 2.4 Write property tests for access list operations
    - **Property 1: Access list membership round-trip** — adding a valid kerberos then checking membership returns true
    - **Validates: Requirements 1.2, 2.2**

  - [x] 2.5 Write property tests for access list removal
    - **Property 2: Access list removal revokes membership** — removing an existing kerberos then checking returns false
    - **Validates: Requirements 2.3**

  - [x] 2.6 Write property tests for bulk access list parsing
    - **Property 3: Bulk access list parsing** — up to 50 valid kerberos IDs separated by commas/newlines all end up in the list
    - **Validates: Requirements 2.4**

  - [x] 2.7 Write property tests for access list idempotence
    - **Property 5: Access list add is idempotent** — adding the same kerberos twice yields the same state as adding once
    - **Validates: Requirements 2.6**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Course and category CRUD
  - [x] 4.1 Implement course service and routes
    - Create `server/src/services/course.service.ts` with listCourses, searchCourses, createCourse, getCourseWithCategories
    - Create `server/src/routes/course.routes.ts` with GET `/api/courses` (supports `?search=`), POST `/api/courses`, GET `/api/courses/:courseId`
    - On create: validate inputs, check uniqueness, create course with three default categories (Exams, Problem_Sets, Lectures)
    - Return 409 COURSE_EXISTS if duplicate course number
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 8.1, 8.2, 8.3, 8.4_

  - [x] 4.2 Implement category service and routes
    - Create `server/src/services/category.service.ts` with listCategories, createCategory
    - Create `server/src/routes/category.routes.ts` with GET `/api/courses/:courseId/categories`, POST `/api/courses/:courseId/categories`
    - Validate category name (non-empty, max 50 chars), check uniqueness within course
    - Return 409 CATEGORY_EXISTS if duplicate name within same course
    - _Requirements: 5.1, 8.5, 8.6_

  - [x] 4.3 Write property tests for course search filtering
    - **Property 7: Course search filter correctness** — returns exactly courses where search term is case-insensitive substring of number or name
    - **Validates: Requirements 4.4**

  - [x] 4.4 Write property tests for course alphabetical ordering
    - **Property 8: Course list alphabetical ordering** — sorted output has each course number ≤ next lexicographically
    - **Validates: Requirements 4.1**

  - [x] 4.5 Write property tests for category ordering
    - **Property 9: Category list alphabetical ordering** — sorted output has each category name ≤ next lexicographically
    - **Validates: Requirements 5.1**

  - [x] 4.6 Write property tests for default category creation
    - **Property 15: Course creation produces default categories** — creating a valid course results in exactly Exams, Problem_Sets, Lectures categories
    - **Validates: Requirements 8.2**

- [x] 5. File operations (upload, download, view)
  - [x] 5.1 Implement file upload service with presigned URLs
    - Create `server/src/services/file.service.ts` with generateUploadUrl, confirmUpload, listFiles
    - POST `/api/files/upload-url`: validate file size < 50 MB, generate presigned PUT URL with 15-minute expiry, return URL + temporary file ID
    - POST `/api/files/confirm`: create File record in DB with metadata (filename, s3Key, contentType, fileSize, uploadedBy, categoryId)
    - Support batch: client calls upload-url for each file (max 10), uploads directly to S3, then confirms each
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 5.2 Implement file listing with pagination and sorting
    - GET `/api/categories/:categoryId/files` with `?page=1&limit=50`
    - Sort by uploadedAt DESC, then filename ASC for ties
    - Return paginated response with items, totalCount, totalPages, currentPage
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [x] 5.3 Implement file download and view routes
    - GET `/api/files/:fileId/download`: generate presigned GET URL, redirect client
    - GET `/api/files/:fileId/view`: generate presigned GET URL for inline viewing
    - Preserve original filename in Content-Disposition header for downloads
    - _Requirements: 6.1, 6.2, 6.5_

  - [x] 5.4 Implement ZIP download service
    - Create `server/src/services/zip.service.ts` using the `archiver` library for streaming ZIP creation
    - GET `/api/categories/:categoryId/download-zip`: stream all files in category as `{courseNumber}_{categoryName}.zip`
    - GET `/api/courses/:courseId/download-zip`: stream all files organized by category subdirectories as `{courseNumber}_all.zip`
    - Handle errors gracefully with retry-friendly response
    - _Requirements: 6.3, 6.4, 6.6_

  - [x] 5.5 Write property tests for file sort ordering
    - **Property 10: File list composite sort** — for adjacent pairs: either a.uploadDate > b.uploadDate, or equal dates with a.filename ≤ b.filename
    - **Validates: Requirements 5.4**

  - [x] 5.6 Write property tests for pagination
    - **Property 11: Pagination invariant** — N files with page size 50 produces ⌈N/50⌉ pages, max 50 per page, union equals original list
    - **Validates: Requirements 5.2**

- [x] 6. Member statistics
  - [x] 6.1 Implement statistics service and routes
    - Create `server/src/services/stats.service.ts` with getLeaderboard, getMemberContributions
    - GET `/api/stats/leaderboard`: query members with upload count > 0, include total files and distinct course count
    - Sort by totalFiles DESC, then name ASC for ties
    - GET `/api/stats/members/:memberId`: list all files by member grouped by course, with filename, category, and upload date
    - GET `/api/members/me`: return current member profile with contribution stats
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 3.4_

  - [x] 6.2 Write property tests for leaderboard filtering
    - **Property 17: Leaderboard only includes contributors** — returns exactly members with upload count > 0
    - **Validates: Requirements 9.1**

  - [x] 6.3 Write property tests for contribution aggregation
    - **Property 18: Contribution statistics aggregation** — total files equals actual upload count, distinct courses equals unique courses contributed to
    - **Validates: Requirements 9.2**

  - [x] 6.4 Write property tests for leaderboard sort
    - **Property 19: Leaderboard composite sort** — adjacent pairs: either a.totalFiles > b.totalFiles, or equal with a.name ≤ b.name
    - **Validates: Requirements 9.3**

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Frontend layout, navigation, and theme
  - [x] 8.1 Create Layout, NavBar, and Breadcrumbs components
    - Implement `client/src/components/layout/Layout.tsx` as the root layout wrapper
    - Implement `client/src/components/layout/NavBar.tsx` with fixed-position header, Chocolate City logo, links to Home/Stats/Profile/Admin (admin conditional on isAdmin)
    - Highlight active nav item with gold accent color
    - Display member name (truncated to 30 chars) in header
    - Implement `client/src/components/layout/Breadcrumbs.tsx` generating clickable breadcrumb segments from current route
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2, 11.3, 11.4, 3.3_

  - [x] 8.2 Set up React Router and page shells
    - Configure react-router-dom with routes: `/` (Home), `/courses/:courseId` (Course), `/courses/:courseId/categories/:categoryId` (Category), `/files/:fileId` (FileViewer), `/stats` (Stats), `/profile` (Profile), `/admin` (Admin), `/access-denied` (AccessDenied)
    - Create page shell components in `client/src/pages/`
    - Implement `client/src/hooks/useAuth.ts` to check session status and redirect unauthenticated users
    - Create shared components: Pagination, EmptyState, ErrorMessage, LoadingSpinner
    - _Requirements: 11.1, 11.2, 1.1, 4.5, 4.6, 5.5_

  - [x] 8.3 Write property tests for breadcrumb generation
    - **Property 21: Breadcrumb generation from route path** — valid paths produce ordered segments with labels and navigation links
    - **Validates: Requirements 11.2**

  - [x] 8.4 Write property tests for color contrast
    - **Property 20: Color contrast accessibility** — all theme color pairs meet WCAG 4.5:1 contrast ratio
    - **Validates: Requirements 10.5**

- [x] 9. Frontend feature pages
  - [x] 9.1 Implement HomePage with CourseGrid and SearchBar
    - Create `client/src/pages/HomePage.tsx` fetching courses from GET `/api/courses`
    - Implement `client/src/components/courses/CourseGrid.tsx` rendering clickable cards with course number and name
    - Implement `client/src/components/courses/SearchBar.tsx` with client-side filtering (case-insensitive substring on number or name)
    - Show empty state when no courses exist; show no-results message when search yields nothing
    - Implement `client/src/components/courses/AddCourseModal.tsx` for creating new courses
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 8.1, 8.2, 8.3, 8.4_

  - [x] 9.2 Implement CoursePage with CategoryList
    - Create `client/src/pages/CoursePage.tsx` fetching course details and categories
    - Implement `client/src/components/categories/CategoryList.tsx` displaying categories alphabetically
    - Implement `client/src/components/categories/AddCategoryModal.tsx` for custom category creation
    - Include download button for entire course ZIP
    - _Requirements: 5.1, 6.4, 8.5, 8.6_

  - [x] 9.3 Implement CategoryPage with FileList, UploadArea, and Pagination
    - Create `client/src/pages/CategoryPage.tsx` fetching paginated files
    - Implement `client/src/components/files/FileList.tsx` and `FileRow.tsx` displaying filename (truncated 80 chars), uploader name, date (YYYY-MM-DD)
    - Implement `client/src/components/files/UploadArea.tsx` with file picker (max 10 files), size validation (50 MB), progress indicators per file
    - Implement `client/src/hooks/useUpload.ts` managing presigned URL flow: get URL → PUT to S3 → confirm
    - Include category ZIP download button and pagination controls
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 9.4 Implement FileViewer page
    - Create `client/src/pages/FileViewerPage.tsx` rendering inline preview for supported formats (PDF via `<embed>`, images via `<img>`)
    - Show "cannot preview" message with download button for unsupported formats
    - Include download button for all files
    - _Requirements: 6.1, 6.2, 6.5_

  - [x] 9.5 Implement StatsPage and ProfilePage
    - Create `client/src/pages/StatsPage.tsx` with `LeaderboardTable` showing name, total files, distinct courses
    - Implement `client/src/components/stats/MemberDetail.tsx` showing files by course on click
    - Create `client/src/pages/ProfilePage.tsx` showing name, email, join date, total contributions, last contribution date
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 3.4_

  - [x] 9.6 Implement AdminPage with AccessListManager
    - Create `client/src/pages/AdminPage.tsx` with `AccessListManager` component
    - Show current access list entries
    - Support single add, bulk add (comma/newline textarea), and remove with confirmation
    - Display validation errors for invalid kerberos format
    - Display duplicate notification for already-present identifiers
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. API client and frontend-backend wiring
  - [x] 11.1 Create Axios API client with interceptors
    - Create `client/src/api/client.ts` with base URL configuration, session cookie handling, and response interceptors
    - Implement automatic retry with exponential backoff for 5xx errors (max 3 attempts, 1s/2s/4s delays)
    - Redirect to login on 401 responses
    - _Requirements: 1.1, 1.5, 1.6_

  - [x] 11.2 Create API modules for each resource
    - Create `client/src/api/courses.ts` (listCourses, createCourse, getCourse)
    - Create `client/src/api/files.ts` (getUploadUrl, confirmUpload, listFiles, getDownloadUrl, getViewUrl, downloadCategoryZip, downloadCourseZip)
    - Create `client/src/api/stats.ts` (getLeaderboard, getMemberDetail, getMyProfile)
    - Create `client/src/api/admin.ts` (getAccessList, addEntry, bulkAdd, removeEntry)
    - Wire all page components to use these API modules instead of mock data
    - _Requirements: 4.1, 5.2, 6.2, 7.3, 9.1, 2.2_

  - [x] 11.3 Wire Express server entry point and route registration
    - Create `server/src/server.ts` assembling all middleware: CORS, session, passport, JSON parsing, error handler
    - Register all route modules under appropriate paths
    - Add health check endpoint at GET `/api/health`
    - Configure static serving of client build in production
    - _Requirements: 1.1, 11.1_

- [x] 12. Responsive design and accessibility pass
  - [x] 12.1 Implement responsive layout adjustments
    - Ensure all pages render without horizontal scroll from 320px to 1920px viewports
    - Use Tailwind responsive utilities for grid columns (1 col mobile, 2-3 cols tablet, 4 cols desktop on CourseGrid)
    - Ensure no overlapping elements and all interactive elements accessible at all viewport widths
    - Verify navigation collapses to mobile-friendly format at small viewports
    - _Requirements: 10.3_

  - [x] 12.2 Verify typography, spacing, and contrast consistency
    - Apply consistent font family, font sizes, and spacing values across all pages using Tailwind theme tokens
    - Verify minimum 4.5:1 contrast ratio for all text/background color pairs
    - Ensure Chocolate City logo maintains aspect ratio in header
    - _Requirements: 10.1, 10.2, 10.4, 10.5_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The frontend uses client-side filtering for course search to reduce API calls; the backend also supports `?search=` for server-side filtering as a fallback
- File uploads use presigned URLs so files go directly from browser to S3, reducing backend load
- ZIP generation is streaming to avoid loading all files into memory

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"] },
    { "id": 2, "tasks": ["1.5"] },
    { "id": 3, "tasks": ["1.6", "1.7", "1.8", "1.9", "1.10", "1.11"] },
    { "id": 4, "tasks": ["2.1", "2.2"] },
    { "id": 5, "tasks": ["2.3"] },
    { "id": 6, "tasks": ["2.4", "2.5", "2.6", "2.7"] },
    { "id": 7, "tasks": ["4.1", "4.2"] },
    { "id": 8, "tasks": ["4.3", "4.4", "4.5", "4.6"] },
    { "id": 9, "tasks": ["5.1", "5.2"] },
    { "id": 10, "tasks": ["5.3", "5.4"] },
    { "id": 11, "tasks": ["5.5", "5.6"] },
    { "id": 12, "tasks": ["6.1"] },
    { "id": 13, "tasks": ["6.2", "6.3", "6.4"] },
    { "id": 14, "tasks": ["8.1", "8.2"] },
    { "id": 15, "tasks": ["8.3", "8.4"] },
    { "id": 16, "tasks": ["9.1", "9.2", "9.4", "9.5", "9.6"] },
    { "id": 17, "tasks": ["9.3"] },
    { "id": 18, "tasks": ["11.1"] },
    { "id": 19, "tasks": ["11.2", "11.3"] },
    { "id": 20, "tasks": ["12.1", "12.2"] }
  ]
}
```
