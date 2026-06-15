# Requirements Document

## Introduction

Pyxis is a course materials sharing website for the Chocolate City organization at MIT. It digitalizes the existing Google Drive-based system where members who have taken classes upload course materials (lecture notes, problem sets, exams) for other members to access. The website follows the Chocolate City black and gold color scheme, is restricted to organization members via MIT Touchstone authentication, and provides organized file browsing, uploading, and member contribution statistics.

## Glossary

- **Pyxis_Platform**: The web application for browsing, uploading, and managing course materials
- **Member**: A verified Chocolate City organization member who has been granted access to the platform
- **Academic_Chair**: The Chocolate City member responsible for managing the platform and membership access list
- **Touchstone_Auth**: MIT's centralized authentication system (Shibboleth/SAML-based) used for single sign-on
- **Access_List**: The list of approved MIT Kerberos identifiers (email addresses) that are permitted to use the platform
- **Course_Folder**: A top-level directory representing a specific MIT course (e.g., 6.042, 18.06)
- **Material_Category**: A subfolder within a Course_Folder that groups files by type (Exams, Problem_Sets, Lectures, or other custom categories)
- **Course_File**: An individual uploaded document within a Material_Category
- **Uploader_Info**: Metadata associated with a Course_File including the uploader's name and upload date
- **Member_Stats**: Aggregated statistics about a member's contributions to the platform

## Requirements

### Requirement 1: MIT Touchstone Authentication

**User Story:** As a Chocolate City member, I want to log in using my MIT credentials, so that I can securely access the platform without creating a separate account.

#### Acceptance Criteria

1. WHEN a user navigates to the Pyxis_Platform, THE Pyxis_Platform SHALL redirect unauthenticated users to the MIT Touchstone_Auth login page within 3 seconds
2. WHEN a user successfully authenticates via Touchstone_Auth, THE Pyxis_Platform SHALL verify that the user's MIT Kerberos identifier exists in the Access_List within 5 seconds of receiving the authentication response
3. IF a user authenticates via Touchstone_Auth but their Kerberos identifier is not in the Access_List, THEN THE Pyxis_Platform SHALL display an access denied message indicating that only Chocolate City members may use the platform
4. WHEN the Pyxis_Platform confirms a user's Kerberos identifier exists in the Access_List, THE Pyxis_Platform SHALL create a session with a maximum duration of 8 hours and redirect the user to the home page
5. IF the Touchstone_Auth service is unreachable or returns an error during authentication, THEN THE Pyxis_Platform SHALL display an error message indicating that authentication is temporarily unavailable and provide the option to retry
6. WHEN a user's session expires after 8 hours, THE Pyxis_Platform SHALL redirect the user to the Touchstone_Auth login page upon their next interaction with the platform

### Requirement 2: Access List Management

**User Story:** As the Academic_Chair, I want to manage which members can access the platform, so that only current Chocolate City members have access.

#### Acceptance Criteria

1. WHILE a user is authenticated as an Academic_Chair, THE Pyxis_Platform SHALL display an admin panel for managing the Access_List
2. WHEN the Academic_Chair adds a Kerberos identifier to the Access_List, THE Pyxis_Platform SHALL grant that user access on their next authentication attempt
3. WHEN the Academic_Chair removes a Kerberos identifier from the Access_List, THE Pyxis_Platform SHALL revoke that user's access and invalidate any active sessions for that user within 30 seconds
4. WHEN the Academic_Chair submits a bulk addition via comma-separated or newline-separated input, THE Pyxis_Platform SHALL add each valid Kerberos identifier to the Access_List, up to a maximum of 50 identifiers per bulk operation
5. IF the Academic_Chair submits a Kerberos identifier that does not match a valid format, THEN THE Pyxis_Platform SHALL reject the entry, leave the Access_List unchanged, and display an error message indicating which identifiers are invalid
6. IF the Academic_Chair adds a Kerberos identifier that already exists in the Access_List, THEN THE Pyxis_Platform SHALL ignore the duplicate and display a notification indicating the identifier is already present

### Requirement 3: Member Profile

**User Story:** As a Chocolate City member, I want my profile to be automatically populated from my MIT credentials, so that I don't need to manually enter my information.

#### Acceptance Criteria

1. WHEN a Member logs in for the first time, THE Pyxis_Platform SHALL create a profile using the name and email retrieved from the Touchstone_Auth attributes and record the current date as the join date
2. IF the Touchstone_Auth attributes are missing the name or email during first login, THEN THE Pyxis_Platform SHALL display an error message indicating that profile creation failed due to incomplete credential data and prevent profile creation
3. WHILE a Member is logged in, THE Pyxis_Platform SHALL display the Member's name, truncated to 30 characters, in the navigation header
4. WHEN a Member navigates to their profile page, THE Pyxis_Platform SHALL display their name, MIT email, join date, and contribution statistics including total number of contributions and date of most recent contribution

### Requirement 4: Course Folder Browsing

**User Story:** As a Member, I want to browse course folders on the home page, so that I can find materials for the classes I need.

#### Acceptance Criteria

1. WHEN a Member navigates to the home page, THE Pyxis_Platform SHALL display all Course_Folders as a grid of clickable cards sorted alphabetically by course number
2. THE Pyxis_Platform SHALL display the course number and course name on each Course_Folder card
3. WHEN a Member clicks on a Course_Folder card, THE Pyxis_Platform SHALL navigate to that course's page showing all Material_Category subfolders
4. THE Pyxis_Platform SHALL provide a search bar that filters Course_Folders by course number or course name using case-insensitive substring matching as the Member types
5. IF no Course_Folders exist on the platform, THEN THE Pyxis_Platform SHALL display an empty-state message indicating that no courses have been added yet and prompting the Member to create one
6. IF the search bar input does not match any Course_Folder by course number or course name, THEN THE Pyxis_Platform SHALL display a no-results message indicating that no courses match the search term

### Requirement 5: Material Category Navigation

**User Story:** As a Member, I want to browse material categories within a course, so that I can find the specific type of material I need.

#### Acceptance Criteria

1. WHEN a Member navigates to a Course_Folder page, THE Pyxis_Platform SHALL display Material_Category subfolders (Exams, Problem_Sets, Lectures, and any additional custom categories) in alphabetical order
2. WHEN a Member clicks on a Material_Category subfolder, THE Pyxis_Platform SHALL display a list of Course_Files within that category, showing a maximum of 50 files per page with pagination controls when the total exceeds 50
3. THE Pyxis_Platform SHALL display each Course_File with its filename (truncated to 80 characters with an ellipsis if longer), Uploader_Info (uploader name), and upload date formatted as YYYY-MM-DD
4. THE Pyxis_Platform SHALL sort Course_Files within a Material_Category by upload date in descending order (newest first), using filename in ascending alphabetical order as a secondary sort when upload dates are identical
5. IF a Material_Category subfolder contains zero Course_Files, THEN THE Pyxis_Platform SHALL display an empty-state message indicating that no materials have been uploaded to this category

### Requirement 6: File Viewing and Download

**User Story:** As a Member, I want to view and download course files, so that I can study the material.

#### Acceptance Criteria

1. WHEN a Member clicks on a Course_File, THE Pyxis_Platform SHALL open a file viewer that renders the document inline supporting the following formats: PDF, PNG, JPG, JPEG, GIF, and SVG
2. WHEN a Member clicks the download button for a Course_File, THE Pyxis_Platform SHALL initiate a download of that file to the Member's device with the original filename preserved
3. WHEN a Member clicks the download button for a Material_Category folder, THE Pyxis_Platform SHALL package all Course_Files in that category into a ZIP archive named "{CourseNumber}_{CategoryName}.zip" and initiate the download
4. WHEN a Member clicks the download button for a Course_Folder, THE Pyxis_Platform SHALL package all Course_Files across all Material_Categories for that course into a ZIP archive named "{CourseNumber}_all.zip" with files organized into subdirectories by Material_Category name and initiate the download
5. IF a file format is not supported for inline viewing, THEN THE Pyxis_Platform SHALL display a message indicating the file cannot be previewed and offer a download option
6. IF a ZIP archive download fails due to a server or network error, THEN THE Pyxis_Platform SHALL display an error message indicating the download failed and provide the option to retry

### Requirement 7: File Upload

**User Story:** As a Member who has taken a class, I want to upload course materials, so that other members can benefit from my notes and resources.

#### Acceptance Criteria

1. WHEN a Member navigates to a Material_Category page, THE Pyxis_Platform SHALL display an upload button
2. WHEN a Member clicks the upload button, THE Pyxis_Platform SHALL present a file picker that accepts one or more files, up to a maximum of 10 files per upload operation
3. WHEN a Member submits files for upload, THE Pyxis_Platform SHALL store the files and associate them with the current Material_Category, the uploading Member's name, and the current timestamp
4. IF a Member attempts to upload a file exceeding 50 MB, THEN THE Pyxis_Platform SHALL reject the upload for that file and display an error message indicating the 50 MB file size limit
5. IF a file upload fails due to a network or server error, THEN THE Pyxis_Platform SHALL display an error message identifying which files failed and allow the Member to retry the failed uploads without re-uploading successful files
6. WHILE files are being uploaded, THE Pyxis_Platform SHALL display a progress indicator showing the upload status for each file

### Requirement 8: Course Folder Creation

**User Story:** As a Member, I want to create new course folders and material categories, so that I can upload materials for courses not yet on the platform.

#### Acceptance Criteria

1. WHEN a Member clicks the "Add Course" button on the home page, THE Pyxis_Platform SHALL display a form requesting the course number and course name
2. WHEN a Member submits a course number that is non-empty, contains at most 20 characters, and a course name that is non-empty and contains at most 100 characters, THE Pyxis_Platform SHALL create a new Course_Folder with default Material_Category subfolders (Exams, Problem_Sets, Lectures) and navigate the Member to the newly created Course_Folder page
3. IF a Member submits the course creation form with an empty course number, an empty course name, a course number exceeding 20 characters, or a course name exceeding 100 characters, THEN THE Pyxis_Platform SHALL display an error message indicating which field is invalid and retain the entered form data
4. IF a Member attempts to create a Course_Folder with a course number that already exists, THEN THE Pyxis_Platform SHALL display an error message indicating the course already exists and retain the entered form data
5. WHEN a Member is viewing a Course_Folder, THE Pyxis_Platform SHALL display an "Add Category" button that allows the Member to create a custom Material_Category subfolder by entering a category name that is non-empty and at most 50 characters
6. IF a Member attempts to create a custom Material_Category with a name that matches an existing Material_Category within the same Course_Folder, THEN THE Pyxis_Platform SHALL display an error message indicating the category already exists

### Requirement 9: Member Statistics Page

**User Story:** As a Member, I want to see contribution statistics for each member, so that I can recognize contributors and be motivated to share my own materials.

#### Acceptance Criteria

1. WHEN a Member navigates to the Member_Stats page, THE Pyxis_Platform SHALL display a list of all members who have uploaded at least one file
2. THE Pyxis_Platform SHALL display for each contributing member: their name, total number of files uploaded, and the number of distinct courses they contributed to
3. THE Pyxis_Platform SHALL sort the member list by total files uploaded in descending order by default, using member name in ascending alphabetical order as a secondary sort when totals are identical
4. WHEN a Member clicks on a contributing member's name, THE Pyxis_Platform SHALL display a detailed view showing all files that member uploaded, organized by course, with each file displaying filename, Material_Category, and upload date formatted as YYYY-MM-DD

### Requirement 10: Visual Theme

**User Story:** As a Chocolate City member, I want the website to match the Chocolate City brand, so that the platform feels like part of our organization's identity.

#### Acceptance Criteria

1. THE Pyxis_Platform SHALL use a black and gold color scheme consistent with the Chocolate City brand (matching https://ccity.mit.edu/) as the primary colors for backgrounds, text, and accent elements
2. THE Pyxis_Platform SHALL display the Chocolate City logo in the navigation header, sized to fit within the header height while maintaining its original aspect ratio
3. THE Pyxis_Platform SHALL use a responsive layout that renders without horizontal scrolling, without overlapping elements, and with all interactive elements accessible at viewport widths from 320px to 1920px
4. THE Pyxis_Platform SHALL use consistent typography and spacing throughout all pages, applying the same font family, font sizes, and spacing values for equivalent content levels (headings, body text, labels) across all views
5. THE Pyxis_Platform SHALL maintain a minimum contrast ratio of 4.5:1 between text and background colors across all pages to ensure readability

### Requirement 11: Navigation Structure

**User Story:** As a Member, I want a clear navigation structure, so that I can easily move between different sections of the platform.

#### Acceptance Criteria

1. THE Pyxis_Platform SHALL display a persistent navigation bar with links to: Home (Course_Folders), Member_Stats, Profile, and Admin (visible only to Academic_Chair users)
2. WHEN a Member is inside a Course_Folder or Material_Category, THE Pyxis_Platform SHALL display breadcrumb navigation showing the path (Home > Course > Category) where each breadcrumb segment is a clickable link that navigates to that level
3. THE Pyxis_Platform SHALL highlight the currently active navigation item in the navigation bar using the gold accent color
4. THE Pyxis_Platform SHALL render the navigation bar in a fixed position at the top of the viewport so it remains visible while scrolling
