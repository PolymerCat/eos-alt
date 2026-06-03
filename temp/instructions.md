# PROJECT CONTEXT
I want to create a comprehensive Web App that pulls data from multiple government agencies and show them into one, while also providing personalization for users.

The web app is used to look for information and also taking insightful actions during emergencies especially flood. It can also be converted into a PWA.

## There are 2 main pages:
- Home Page where all information are shown. The info are only updated info and also personalized info.

- Map Page where users can see the location of Shelters nearby that are open when disaster strikes.


## Map Page Structure:
- Base of the page is the Map itself. It covers the entire screen.
- Then, all other UI elements are rendered on top of the Map except the top navbar, which is a crucial UI that must stay on its own space. The map will only start below the Navbar.
- All UI Elements must be separated into components for easy modifications and better code readability.

## List of UI Elements:
- List of Shelters (Panel) on the left side of the screen. (This panel is like in Google Maps)
- Points for shelter locations, based on their coordinates.
- Small Popup when user clicks on the shelter point. Shows more details.