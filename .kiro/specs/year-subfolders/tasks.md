# Implementation Plan: Year Subfolders

## Overview

This plan implements year-based organization for the Pyxis course materials platform. The implementation proceeds from data layer (Prisma model + migration), through backend API routes, to frontend components and navigation updates. Each step builds incrementally so there is no orphaned code.

## Tasks

- [x] 1. Set up YearFolder data model and migration
  - [x] 1.1 Add YearFolder model to Prisma schema and update Category/Course relations
    - Add the `YearFolder` model to `server/prisma/schema.prisma` with fields: id, courseId, year, isComplete, createdAt
    - Add `@@unique([courseId, year])` and `@@index([courseId])` constraints
    - Update the `Course` model: replace `categories Category[]` with `yearFolders YearFolder[]`
    - Update the `Category` model: replace `courseId`/`course` with `yearFolderId`/`yearFolder`, update unique constraint to `@@unique([yearFolderId, name])`
    - _Requirements: 1.1, 1.2, 1.4, 3.1, 3.2_

  - [x] 1.2 Create Prisma migration with data migration script
    - Generate a migration that creates the `year_folders` table
    - Write SQL data migration: for each existing category, create a year folder (year 2024) for the parent course if one doesn't exist, then set the category's `year_folder_id`
    - Drop the `course_id` column from `categories` after data migration
    - Add new unique constraint `(year_folder_id, name)` and drop old `(course_id, name)`
    - _Requirements: 1.1, 3.1_

  - [x] 1.3 Regenerate Prisma client and verify schema compiles
    - Run `npx prisma generate` to update the Prisma client types
    - Verify no type errors in existing code that references Category or Course models
    - _Requirements: 1.1, 3.1_

- [x] 2. Implement YearFolder backend service and validation
  - [x] 2.1 Create year folder validator with Zod schema
    - Create `server/src/validators/yearFolder.validator.ts`
    - Define Zod schema: `year` as integer between 2000 and 2100 inclusive
    - Define schema for completion toggle: `isComplete` as boolean
    - Export validation functions for use in routes
    - _Requirements: 1.4, 2.4_

  - [x] 2.2 Write property test for year value validation
    - **Property 1: Year value validation**
    - **Validates: Requirements 1.4, 2.4**

  - [x] 2.3 Create year folder service with business logic
    - Create `server/src/services/yearFolder.service.ts`
    - Implement `createYearFolder(courseId, year)`: create year folder + 3 default categories in a transaction
    - Implement `listYearFolders(courseId)`: return year folders sorted descending by year, include file count aggregation
    - Implement `getYearFolder(yearId)`: return year folder with categories
    - Implement `deleteYearFolder(yearId)`: delete year folder (cascade handles children)
    - Implement `toggleCompletion(yearId, isComplete)`: update completion status
    - Handle unique constraint violations with appropriate error codes (YEAR_EXISTS)
    - _Requirements: 1.2, 1.3, 2.1, 2.2, 2.3, 3.3, 3.4, 6.1, 6.2, 7.2_

  - [x] 2.4 Write property test for course-year uniqueness
    - **Property 2: Course-year uniqueness**
    - **Validates: Requirements 1.2, 2.3**

  - [x] 2.5 Write property test for default completion status
    - **Property 3: Default completion status on creation**
    - **Validates: Requirements 1.3**

  - [x] 2.6 Write property test for default categories on creation
    - **Property 6: Default categories on year folder creation**
    - **Validates: Requirements 3.3**

- [x] 3. Implement YearFolder API routes
  - [x] 3.1 Create year folder routes file and register in server
    - Create `server/src/routes/yearFolder.routes.ts`
    - Implement `GET /api/courses/:courseId/years` — list year folders
    - Implement `POST /api/courses/:courseId/years` — create year folder (validate body)
    - Implement `GET /api/years/:yearId` — get single year folder with categories
    - Implement `DELETE /api/years/:yearId` — delete year folder
    - Implement `PATCH /api/years/:yearId/completion` — toggle completion
    - Register the router in `server/src/server.ts`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.1, 6.2, 6.4, 6.5_

  - [x] 3.2 Update category routes to use yearFolderId
    - Modify `server/src/routes/category.routes.ts` to support `GET /api/years/:yearId/categories` and `POST /api/years/:yearId/categories`
    - Update category creation to use `yearFolderId` instead of `courseId`
    - _Requirements: 3.1, 3.2_

  - [x] 3.3 Write property tests for year folder sort and cascade delete
    - **Property 4: Year folder descending sort**
    - **Property 5: Year folder-category name uniqueness**
    - **Property 7: Cascade delete removes all children**
    - **Validates: Requirements 2.2, 3.2, 3.4, 7.4**

- [x] 4. Checkpoint - Backend verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Update frontend types and API client
  - [x] 5.1 Update TypeScript types for YearFolder
    - Add `YearFolder` and `YearFolderWithCategories` interfaces to `client/src/types/index.ts`
    - Update `Category` interface: replace `courseId` with `yearFolderId`
    - _Requirements: 1.1, 3.1_

  - [x] 5.2 Create year folder API client module
    - Create `client/src/api/yearFolders.ts`
    - Implement `getYearFolders(courseId)`: GET list of year folders for a course
    - Implement `createYearFolder(courseId, year)`: POST new year folder
    - Implement `getYearFolder(yearId)`: GET single year folder with categories
    - Implement `deleteYearFolder(yearId)`: DELETE year folder
    - Implement `toggleYearCompletion(yearId, isComplete)`: PATCH completion status
    - _Requirements: 2.1, 2.2, 6.1, 6.2_

- [x] 6. Implement year folder frontend components
  - [x] 6.1 Create CompletionBadge component
    - Create `client/src/components/years/CompletionBadge.tsx`
    - Render a green checkmark SVG icon when `isComplete` is true, hidden otherwise
    - _Requirements: 6.3, 7.3_

  - [x] 6.2 Create YearFolderCard component
    - Create `client/src/components/years/YearFolderCard.tsx`
    - Display four-digit year, file count, and CompletionBadge
    - Make card clickable, navigating to `/courses/:courseId/years/:yearId`
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 6.3 Create YearFolderGrid component
    - Create `client/src/components/years/YearFolderGrid.tsx`
    - Render a grid layout of YearFolderCard components
    - Sort year folders in descending order by year value
    - _Requirements: 7.4_

  - [x] 6.4 Write property test for year folder descending sort (frontend)
    - **Property 4: Year folder descending sort**
    - **Validates: Requirements 2.2, 7.4**

  - [x] 6.5 Create AddYearModal component
    - Create `client/src/components/years/AddYearModal.tsx`
    - Input for four-digit year with client-side validation (2000–2100)
    - Handle submit, display inline error for out-of-range, toast on 409 conflict
    - _Requirements: 1.4, 2.1, 2.3, 2.4_

- [x] 7. Implement file search bar
  - [x] 7.1 Create FileSearchBar component
    - Create `client/src/components/files/FileSearchBar.tsx`
    - Render text input with search icon, controlled component
    - Display match count: "Showing X of Y files"
    - Call `onSearchChange` on every keystroke
    - _Requirements: 5.1, 5.4_

  - [x] 7.2 Write property test for file search filter correctness
    - **Property 10: File search filter correctness**
    - **Validates: Requirements 5.2, 5.3**

- [ ] 8. Update pages and routing
  - [x] 8.1 Create YearPage
    - Create `client/src/pages/YearPage.tsx`
    - Fetch year folder by ID, display categories sorted alphabetically
    - Reuse existing `CategoryList` component
    - Include completion toggle button
    - _Requirements: 4.2, 4.3, 6.1, 6.2, 6.4_

  - [x] 8.2 Write property test for category alphabetical sort
    - **Property 8: Category alphabetical sort within year**
    - **Validates: Requirements 4.3**

  - [x] 8.3 Update CoursePage to show YearFolderGrid
    - Modify `client/src/pages/CoursePage.tsx`
    - Replace CategoryList usage with YearFolderGrid
    - Fetch year folders instead of categories
    - Include AddYearModal trigger button
    - _Requirements: 4.1_

  - [x] 8.4 Update CategoryPage with FileSearchBar and new route params
    - Modify `client/src/pages/CategoryPage.tsx`
    - Add FileSearchBar above file list
    - Implement client-side filtering: case-insensitive substring match on filename
    - Show empty state when no files match search term
    - Update route params to include `yearId`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 8.5 Update App.tsx routes
    - Add route `/courses/:courseId/years/:yearId` for YearPage
    - Update category route to `/courses/:courseId/years/:yearId/categories/:categoryId`
    - _Requirements: 4.5_

  - [-] 8.6 Update Breadcrumbs to include year segment
    - Modify `client/src/components/layout/Breadcrumbs.tsx` and `breadcrumbs.utils.ts`
    - Add year segment between course and category in breadcrumb path
    - _Requirements: 4.4_

  - [~] 8.7 Write property test for breadcrumb generation
    - **Property 9: Breadcrumb generation includes year segment**
    - **Validates: Requirements 4.4**

- [ ] 9. Implement completion toggle and file count
  - [-] 9.1 Wire completion toggle in YearPage and YearFolderCard
    - Add toggle button in YearPage that calls `toggleYearCompletion` API
    - Optimistic UI update with rollback on failure
    - Show toast notification on error
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [~] 9.2 Write property test for completion toggle round-trip
    - **Property 11: Completion toggle round-trip**
    - **Validates: Requirements 6.1, 6.2**

  - [~] 9.3 Write property test for file count aggregation
    - **Property 12: File count aggregation**
    - **Validates: Requirements 7.2**

- [~] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The migration (task 1.2) should be tested manually against a dev database before proceeding with API work
- File upload flow (Requirement 8) requires no code changes — it works through the existing Category→File relation which remains intact under the new YearFolder→Category→File chain

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["2.1", "5.1"] },
    { "id": 4, "tasks": ["2.2", "2.3"] },
    { "id": 5, "tasks": ["2.4", "2.5", "2.6", "5.2"] },
    { "id": 6, "tasks": ["3.1", "3.2"] },
    { "id": 7, "tasks": ["3.3", "6.1", "7.1"] },
    { "id": 8, "tasks": ["6.2", "6.5", "7.2"] },
    { "id": 9, "tasks": ["6.3", "6.4"] },
    { "id": 10, "tasks": ["8.1", "8.3"] },
    { "id": 11, "tasks": ["8.2", "8.4", "8.5"] },
    { "id": 12, "tasks": ["8.6", "9.1"] },
    { "id": 13, "tasks": ["8.7", "9.2", "9.3"] }
  ]
}
```
