CAMPUS LIFE PLANNER 

Project overview

    Campus-Life-Planner is a responsive application for students to help them manage their campus activities, such as studies, School Events, and personal activities. It is built with vanilla HTML, CSS, and JavaScript and upholds best accessibility practices.

Features List:

    Responsive Design:      It works seamlessly on both mobile, tablet and desktop(360px, 768px, 1024px breakpoints)
    Activities Management:  It allows for adding, editing, deleting and sorting of campus activities.
    Live Regex Search:      Has enabled live search using regex patterns.
    Dark Mode toggle:       Session-based dark/light mode for accessibility
    ARIA Live regions:      Ensure accessibility compliance and provide accessibility to people with disabilities.
    Data Import/Export feature: Has enabled and functional JSON import and export functionality
    Autosave/Data persistence: Activities that add or update are saved to local storage via auto-save.
    Category Distribution:  Has visuals such as a pie chart showing activity categories(Study, Event, Personal).
    Character count feature on event description form: Description field has a 75-character limit.
    Keyboard Navigation:    Has fully enabled keyboard support.

Regex catalogue:

Pattern                                                  Description                                       Example
\b\d{2}:\d{2}\b			Time tokens in event descriptions		14:00
\b(\w+)\s+\1\b			Deleting duplicate words			eg., “the the”
/\b[0-9]+\b/			Validating numeric entries		“120” for duration
\b[0-9]{2}:\d{2}\b		Advanced time validation		“18:30” in descriptions
\b[0-9]{4}-[0-9]{2}-[0-9]{2}\b		date validation	        “2026-02-20” for due date
/\b[0-9]+\.[0-9]+\b/		for amount validation in descriptions	eg., “20.25”



Keyboard navigation:

    Tab: 			Navigate between focusable elements
    Enter:			Activate buttons and submit forms
    Escape:		Close forms and return to records
    Arrow keys: 		Navigate within the table of records
    Sort buttons: 		Click to sort activities by title, date, duration or tags

 How to run the application/web

    Clone the repo
    Open index.html in your browser
    Do tests on the following features and functionalities:
        Add a new activity with valid/invalid inputs
        Edit and delete activities
        Sort activities by different fields (title, date, duration, tag)
        Perform regex searches with various patterns
        Toggle dark mode
        Import and export data
        Verify keyboard navigation works
        Check accessibility with a screen reader
        Test mobile responsiveness

Demo Video
    Watch the demo video to see features such as live regex search and record import and export:
        https://www.loom.com/share/b9203319173f44f082dc58ad03f6128e


