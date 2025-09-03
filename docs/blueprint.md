### Developer + Codex Note 

This file (`docs/blueprint.md`) defines the authoritative platform vision and functional requirements for Solarpunk Taskforce.  



Codex: Always read this file fully before making schema, API, or UI changes to ensure alignment with the intended platform scope.  

Developers: Treat this as the single source of truth for feature priorities and how they connect together.  

Supabase schema: Always use the latest migrations in `supabase/migrations/` and the generated types in `src/lib/database.types.ts` as the source of truth for database state.  

Codex: remind user after making schema changes to run the `supabase-db-diff` GitHub Action to sync migrations and regenerate types.  



### Data Model (High-Level)



##### Users

&nbsp; - Profiles with name, organisation (or independent/watchdog), portfolio, subscriptions.

&nbsp; - Can subscribe to projects or organisations.

&nbsp; - Can create watchdog issues.



##### Projects

&nbsp; - Core unit on the map.

&nbsp; - Fields: name, description, links, lead org, partner orgs, location, intervention type, target demographic, timeline, thematic area, donations, impact metrics, posts, multimedia.

&nbsp; - Status: planned, active, completed.

&nbsp; - Can have multiple metrics and posts.



##### Organisations

&nbsp; - Profiles with description, location, links, impact metrics (aggregate from projects).

&nbsp; - Fields: projects carried out, ongoing projects, lives improved, partnerships, gallery.

&nbsp; - Can post content and updates.



##### Posts

&nbsp; - Tied to either a project or an organisation.

&nbsp; - Media (images, video, audio, docs), captions, metadata.



##### Watchdog Issues

&nbsp; - Community-led cases tied to locations.

&nbsp; - Can attract attention, raise funds, or connect to orgs.



##### Subscriptions

&nbsp; - Users subscribe to projects, organisations, or issues.

&nbsp; - Used for notifications and custom feed.



##### Feed

&nbsp; - Aggregated posts from projects, organisations, watchdog issues.

&nbsp; - Filtered by subscriptions, popularity, or type.



##### Metrics

&nbsp; - Self-defined by project owners.

&nbsp; - Units (trees planted, people trained, etc.).

&nbsp; - Updateable over time, shown on profiles and map.





# Solarpunk Taskforce and the Platform Blueprint



### What is Solarpunk Taskforce (ST)?



ST is a unifying force within the global humanitarian and environmental movement, connecting people, projects, and organisations to improve the coordination and effectiveness of global impact. By bridging the gap between action and awareness through transparent communication and creative media, we empower a global community to engage meaningfully in impact. With a bold, modern brand, we are reshaping how impact is seen, shared, and supported.



### The Addressed Problems



1. #### Redundant and fragmented efforts

Because there is no clear, standardised platform encompassing global humanitarian and environmental efforts, organisations and changemakers struggle to identify where the greatest needs lie. This results in redundant and fragmented initiatives, with multiple actors overlapping on the same issues and wasting resources. The ST platform aims to enhance both the efficiency and effectiveness of global efforts by providing a clear overview of ongoing impact projects and indicating where resources should be allocated.



#### 2\. Disconnected stakeholders

Unlike most traditional sectors, collaboration and cooperation are at the core of the impact sector. Humanitarian and environmental organisations work together towards the same overarching goal. Yet countless organisations pursue this goal in isolation. Without a clear understanding of the players in the field, impact-driven organisations miss out on crucial synergies and opportunities. Smaller impact organisations often collapse due to their inability to find supporting entities. The ST platform seeks to enable synergies in the impact sector by providing a clear overview of the organisations involved and their respective efforts.



#### 3\. Declining public trust and minimal transparency

Although NPOs and NGOs adhere to stricter regulations, transparency towards the public remains limited. This results in diminished public trust, particularly with charities. The ST platform seeks to connect people directly with projects and facilitate transparent coverage of initiatives, aiming both to engage the public and to increase trust through clear communication and thorough documentation.



#### 4\. Lack of a central and accessible platform

Currently, most digital infrastructure depicting humanitarian and environmental efforts is outdated, limited, or used internally, making it inaccessible to the general public. As a result, the public cannot grasp the scale of the impact sector. This lack of accessibility leads to reduced awareness and engagement in global impact. The ST platform seeks to serve as the much-needed central point of information on global humanitarian and environmental efforts, making them accessible to all, thereby educating the public and fostering greater engagement.



#### 5\. Lack of a platform for community-led voices

Currently, humanitarian and environmental action is largely determined by the biggest players in the field. While these actors focus on the most pressing issues, countless smaller challenges continue to affect communities worldwide. These niche issues, even when they have advocates, often lack a platform to be heard. The ST platform enables individuals to highlight their local issues and connects advocates with larger players who have the resources to address them. When large institutions, disconnected from local contexts, make implementation decisions, the results often backfire. By amplifying individual voices, the ST platform empowers local advocates to drive change best suited to their needs.



#### 6\. Lack of creativity and perspectives

The humanitarian and environmental sectors are predominantly portrayed through crises and disasters, relying on emotional responses to tragedy to rally engagement. Yet these sectors also hold far greater appeal in other forms. Through culture, art, and beauty, there is much to share about humanity. Creative content on the impact sector, with proper storytelling and relatable voices, is significantly lacking. The ST platform seeks to become a centre for content that inspires, educates, and creatively conveys what humanity is and how anyone can participate in its development. Furthermore, ST aspires to be the leading brand and voice of the impact sector, a movement ushering in a new era of meaningful engagement.



## The Vision

A world in which:

1. Impact-driven organisations have a complete, real-time overview of global humanitarian and environmental efforts, enabling synergy, effective cooperation, and the application of proven solutions across contexts.

2\. Individuals can transparently see where their support goes, engage meaningfully with global efforts, and bring attention to overlooked issues through an accessible and empowering platform.

3\. Awareness of underrepresented global issues is elevated through creative, factual, and meaningful content that restores trust in humanitarian work and deepens the understanding of the state of humanity.



## The Mission

The ST mission is twofold, tailored to impact-driven organisations and individuals respectively:

&nbsp;	• For impact-driven organisations, the ST mission is to develop a transparent global platform and living database that tracks humanitarian and environmental efforts - enabling efficient cooperation, reducing redundant resource allocation, and improving communication and implementation across initiatives.

&nbsp;	• For individuals, the ST mission is to bridge the gap between action and awareness by generating creative, neutral, and transparent content on global issues - empowering people to understand, trust, and meaningfully engage with humanitarian and environmental efforts.



## The Solution – the ST Platform

ST addresses the issue listed above through a digital platform. This platform provides the following:



1. ##### An overview of global humanitarian and environmental projects through an interactive globe with filterable parameters.

**Outcome:** 

&nbsp;	• Users have improved visibility of and access to potential partners and collaborators.

&nbsp;	• Organisations can better identify where their resources are most needed.

&nbsp;	• A knowledge base of projects, problems, and solutions offering organisations real-life examples to guide their decisions.

&nbsp;	• Funders have a central platform to find the right project to invest in. 

&nbsp;	• Projects and smaller organisations benefit from improved visibility and exposure.

&nbsp;	• The public has a better understanding of the impact world and can engage meaningfully.



##### 2\. A communication platform with UGC, to share updates on projects, impact-related news, and any relevant multimedia.

**Outcome:**

&nbsp;	• Fostering a community of changemakers with a dedicated hub for information exchange.

&nbsp;	• Decentralised information network enabling voices and perspectives from all changemakers.

&nbsp;	• Increased transparency and visibility of the impact world, accessible by all.



##### 3\. A stage for the “Watchdog Network”, in which advocates can bring attention to and fundraise for the humanitarian and environmental issues in their area.

**Outcome:**

&nbsp;	• Providing a voice to overlooked communities with niche issues.

&nbsp;	• Empowering advocates to raise funds and initiate change.

&nbsp;	• Connect advocates to organisations with the right resources.



## The Platform Blueprint

The platform has eight main pages:



##### Home Page | Interactive Map

The first page upon opening the site, will feature the interactive globe which can be moved around and zoomed in on. On both sides of the page are key figures displaying the statistics of the platform and the impact of its users. This includes:

&nbsp;	• Number of projects registered

&nbsp;	• Number of changemakers (users involved in a project or watchdog case)

&nbsp;	• Number of organisations involved, the total amount of money raised

&nbsp;	• Estimated number of lives improved (individuals benefiting from the registered projects)

&nbsp;	• Number of issues raised and implemented (from the Watchdog Network)

This page has three views available: All Projects | Subscribed Projects | Featured Projects

The first view indicates all registered and ongoing projects around the world in circular points, that are animated to expand slightly when hovered over with the cursor. The indicators for humanitarian and environmental projects are coloured separately, with a small legend defining each colour on the bottom right. 

The second view is available only to users who have subscribed to projects or organisations. Here they will only see indicators for projects that they have subscribed to, or all the projects of organisations that they have subscribed to. If any subscribed project has updates, the indicator for that project will appear gold and pulsate.

The third view depicts only selected projects featured by ST. 

The globe, if not interacted with after 10 seconds, rotates slowly in all views. In the Featured Projects view, as each project appears into view, a project popup appears with the project name, description and featured media. In the All Projects and Subscribed Projects view, when the globe starts rotating after inactivity, the key figure listed above appear. As soon as the globe is interacted with, it stops rotating any popups and the key figures disappear. To avoid cramming the globe with overlapping indicators, when zooming out, indicators close to each other merge to form a larger indicator. When zooming in, these separate again. When pressing on an indicator, the project popup appears with the project’s name, description, and featured media as well as a button to see more. Pressing on the “See more” button, takes a visitor to the Find Projects page and opens that project there.



##### Page 1 | About

The about page, leftmost on the navigation header of the site, explains what Solarpunk Taskforce is about, including the information stated above. This page should also mention, explain, and link to the rest of the pages.



##### Page 2 | Find Projects

This page has two views, the first resembling the home page with an interactive globe depicting all projects and the second with a table of all projects. 

For the first view, when pressing on “Find Projects” from the home page, the globe moves to the right, to make room for a filter panel on the left side. This panel shows all parameters with which one can filter out the displayed projects. This panel includes:

&nbsp;	• An AI powered search bar to search for projects by name or matching criteria

&nbsp;	• A tag list of the UN SDGs and IFRC’s Five Global Challenges, allowing visitors to thematically filter and view relevant projects (multiple select possible)

&nbsp;	• A dropdown list of targeted demographics (multiple select possible)

&nbsp;	• A dropdown list of the type of intervention

&nbsp;	• A location search bar, where visitors can find projects operating in defined countries and regions (multiple select possible)

&nbsp;	• An organisation search bar, where visitors can select organisations to see all their ongoing projects (multiple select possible)

&nbsp;	• A donations range input, where visitors can filter for projects within a certain range of donations

The second view, provides a table with all projects in rows and columns for the parameters. Unlike with the globe view, the table allows for sorting by:

&nbsp;	• Start date or end date (newest to oldest and vice versa)

&nbsp;	• Amount of donations received (least to greatest and vice versa)

&nbsp;	• Alphabetically

&nbsp;	• Project status (completed, active, planned)

&nbsp;	• Funding amount needed

This page has a timeline at the bottom with which visitors can slide a point on the timeline to see the state of the globe at that given point in time. Therefore, the globe database must always save its history so as to provide all the information as it was at that point in time.



##### Subpages | Project Profiles

Each project has its own dedicated page that opens when the project is pressed on. This page is the project’s profile with all its information, including:

&nbsp;	• Project name

&nbsp;	• Description

&nbsp;	• Link(s)

&nbsp;	• Lead implementing organisation

&nbsp;	• Partner implementing organisations

&nbsp;	• Location

&nbsp;	• Type of intervention

&nbsp;	• Target demographic

&nbsp;	• Number of lives improved

&nbsp;	• Timeline (start and end date)

&nbsp;	• Thematic area

&nbsp;	• Relevant SDGs and IFRC Five Global Challenges

&nbsp;	• Donations received / amount needed

&nbsp;	• Impact metrics

&nbsp;	• Project posts and multimedia gallery

This information is required to be filled out for every project. However, the impact metrics stand out because they are self-defined by the project implementor. When registering a project and filling out this information, the platform AI infers what impact the project aims to achieve and proposes impact metrics to measure. Then, through a guided conversation with the chatbot, the user can add, remove or improve on the impact metrics. In the project profile page, this is the only section that is customisable and changes depending on the project. Each metric is a self-defined block that tracks a certain parameter, e.g., number of trees planted, or number of trainings carried out. Once these metrics and their respective units are defined, the user only needs to update the value accordingly.

At any point in time, even after the project conclusion, the project owner can update its information. An emphasis is placed on maintaining the project posts and multimedia sections. Since visibility, awareness and transparency are important goals of ST, the platform will encourage users to post relevant content and upload multimedia on their project profile pages whenever possible, through notifications and reminders. ST can promote best practice procedures and emphasise that more content leads to more engagement and donations.

Users can subscribe to a project through a plus button by the project name which turns into a check when pressed on, with an additional popup saying “Subscribed” to signify a subscription. When subscribed users get notified when a project publishes new content.



##### Page 3 | Find Organisations

Like the “Find Projects” page, this page offers the same two views to find organisations, also with filtering and sorting capabilities. 

The first view, featuring the interactive globe, contains the same panel on the left side including:

&nbsp;	• An AI powered search bar to search for organisations by name or matching criteria

&nbsp;	• A location search bar to search for organisations based in certain regions (multiple select possible)

&nbsp;	• A tag list to find organisations operating in certain thematic areas including types of interventions (multiple select possible)

&nbsp;	• A tag list for targeted demographics

&nbsp;	• An age range input, to find organisations based on how long they have existed

&nbsp;	• An amount of project carried out range input, to find organisations who have carried out a certain amount of projects

&nbsp;	• A funding need range input, to find organisations requiring a certain amount of money

The second view, features a table, containing the same filters as above as well as added sorting features including by:

&nbsp;	• Number of followers the organisation has

&nbsp;	• Number of projects carried out

&nbsp;	• Number of ongoing projects

&nbsp;	• Funding amount needed

&nbsp;	• Project lifespan (how long it has existed)



##### Subpages | Organisation Profile

Like the project profile pages, each organisation has its own profile too, which can be opened by pressing on an organisation. This opens a page with the following information:

&nbsp;	• Organisation name

&nbsp;	• Description

&nbsp;	• Link(s)

&nbsp;	• Location (based in)

&nbsp;	• Number of projects carried out

&nbsp;	• Number of ongoing projects

&nbsp;	• Number of lives improved

&nbsp;	• Organisations partnered with (past and present)

&nbsp;	• Impact Metrics (a collective of the metrics defined in each individual project)

&nbsp;	• Project list (with search, filtering and sorting functions)

&nbsp;	• Gallery of posts 

&nbsp;	• Multimedia and publications (organisation and categorisation of which can be customised, e.g. a series of articles, or photo gallery or podcast series, etc.)

Here users can subscribe to an organisation to receive notifications when new content is published or projects are added (in the same way as one would subscribe to an individual project).



##### Page 4 | Feed

As previously mentioned, each project and organisation can post content, whether it’s news articles, research publication, video or podcast series, or some images with captions. To host this content, the platform will have its own dedicated feed page. This feed operates like any other, where anybody can make posts, subscribe, share and leave comments or likes. Additionally, in the feed, users can choose between three views, the first is a general view in which users can see popular posts, the second in which users only see content from projects and organisations that they follow, and the third in which users only see Watchdog Issues. For each project, the option to donate is made easily accessible. 

Individuals cannot make posts, any content posted must be in connection to a project or organisation. This makes sure that the content in the feed is relevant and informative, not random. However, registered and verified Watchdog Issues count as projects, under which content can be posted. ST will also have an account, sharing content on this feed.



##### Page 5 | Note Empathy

Note Empathy is the media branch of ST. This page is dedicated exclusively to showcasing the media and brand related work of ST. The page is linked to https://note-empathy.org/



##### Page 6 | Services

ST offers comparative intelligence consulting services and marketing services to projects and organisations registered in the platform. The overview of these services as well as the option to request them can be found on this platform.



##### Additional Pages | User Profiles

Upon account creation, user accounts have the following information that can be input or edited:

1. Name

2. Surname

3\. Nationality

4\. Organisation Name - If individuals don’t work for an organisation, they are labelled as “Independent” unless they have at least once created a verified Watchdog Issue, then they are labelled as “Watchdog.”

5\. User since…

6\. Portfolio - Here users can link all the projects, Watchdog Issues and organisations that they have been involved in, then independently inputting in what capacity their involved was and for how long.

7\. Subscribed to…

A user's account can be accessed by clicking on the profile icon top right of the screen, which opens a dropdown menu for “Profile”, “Settings” and “Sign out”.



