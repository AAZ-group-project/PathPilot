# PathPilot
## Overview
A route optimization system designed to improve delivery efficiency using smart path planning. It analyzes delivery locations, calculates the most efficient routes, and minimizes travel time and distance. By incorporating geographic data and dynamic routing strategies, PathPilot helps delivery teams reduce fuel costs, improve delivery times, and manage multiple delivery vehicles more effectively. Ideal for logistics operations and courier services. It will also provides a scalable foundation for real-time route adjustments, traffic-aware navigation, and priority-based scheduling in future iterations.

## Layout/Plan
### Basic functionaility 
1. Allow users to input locations 
    - User enters delivery stops with addresses
2. Geocoding
    - Convert addresses to lat/long
3. Single Route Optimization
    - Optimize route using nearest-neighbor algorithm
4. Routing Map Display
    - Show optimized route on interactive map

### Improvements/Further functionality
1. Live Traffic Data
    - Use Google Maps or Here Maps API
2. Priority Orders
    - Route high-priority stops first