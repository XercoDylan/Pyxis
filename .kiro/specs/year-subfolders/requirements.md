# Requirements Document

## Introduction

This feature introduces year-based organization to the Pyxis course materials platform. Currently, when a user navigates to a course, they see categories (Exams, Problem_Sets, Lectures) with files directly inside. This change adds a year layer between courses and categories, so the navigation becomes: Home → Course → Year → Category → Files. Additionally, it adds a file search capability within categories and a mechanism for users to mark a year as complete.

## Glossary

- **Platform**: The Pyxis course materials web application (frontend and backend together)
- **Year_Folder**: A navigational grouping within a course representing an academic year (e.g., 2024, 2025)
- **Year_Page**: The frontend view displayed when a user clicks on a Year_Folder, showing categories for that year
- **File_Search_Bar**: A text input component on the Category page that filters the displayed file list by filename
- **Completion_Indicator**: A visual badge or checkmark displayed on a Year_Folder to signal that its materials are complete
- **Category_Page**: The frontend view that displays files within a specific category for a specific year
- **Course_Page**: The frontend view that displays the list of Year_Folders for a given course
- **Member**: An authenticated user of the Platform

## Requirements

### Requirement 1: Year Folder Data Model

**User Story:** As a platform maintainer, I want year folders to be stored as a database entity, so that courses can organize materials by academic year.

#### Acceptance Criteria

1. THE Platform SHALL store Year_Folder records with a unique identifier, a reference to the parent course, a four-digit year value, and a completion status flag
2. THE Platform SHALL enforce a unique constraint on the combination of course identifier and year value
3. WHEN a Year_Folder is created, THE Platform SHALL default the completion status to false
4. THE Platform SHALL enforce that the year value is an integer between 2000 and 2100 inclusive

### Requirement 2: Year Folder CRUD API

**User Story:** As a member, I want to create and list year folders within a course, so that I can organize materials by year.

#### Acceptance Criteria

1. WHEN a member sends a request to create a Year_Folder with a valid course identifier and year value, THE Platform SHALL create the Year_Folder and return its details including the generated identifier
2. WHEN a member requests the list of Year_Folders for a course, THE Platform SHALL return all Year_Folders for that course sorted by year value in descending order
3. IF a member attempts to create a Year_Folder with a year value that already exists for that course, THEN THE Platform SHALL return a 409 conflict error with the code "YEAR_EXISTS"
4. IF a member attempts to create a Year_Folder with a year value outside the range 2000 to 2100, THEN THE Platform SHALL return a 422 validation error

### Requirement 3: Category-to-Year Association

**User Story:** As a platform maintainer, I want categories to be associated with a specific year folder, so that files are organized within the correct year context.

#### Acceptance Criteria

1. THE Platform SHALL associate each Category with a Year_Folder instead of directly with a Course
2. THE Platform SHALL enforce a unique constraint on the combination of Year_Folder identifier and category name
3. WHEN a Year_Folder is created, THE Platform SHALL automatically create the three default categories: "Exams", "Problem_Sets", and "Lectures" within that Year_Folder
4. WHEN a Year_Folder is deleted, THE Platform SHALL cascade-delete all associated categories and their files

### Requirement 4: Updated Navigation Flow

**User Story:** As a member, I want to navigate through year folders when browsing a course, so that I can find materials from a specific academic year.

#### Acceptance Criteria

1. WHEN a member navigates to a Course_Page, THE Platform SHALL display a list of Year_Folders for that course instead of categories
2. WHEN a member clicks on a Year_Folder, THE Platform SHALL navigate to the Year_Page showing categories for that specific year
3. WHEN a member navigates to the Year_Page, THE Platform SHALL display the categories for the selected year sorted alphabetically by name
4. THE Platform SHALL update the breadcrumb navigation to reflect the path: Home → Course → Year → Category
5. THE Platform SHALL define the route for the Year_Page as "/courses/:courseId/years/:yearId"

### Requirement 5: File Search Within Category

**User Story:** As a member, I want to search for files within a category by filename, so that I can quickly find specific materials without scrolling through the entire file list.

#### Acceptance Criteria

1. WHEN a member navigates to the Category_Page, THE Platform SHALL display a File_Search_Bar above the file list
2. WHEN a member types text into the File_Search_Bar, THE Platform SHALL filter the displayed file list to show only files whose filename contains the search text as a case-insensitive substring
3. WHEN the File_Search_Bar is empty, THE Platform SHALL display all files in the category without filtering
4. THE Platform SHALL perform the file search filtering on the client side using the already-loaded file list for the current page
5. WHEN the search filter results in zero matching files, THE Platform SHALL display an empty state message indicating no files match the search term

### Requirement 6: Mark Year as Complete

**User Story:** As a member, I want to mark a year folder as complete, so that other members know all necessary materials have been uploaded for that year.

#### Acceptance Criteria

1. WHEN a member sends a request to mark a Year_Folder as complete, THE Platform SHALL set the completion status to true and return the updated Year_Folder
2. WHEN a member sends a request to unmark a Year_Folder as complete, THE Platform SHALL set the completion status to false and return the updated Year_Folder
3. WHILE a Year_Folder has a completion status of true, THE Platform SHALL display a Completion_Indicator on that Year_Folder in the Course_Page listing
4. THE Platform SHALL allow any authenticated member to mark or unmark a Year_Folder as complete
5. THE Platform SHALL expose a single toggle endpoint that accepts a boolean value for the completion status

### Requirement 7: Year Folder Display

**User Story:** As a member, I want year folders to be visually distinct and informative, so that I can easily identify and select the year I need.

#### Acceptance Criteria

1. THE Platform SHALL display each Year_Folder as a clickable card showing the four-digit year value
2. THE Platform SHALL display the count of files across all categories within each Year_Folder on the Year_Folder card
3. WHILE a Year_Folder has a completion status of true, THE Platform SHALL display a green checkmark icon on the Year_Folder card
4. THE Platform SHALL sort Year_Folder cards in descending order by year value so the most recent year appears first

### Requirement 8: Backward-Compatible File Upload

**User Story:** As a member, I want file uploads to work within the new year-based structure, so that I can continue uploading materials to the correct year and category.

#### Acceptance Criteria

1. WHEN a member uploads a file, THE Platform SHALL associate the file with a category that belongs to a specific Year_Folder
2. THE Platform SHALL retain the existing file upload flow (presigned URL, confirm) without modification to the upload mechanism itself
3. THE Platform SHALL retain the existing 50 MB file size limit and 10-file batch limit within the year-based category structure
