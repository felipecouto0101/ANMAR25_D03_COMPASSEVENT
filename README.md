# Compass Event

## WHAT IS THE PROJECT
Compass Event is an event management system that allows users to create, manage, and register for events. It provides authentication, event management, registration capabilities, and email notifications.

## LIBRARIES USED
- **NestJS**: Backend framework
- **AWS SDK**: For DynamoDB, S3, and SES integration
- **Jest**: Testing framework
- **AWS CDK**: Infrastructure as code
- **JWT**: Authentication
- **Sharp**: Image processing
- **Multer**: File uploads
- **Class Validator**: DTO validation
- **AWS SES**: Email sending
- **ical-generator**: Calendar invitation generation

## INSTALLATION INSTRUCTIONS
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/ANMAR25_D03_COMPASSEVENT.git
   cd ANMAR25_D03_COMPASSEVENT
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (see example below)

4. Run the application:
   ```bash
   npm run start:dev
   ```

## ROUTES AND ROUTE RULES

### Authentication Routes

- **POST /auth/login**: Login with credentials
  - Body: `{ email, password }`
  - Returns: JWT token

### User Routes
- **POST /users**: Register a new user
  - Body: `{ name, email, password, role, phone }` + profile image file
  - Rules: Email must be unique, password must be strong, profile image is required
  - Note: Image will be processed and stored in S3

- **GET /users**: Search all users
  - Rules: Requires authentication

- **GET /users/{id}**: Get current user profile
  - Rules: Requires authentication

- **GET /users/verify-email**: Verify user email
  - Query params: `{ token }`
  - Rules: Token must be valid and not expired

- **PATCH /users/{id}**: Update current user profile
  - Body: `{ name, email, password, role, phone }` + optional profile image file
  - Rules: Requires authentication

- **DELETE /users/{id}**: Delete current user account
  - Rules: Requires authentication


### Event Routes
- **GET /events**: Get all events
  - Query params: `{ name, startDate, endDate, active, page, limit }`
  - Public route

- **GET /events/:id**: Get event by ID
  - Public route

- **POST /events**: Create a new event
  - Body: `{ name, description, date, location }` + image file
  - Rules: Requires organizer or admin role
  - Note: Creator is automatically registered for the event

- **PATCH /events/:id**: Update an event
  - Body: `{ name, description, date, location }` + optional image file
  - Rules: Only the creator or admin can update

- **DELETE /events/:id**: Delete an event (soft delete)
  - Rules: Only the creator or admin can delete

### Registration Routes
- **GET /registrations**: Get user registrations
  - Query params: `{ page, limit, userId }`
  - Rules: Users can see only their own registrations, organizers can see registrations for their events


- **POST /registrations**: Register for an event
  - Body: `{ eventId }`
  - Rules: Event must be active and in the future, user can't register twice

- **DELETE /registrations/:id**: Cancel registration
  - Rules: Users can cancel only their own registrations

```


**IMPORTANT**: The database should not be reloaded. The application uses AWS DynamoDB which persists data between application restarts.